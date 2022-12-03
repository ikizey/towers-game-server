const GAME_EVENTS = Object.freeze({
  DRAW_CARD: 'draw-card', //on player chooses to draw a card
  SWAP_CARDS: 'swap-cards', //on player chooses cards to swap
  PLAY_CARD: 'play-card', // on player chooses card to play and target slot
  RESOLVE_CARD: 'resolve-card', //after card is played...
  RESOLVE_WAR_CRY: 'resolve-war-cry', //on EACH player, BUT CURRENT select card to discard
  RESOLVE_GROUP: 'resolve-group', //after effect of the group is played
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
      await client.gameController.onBuild(cardIndex, targetSlotIndex, client)
  );

  client.on(
    GAME_EVENTS.RESOLVE_CARD,
    async () => await client.gameController.onStartCardResolution(client)
  );

  client.on(
    GAME_EVENTS.RESOLVE_WAR_CRY,
    async ({ cardIndices }) =>
      await client.gameController.onWarCryResolution(cardIndices, client)
  );
};

module.exports = { gameHandler };
