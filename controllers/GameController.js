const Mutex = require('async-mutex').Mutex;
const { Game, ActionError } = require('../models/Game');
const { io } = require('../index');

const GAME_MSG = Object.freeze({
  NAME_ORDER_EXCHANGE: 'new-game-name-order-exchange',
  NEW_TURN: 'new-turn',
  PLAYER_GOT_CARDS: 'player-got-cards',
  PLAYER_LOST_CARDS: 'player-lost-cards',
  CARD_PLAYED: 'card-played',
  WAR_CRY: 'war-cry',
  GROUP: 'group',
});

const PLAYER_MSG = Object.freeze({
  NEW_PHASE: 'new-phase',
  CARDS_FROM_DECK: 'cards-from-deck',
});

class GameController {
  #game;
  #server;
  #gameId;
  #clients;
  #mutex = new Mutex();

  constructor(...clients) {
    this.#server = io;

    clients.sort((p1, p2) => p1.uid - p2.uid);
    const gameId = clients
      .map((player) => player.uid)
      .reduce((prev, cur) => prev + '_' + cur);
    const game = new Game(...clients);

    this.#gameId = gameId;
    clients.forEach((client) => {
      client.join(gameId);
    });

    const playersInfo = game.playersInfo;
    this.#clients = playersInfo.map((player) =>
      clients.find((client) => client.uid === player.id)
    );
    this.#announce(GAME_MSG.NAME_ORDER_EXCHANGE, playersInfo);

    this.#game = game;

    this.#beginGame();
    this.#beginTurn();
    this.#beginAction();
  }

  #announce = (MessageType, data) => {
    this.#server.in(this.#gameId).emit(MessageType, data);
  };

  #whisper = (client, messageType, data) => {
    client.emit(messageType, data);
  };

  #isCurrentPlayer = (clientUid) => {
    return this.#game.currentPlayer.id === clientUid;
  };

  #isNotCurrentPlayer = (clientUid) => {
    return !this.#isCurrentPlayer(clientUid);
  };

  #announceCardsAddedToHand = (amount, index) => {
    this.#announce(GAME_MSG.PLAYER_GOT_CARDS, {
      playerIndex: index || this.#game.currentPlayer.index,
      amount: amount,
    });
  };

  #whisperCardsAddedToHand = (client, cardIds) => {
    this.#whisper(client, PLAYER_MSG.CARDS_FROM_DECK, {
      cardIds: cardIds,
    });
  };

  #beginGame = () => {
    const cardSets = this.#game.begin();
    this.#clients.forEach((client, index) => {
      this.#whisperCardsAddedToHand(client, [...cardSets[index]]);
      this.#announceCardsAddedToHand(cardSets[index].length, index);
    });
  };

  #beginTurn = () => {
    this.#game.nextPlayer();
    this.#announce(GAME_MSG.NEW_TURN, {
      playerIndex: this.#game.currentPlayerIndex,
    });
  };

  #beginAction = () => {
    const canDraw = this.#game.canDrawCard;
    const canSwap = this.#game.canSwap;
    const canPlay = this.#game.currentPlayTargets;
    const client = this.clients[this.#game.currentPlayerIndex];
    const actions = {
      canDraw,
      canPlay,
      canSwap, //TODO minmax cards to swap
    };
    this.#whisper(client, NEW_PHASE, actions);
  };

  #checkForActions = () => {
    if (this.#game.currentPlayerActions === 0) {
      this.#beginTurn();
    }
    if (this.#game.currentPlayerActions >= 0) {
      this.#beginAction();
      return;
    }
    console.error('Impossible happened! Player reached negative actions');
  };

  onDrawCard = async (client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const cardIds = [this.#game.playerDraw()];
      this.#whisperCardsAddedToHand(client, cardIds);
      this.#announceCardsAddedToHand(cardIds.length);

      this.#checkForActions();
    } catch (error) {
      this.#beginAction();
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #announceCardsLeaveHand = (playerIndex, ...cardIndices) => {
    this.#announce(GAME_MSG.PLAYER_LOST_CARDS),
      {
        playerIndex: playerIndex || this.#game.currentPlayerIndex,
        cardIndices,
      };
  };

  onSwapCards = async (cardIndices, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const cardIds = this.#game.swapCards(...cardIndices);
      this.#announceCardsLeaveHand(...cardIndices);
      this.#whisperCardsAddedToHand(client, cardIds);
      this.#announceCardsAddedToHand(cardIds.length);

      this.#checkForActions();
    } catch (error) {
      this.#beginAction();
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #announceBuilt = (cardIndex, targetSlotIndex, cardId) => {
    this.#announce(GAME_MSG.CARD_PLAYED, {
      playerIndex: this.#game.currentPlayerIndex,
      cardIndex,
      targetSlotIndex,
      cardId,
    });
  };

  onBuild = async (cardIndex, targetSlotIndex, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const result = this.#game.build(cardIndex, targetSlotIndex);
      this.#setBuildResults(result);
      this.#announceBuilt(cardIndex, targetSlotIndex, result.cardId);
    } catch (error) {
      this.#beginAction();
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #announceWarCry = () => {
    this.#announce(GAME_MSG.WAR_CRY, {
      playerIndex: this.#game.currentPlayerIndex,
      race: this.#game.activeWarCryRace,
    });
  };

  #whisperWarCry = (client) => {
    this.#whisper(client, GAME_MSG.WAR_CRY, {
      playerIndex: this.#game.currentPlayerIndex,
      race: this.#game.activeWarCryRace,
    });
  };

  #announceAbility = () => {
    this.#announce(GAME_MSG.GROUP, {});
  };

  onStartCardResolution = async (client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    try {
      if (this.#game.activeWarCryRace) {
        this.#announceWarCry();
      } else if (this.#game.activeGroups.length > 0) {
        this.#announceAbility();
      } else {
        this.#checkForActions();
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #isAlreadyDiscarded = (playerIndex) => {
    return (
      this.#game.warCryDone[playerIndex] >= this.#game.gameRules.WarCryDiscard
    );
  };

  #playerIndex = (clientUid) => {
    return this.#clients.findIndex((client) => client.uid === clientUid);
  };

  onWarCryResolution = async (cardIndices, client) => {
    const release = await this.#mutex.acquire();
    const playerIndex = this.#playerIndex(client.uid);
    if (this.#isAlreadyDiscarded(playerIndex)) return;
    try {
      this.#game.WarCryDiscard(playerIndex, ...cardIndices);
      this.#announceCardsLeaveHand(playerIndex, ...cardIndices);

      if (!this.#game.activeWarCryRace) {
        this.#announceAbility();
      }
    } catch (error) {
      this.#whisperWarCry(client);
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onEndGroup() {} //TODO
}

module.exports = { GameController };
