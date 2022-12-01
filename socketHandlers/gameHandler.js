const GAME_EVENTS = Object.freeze({
  SWAP_CARDS: 'swap-cards',
});

const gameHandler = (socket, gameController) => {
  socket.on(GAME_EVENTS.SWAP_CARDS);
};

module.exports = { gameHandler };
