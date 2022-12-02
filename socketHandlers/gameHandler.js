const GAME_EVENTS = Object.freeze({
  SWAP_CARDS: 'swap-cards',
});

const gameHandler = (client) => {
  client.on(
    GAME_EVENTS.SWAP_CARDS,
    async ({ cardIndices }) =>
      await client.gameController.onSwapCards(cardIndices, client)
  );
};

module.exports = { gameHandler };
