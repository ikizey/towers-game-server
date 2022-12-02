const GAME_EVENTS = Object.freeze({
  DRAW_CARD: 'draw-card',
  SWAP_CARDS: 'swap-cards',
});

const gameHandler = (client) => {
  client.on(
    GAME_EVENTS.DRAW_CARD,
    async () => await client.gameController.onDrawCard(client)
  );

  client.on(
    GAME_EVENTS.SWAP_CARDS,
    async ({ cardIndices }) =>
      await client.gameController.onSwapCards(cardIndices, client)
  );
};

module.exports = { gameHandler };
