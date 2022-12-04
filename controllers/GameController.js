const Mutex = require('async-mutex').Mutex;
const { Game, ActionError, GroupError } = require('../models/Game');
const GROUP = require('../models/Group');
const { io } = require('../index');

const GAME_MSG = Object.freeze({
  NAME_ORDER_EXCHANGE: 'new-game-name-order-exchange',
  NEW_TURN: 'new-turn',
  PLAYER_GOT_CARDS: 'player-got-cards',
  PLAYER_LOST_CARDS: 'player-lost-cards',
  CARDS_DISCARDED: 'cards-discarded',
  CARD_PLAYED: 'card-played',
  WAR_CRY: 'war-cry',
  GROUP: 'group',
  GROUP_FAILED: 'group-failed',
  CARD_LEAVE_TOWER: 'card-leave-tower',
});

const PLAYER_MSG = Object.freeze({
  NEW_PHASE: 'new-phase',
  CARDS_FROM_DECK: 'cards-from-deck',
  GROUP_NONE: 'group-none',
  GROUP_ENGINEER: 'group-engineer',
  GROUP_ORACLE: 'group-oracle',
  GROUP_WORKER: 'group-worker',
  GROUP_MAGE: 'group-mage',
  GROUP_BOMBER: 'group-bomber',
  GROUP_SABOTEUR: 'group-saboteur',
});

class GameController {
  #game;
  #server;
  #gameId;
  #clients;
  #mutex = new Mutex();

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

  get #currentPlayerClient() {
    return this.#clients[this.#game.currentPlayerIndex];
  }

  #announceCardsAddedToHand = (amount, index) => {
    this.#announce(GAME_MSG.PLAYER_GOT_CARDS, {
      playerIndex: index || this.#game.currentPlayer.index,
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
    const canDraw = this.#game.canDrawCard;
    const canSwap = this.#game.canSwap;
    const canPlay = this.#game.currentPlayTargets;
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
      this.#announceCardsAddedToHand(cardIds.length, null);

      this.#checkForActions();
    } catch (error) {
      this.#beginAction();
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #announceCardsLeaveHand = (playerIndex, ...cardIndices) => {
    this.#announce(GAME_MSG.PLAYER_LOST_CARDS),
      {
        playerIndex: playerIndex || this.#game.currentPlayerIndex,
        cardIndices,
      };
  };

  #announceCardsAddedToDiscard = (...discardedCardsIds) => {
    this.#announce(GAME_MSG.CARDS_DISCARDED, { cardIds: discardedCardsIds });
  };

  onSwapCards = async (cardIndices, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const { newCards, discardedCards } = this.#game.swapCards(...cardIndices);
      const newCardIds = newCards.map((card) => card.id);
      const discardedCardsIds = discardedCards.map((card) => card.id);
      this.#announceCardsLeaveHand(null, ...cardIndices);
      this.#announceCardsAddedToDiscard(...discardedCardsIds);
      this.#whisperCardsAddedToHand(client, newCardIds);
      this.#announceCardsAddedToHand(newCardIds.length, null);

      this.#checkForActions();
    } catch (error) {
      this.#beginAction();
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #announceBuilt = (cardIndex, targetSlotIndex, cardId) => {
    this.#announce(GAME_MSG.CARD_PLAYED, {
      playerIndex: this.#game.currentPlayerIndex,
      cardIndex,
      targetSlotIndex,
      cardId,
    });
  };

  #checkForGroups = () => {
    if (this.#game.activeGroups.length > 0) {
      this.#whisperGroup(this.#currentPlayerClient);
    } else {
      this.#checkForActions();
    }
  };

  onBuild = async (cardIndex, targetSlotIndex, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const result = this.#game.build(cardIndex, targetSlotIndex);
      this.#announceBuilt(cardIndex, targetSlotIndex, result.cardId);
    } catch (error) {
      this.#beginAction();
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #announceWarCry = () => {
    this.#announce(GAME_MSG.WAR_CRY, {
      playerIndex: this.#game.currentPlayerIndex,
      race: this.#game.activeWarCryRace,
    });
  };

  #whisperWarCry = (client) => {
    this.#whisper(client, GAME_MSG.WAR_CRY, {
      playerIndex: this.#game.currentPlayerIndex,
      race: this.#game.activeWarCryRace,
    });
  };

  get #activeGroupSlot() {
    const towerIndex = this.#game.activeTowerIndex;
    const slot = this.#game.activeGroups.length - 1;
    return towerIndex * 3 + slot;
  }

  get #activeGroup() {
    return this.#game.activeGroups.slice(-1);
  }

  get #groupData() {
    const source = this.#activeGroupSlot;
    if (this.#activeGroup === GROUP.NONE) {
      return { type: PLAYER_MSG.GROUP_NONE, data: { source } }; //+
    } else if (this.#activeGroup === GROUP.ENGINEER) {
      return { type: PLAYER_MSG.GROUP_ENGINEER, data: { source } }; //TODO! hard one
    } else if (this.#activeGroup === GROUP.ORACLE) {
      return { type: PLAYER_MSG.GROUP_ORACLE, data: { source } }; //+
    } else if (this.#activeGroup === GROUP.WORKER) {
      const canPlay = this.#game.workerPlayTargets;
      return { type: PLAYER_MSG.GROUP_WORKER, data: { source, canPlay } }; //+
    } else if (this.#activeGroup === GROUP.MAGE) {
      const gameTargetSets = this.#game.MageTargets;
      const enemyTargets = gameTargetSets.map((set) =>
        set
          .map((slot, index) => (slot !== null ? index + slot * 3 : null))
          .filter((slot) => slot !== null)
      );
      return { type: PLAYER_MSG.GROUP_MAGE, data: { source, enemyTargets } }; //+
    } else if (this.#activeGroup === GROUP.BOMBER) {
      return { type: PLAYER_MSG.GROUP_BOMBER, data: { source } }; //TODO!
    } else if (this.#activeGroup === GROUP.SABOTEUR) {
      const gameTargets = this.#game.saboteurTargets;
      const targets = gameTargets
        .map((slot, index) => (slot !== null ? index + slot * 3 : null))
        .filter((slot) => slot !== null);
      return { type: PLAYER_MSG.GROUP_SABOTEUR, data: { source, targets } }; //+
    }
  }

  #whisperGroup = (client) => {
    this.#whisper(client, this.#groupData.type, this.#groupData.data);
  };

  onStartCardResolution = async (client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    try {
      if (this.#game.activeWarCryRace) {
        this.#announceWarCry();
      } else if (this.#game.activeGroups.length > 0) {
        this.#whisperGroup(this.#currentPlayerClient);
      } else {
        this.#checkForActions();
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #isAlreadyDiscarded = (playerIndex) => {
    return (
      this.#game.warCryDone[playerIndex] >= this.#game.gameRules.WarCryDiscard
    );
  };

  #playerIndex = (clientUid) => {
    return this.#clients.findIndex((client) => client.uid === clientUid);
  };

  onWarCryResolution = async (cardIndices, client) => {
    const release = await this.#mutex.acquire();
    const playerIndex = this.#playerIndex(client.uid);
    if (this.#isAlreadyDiscarded(playerIndex)) return;
    try {
      this.#game.WarCryDiscard(playerIndex, ...cardIndices);
      this.#announceCardsLeaveHand(playerIndex, ...cardIndices);

      if (!this.#game.activeWarCryRace) {
        this.#whisperGroup(this.#currentPlayerClient);
      }
    } catch (error) {
      this.#whisperWarCry(client);
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onGroupFailed = async (client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    try {
      this.#game.groupFailed();
      this.#checkForActions();
    } catch (error) {
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onGroupNone = async (client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    try {
      this.#game.groupNone();

      this.#checkForGroups();
    } catch (error) {
      this.#whisperGroup(this.#currentPlayerClient);
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onGroupOracle = async (client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    if (this.#game.currentPlayerActions < 1) return;
    try {
      const cardIds = this.#game.groupOracle();
      this.#whisperCardsAddedToHand(client, cardIds);
      this.#announceCardsAddedToHand(cardIds.length, null);

      this.#checkForGroups();
    } catch (error) {
      if (error instanceof GroupError) {
        this.#whisper(client, GAME_MSG.GROUP_FAILED, {});
      } else {
        this.#whisperGroup(this.#currentPlayerClient);
      }
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onGroupWorker = async (cardIndex, targetSlotIndex, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;

    const release = await this.#mutex.acquire();
    try {
      const result = this.#game.groupWorker(cardIndex, targetSlotIndex);
      this.#announceBuilt(cardIndex, targetSlotIndex, result.cardId);

      this.#checkForGroups();
    } catch (error) {
      if (error instanceof GroupError) {
        this.#whisper(client, GAME_MSG.GROUP_FAILED, {});
      } else {
        this.#whisperGroup(this.#currentPlayerClient);
      }
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  #announceCardLeaveTower = (playerIndex, slotIndex, cardId) => {
    this.#announce('card-leave-tower', playerIndex, slotIndex, cardId);
  };

  onGroupSaboteur = async (targetPlayerIndex, targetSlotIndex, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;
    const release = await this.#mutex.acquire();
    try {
      const towerIndex = Math.floor(targetSlotIndex / 3);
      const card = this.#game.groupSaboteur(targetPlayerIndex, towerIndex);
      const cardId = card.id;
      this.#announceCardLeaveTower(targetPlayerIndex, targetSlotIndex, cardId);

      this.#checkForGroups();
    } catch (error) {
      this.#whisperGroup(this.#currentPlayerClient);
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };

  onGroupMage = async (targetPlayerIndex, targetSlotIndex, client) => {
    if (this.#isNotCurrentPlayer(client.uid)) return;
    const release = await this.#mutex.acquire();
    try {
      const card = this.#game.groupMage(targetPlayerIndex, targetSlotIndex);
      const cardIds = [card].map((card) => card.id);
      this.#announceCardLeaveTower(targetPlayerIndex, targetSlotIndex, card.id);
      this.#whisperCardsAddedToHand(client, cardIds);
      this.#announceCardsAddedToHand(cardIds.length, null);

      this.#checkForGroups();
    } catch (error) {
      this.#whisperGroup(this.#currentPlayerClient);
      client.emit('error', { message: error.message });
    } finally {
      release();
    }
  };
}

module.exports = { GameController };
