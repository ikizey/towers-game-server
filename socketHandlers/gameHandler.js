const GAME_EVENTS = Object.freeze({
  DRAW_CARD: 'draw-card',
  SWAP_CARDS: 'swap-cards',
  PLAY_CARD: 'play-card',
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

  client.on(
    GAME_EVENTS.PLAY_CARD,
    async ({ cardIndex, targetSlotIndex }) =>
      await client.gameController.onPlayCard(cardIndex, targetSlotIndex, client)
  );
};

module.exports = { gameHandler };
