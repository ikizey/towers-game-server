const Mutex = require('async-mutex').Mutex;
const { Game } = require('../models/Game');
const { io } = require('../index');

const GAME_MSG = Object.freeze({
  NAME_ORDER_EXCHANGE: 'new-game-name-order-exchange',
  NEW_TURN: 'new-turn',
  PLAYER_GOT_CARDS: 'player-got-cards',
  PLAYER_LOST_CARDS: 'player-lost-cards',
  CARD_PLAYED: 'card-played',
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
  #activeMonoRace = false;
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

  #beginGame = () => {
    const cardSets = this.#game.begin();
    this.#clients.forEach((client, index) => {
      this.#whisper(client, CARDS_FROM_DECK, {
        cardIds: [...cardSets[index]],
      });
      this.#to(AllGAME_MSG.PLAYER_GOT_CARDS, {
        playerIndex: index,
        amount: gotCardsIds.length,
      });
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
      this.#whisper(client, PLAYER_MSG.CARDS_FROM_DECK, {
        cardIds: cardIds,
      });
      this.#announce(GAME_MSG.PLAYER_GOT_CARDS, {
        playerIndex: this.game.currentPlayer.index,
        amount: cardIds.length,
      });

      this.#checkForActions();
    } catch (error) {
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onSwapCards = async (cardIndices, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const cardIds = game.playerSwapCards(...cardIndices);
      this.#announce(GAME_MSG.PLAYER_LOST_CARDS),
        {
          playerId: this.#game.currentPlayer.id,
          lostCardIndices,
        };
      this.#whisper(client, PLAYER_MSG.CARDS_FROM_DECK, {
        cardIds: cardIds,
      });
      this.#announce(GAME_MSG.PLAYER_GOT_CARDS, {
        playerIndex: this.game.currentPlayer.index,
        amount: cardIds.length,
      });

      this.#checkForActions();
    } catch (error) {
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onPlayCard = async (cardIndex, targetSlotIndex, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const result = (playerPlay = (cardIndex, targetSlotIndex));
      if (result.isComplete) {
        this.#activeMonoRace = result.monoRace;
        this.#activeGroups = result.groups;
        this.#activeTowerIndex = result.index;
      }

      this.#announce(GAME_MSG.CARD_PLAYED, {
        playerIndex: this.game.currentPlayerIndex,
        cardIndex,
        targetSlotIndex,
        cardId: result.cardId,
      });

      //TODO send Fear(monoRace)
      //TODO send activeGroup in fear
      this.#checkForActions();
    } catch (error) {
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onEndFear() {} //TODO
  onEndGroup() {} //TODO
}

module.exports = { GameController };
