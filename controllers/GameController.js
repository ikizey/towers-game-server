const { Game } = require('../models/Game');
const { Player } = require('../models/Player');

class GameController {
  #game;
  #server;
  #roomId;

  constructor(io, ...clients) {
    this.#server = io;

    clients.sort((p1, p2) => p1.uid - p2.uid);
    const gameId = clients
      .map((player) => player.uid)
      .reduce((prev, cur) => prev + '_' + cur);
    this.#roomId = gameId;

    clients.forEach((client) => {
      client.join(gameId);
    });

    const players = clients.map(
      (client) => new Player(client.uid, client.name)
    );
    this.#game = new Game(...players);
  }

  get #currentPlayerId() {
    this.#game.currentPlayer.id;
  }

  onSwapCards = ({ gameId, cardIndices, player }) => {
    const game = this.#gameById(gameId);
    if (player.id !== this.#game.currentPlayer.id) return;
    try {
      const { gotCardsIds, lostCardsIndices } = game.playerSwapCards(
        player.id,
        ...cardIndices
      );
      this.#server
        .in(gameId)
        .emit('player-lost-cards', { playerId: player.id, lostCardIndices });
      player.emit('cards-from-deck', { cardIds: cardIndices });
      this.#server.in(gameId).emit('player-got-cards', {
        socket: player.id,
        amount: gotCardsIds.length,
      });
    } catch (error) {
      player.emit('error', { message: error.message });
    }
  };
}

module.exports = { GameController };
