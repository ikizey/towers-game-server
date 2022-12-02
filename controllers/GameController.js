const Mutex = require('async-mutex').Mutex;
const { Game } = require('../models/Game');
const { io } = require('../index');

const MSG_TO_ALL = Object.freeze({
  PLAYER_LOST_CARDS: 'player-lost-cards',
  PLAYER_GOT_CARDS: 'player-got-cards',
});

const MSG_TO_PLAYER = Object.freeze({
  CARDS_FROM_DECK: 'cards-from-deck',
});

class GameController {
  #game;
  #server;
  #roomId;
  #mutex = new Mutex();

  constructor(...clients) {
    this.#server = io;

    clients.sort((p1, p2) => p1.uid - p2.uid);
    const gameId = clients
      .map((player) => player.uid)
      .reduce((prev, cur) => prev + '_' + cur);
    this.#roomId = gameId;

    clients.forEach((client) => {
      client.join(gameId);
    });

    this.#game = new Game(...clients);
  }

  #toAll = (MessageType, data) => {
    this.#server.in(this.#gameId).emit(MessageType, data);
  };

  #toClient = (client, messageType, data) => {
    client.emit(messageType, data);
  };

  #isCurrentPlayer = (clientUid) => {
    return this.#game.currentPlayer.id === clientUid;
  };

  #isNotCurrentPlayer = (clientUid) => {
    return !this.#isCurrentPlayer(clientUid);
  };

  onSwapCards = async ({ cardIndices, client }) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    try {
      const gotCardsIds = game.playerSwapCards(...cardIndices);
      this.#toAll(MSG_TO_ALL.PLAYER_LOST_CARDS),
        {
          playerId: this.#game.currentPlayer.id,
          lostCardIndices,
        };
      this.#toClient(client, MSG_TO_PLAYER.CARDS_FROM_DECK, {
        cardIds: gotCardsIds,
      });
      this.#toAll(MSG_TO_ALL.PLAYER_GOT_CARDS, {
        playerId: this.#game.currentPlayer.id,
        amount: gotCardsIds.length,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  };
}

module.exports = { GameController };
