const GAME_EVENTS = Object.freeze({
  DRAW_CARD: 'draw-card', //on player chooses to draw a card
  SWAP_CARDS: 'swap-cards', //on player chooses cards to swap
  PLAY_CARD: 'play-card', // on player chooses card to play and target slot
  RESOLVE_CARD: 'resolve-card', //after card is played...
  RESOLVE_WAR_CRY: 'resolve-war-cry', //on EACH player, BUT CURRENT select card to discard
  RESOLVE_GROUP_FAILED: 'resolve-group-failed',
  RESOLVE_GROUP_NONE: 'resolve-group-none',
  RESOLVE_GROUP_ENGINEER_DRAW: 'resolve-group-engineer-draw',
  RESOLVE_GROUP_ENGINEER_RESOLVE: 'resolve-group-engineer-resolve',
  RESOLVE_GROUP_ORACLE: 'resolve-group-oracle',
  RESOLVE_GROUP_WORKER: 'resolve-group-worker',
  CANT_PLAY_CARD: 'cant-play-any-card',
  RESOLVE_GROUP_MAGE: 'resolve-group-mage',
  RESOLVE_GROUP_BOMBER: 'resolve-group-bomber',
  RESOLVE_GROUP_SABOTEUR: 'resolve-group-saboteur',
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
    GAME_EVENTS.CANT_PLAY_CARD,
    async () => await client.gameController.onCantPlayCard(client)
  );

  client.on(
    GAME_EVENTS.RESOLVE_WAR_CRY,
    async ({ cardIndices }) =>
      await client.gameController.onWarCryResolution(cardIndices, client)
  );

  client.on(
    GAME_EVENTS.RESOLVE_GROUP_FAILED,
    async () => await client.gameController.onGroupFailed(client)
  );

  client.on(
    GAME_EVENTS.RESOLVE_GROUP_NONE,
    async () => await client.gameController.onGroupNone(client)
  );

  client.on(
    GAME_EVENTS.RESOLVE_GROUP_ENGINEER_DRAW,
    async () => await client.gameController.onGroupEngineerDraw(client)
  );

  client.on(
    GAME_EVENTS.RESOLVE_GROUP_ORACLE,
    async () => await client.gameController.onGroupOracle(client)
  );

  client.on(
    GAME_EVENTS.RESOLVE_GROUP_WORKER,
    async ({ cardIndex, targetSlotIndex }) =>
      await client.gameController.onBuild(cardIndex, targetSlotIndex, client)
  );

  client.on(
    GAME_EVENTS.RESOLVE_GROUP_MAGE,
    async ({ targetPlayerIndex, targetSlotIndex }) =>
      await client.gameController.onGroupMage(
        targetPlayerIndex,
        targetSlotIndex,
        client
      )
  );

  client.on(
    GAME_EVENTS.RESOLVE_GROUP_BOMBER,
    async ({ targetPlayerIndex, targetTowerIndex }) =>
      await client.gameController.onGroupBomber(
        targetPlayerIndex,
        targetTowerIndex,
        client
      )
  );

  client.on(
    GAME_EVENTS.RESOLVE_GROUP_SABOTEUR,
    async ({ targetPlayerIndex, targetSlotIndex }) =>
      await client.gameController.onGroupSaboteur(
        targetPlayerIndex,
        targetSlotIndex,
        client
      )
  );
};

module.exports = { gameHandler };
