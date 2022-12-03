const Mutex = require('async-mutex').Mutex;
const { Game } = require('../models/Game');
const { io } = require('../index');

const GAME_MSG = Object.freeze({
  NAME_ORDER_EXCHANGE: 'new-game-name-order-exchange',
  NEW_TURN: 'new-turn',
  PLAYER_GOT_CARDS: 'player-got-cards',
  PLAYER_LOST_CARDS: 'player-lost-cards',
  CARD_PLAYED: 'card-played',
  WAR_CRY: 'war-cry',
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
  #activeWarCry = false;
  #activeGroups = [];
  #activeTowerIndex = false;

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
      playerIndex: index || this.game.currentPlayer.index,
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
    const canDraw = this.game.canDrawCard;
    const canSwap = this.game.canSwap;
    const canPlay = this.game.currentPlayTargets;
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
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #announceCardsLeaveHand = () => {
    this.#announce(GAME_MSG.PLAYER_LOST_CARDS),
      {
        playerId: this.#game.currentPlayer.id,
        lostCardIndices,
      };
  };

  onSwapCards = async (cardIndices, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const cardIds = game.playerSwapCards(...cardIndices);
      this.#announceCardsLeaveHand();
      this.#whisperCardsAddedToHand(client, cardIds);
      this.#announceCardsAddedToHand(cardIds.length);

      this.#checkForActions();
    } catch (error) {
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #setBuildResults = (result) => {
    if (result.isComplete) {
      this.#activeWarCry = result.monoRace;
      this.#activeGroups = result.groups;
      this.#activeTowerIndex = result.index;
    }
  };

  #announceCardPlayed = (cardIndex, targetSlotIndex, cardId) => {
    this.#announce(GAME_MSG.CARD_PLAYED, {
      playerIndex: this.game.currentPlayerIndex,
      cardIndex,
      targetSlotIndex,
      cardId: cardId,
    });
  };

  onPlayCard = async (cardIndex, targetSlotIndex, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const result = playerPlay(cardIndex, targetSlotIndex);
      this.#setBuildResults(result);
      this.#announceCardPlayed(cardIndex, targetSlotIndex, result.cardId);
    } catch (error) {
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #announceWarCry = () => {
    this.#announce(GAME_MSG.WAR_CRY, {
      playerIndex: this.game.currentPlayerIndex,
      race: this.#activeWarCry,
    });
  };

  onStartCardResolution = async (client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    try {
      if (this.#activeWarCry) {
        this.#announceWarCry();
      } else if (this.#activeGroups.length > 0) {
        //TODO
      } else {
        this.#checkForActions();
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onEndGroup() {} //TODO
}

module.exports = { GameController };
