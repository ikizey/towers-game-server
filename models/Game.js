const { Dealer } = require('./Dealer');
const { Player } = require('../models/Player');
const GROUP = require('./Group');
const { Hand } = require('./Hand');
const { shuffle, range } = require('../globals');

class ActionError extends Error {
  constructor(message) {
    super(message);
  }
}

class WarCryError extends Error {
  constructor(message) {
    super(message);
  }
}

class GroupError extends Error {
  constructor(message) {
    super(message);
  }
}
class Game {
  gameRules = Object.freeze({
    ActionsPerTurn: 2,
    SwapCardsRatio: 2,
    MaxTowers: 5,
    StartWithCards: 5,
    WarCryDiscardSameRace: 1,
    WarCryDiscardOtherRace: 2,
  });
  #dealer = new Dealer();
  #players = [new Player(), new Player(), new Player(), new Player()]; //for completion
  #currentPlayerIndex = -1;
  #currentPlayerActions = 0;
  #firstRace;
  warCryDone;

  constructor(...clients) {
    const players = clients.map(
      (client) => new Player(client.uid, client.name, this.gameRules.MaxTowers)
    );

    shuffle(players);
    this.players = players;
  }

  get playersInfo() {
    return this.#players.map((player) => ({
      id: player.id,
      name: player.name,
    }));
  }

  get #playersAmount() {
    return this.#players.length;
  }

  #spendAction = () => {
    this.#currentPlayerActions -= 1;
  };

  #resetActions = () => {
    this.#currentPlayerActions = this.gameRules.ActionsPerTurn;
  };

  #resetLastRace = () => {
    this.#firstRace = undefined;
  };

  get currentPlayerActions() {
    return this.#currentPlayerActions;
  }

  #getPlayer = (index) => {
    return this.#players[index];
  };

  get currentPlayer() {
    return this.#getPlayer(this.#currentPlayerIndex);
  }

  get currentPlayerIndex() {
    return this.#currentPlayerIndex;
  }

  get activeWarCryRace() {
    const races = this.#currentTowers.activeTowerItems?.map(
      (item) => item.race
    );
    return races.every((race) => race === races[0]) ? races[0] : null;
  }

  #cardsDeckToPlayer = (cardsAmount, playerIndex) => {
    const _playerIndex = playerIndex || this.#currentPlayerIndex;
    const cards = this.#dealer.askCards(cardsAmount);
    this.#getPlayer(_playerIndex).addCards(cards);
    return cards;
  };

  #cardsPlayerToGraveyard = (cardIndices, playerIndex) => {
    const _playerIndex = playerIndex || this.#currentPlayerIndex;
    const player = this.#players[_playerIndex];
    const discardedCards = player.removeCards(...cardIndices);
    this.#dealer.askBury(...discardedCards);
    return discardedCards;
  };

  begin = () => {
    return this.#players.map((_, index) =>
      this.#cardsDeckToPlayer(this.gameRules.StartWithCards, index)
    );
  };

  nextTurn = () => {
    this.#currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.#playersAmount;
    this.#resetLastRace();
    this.#resetActions();
    return this.#currentPlayerIndex;
  };

  get canDrawCard() {
    return this.#dealer.canDeal;
  }

  playerDraw = () => {
    try {
      const cards = this.#cardsDeckToPlayer(1);

      this.#spendAction();
      return cards;
    } catch (error) {
      throw error;
    }
  };

  swapCards = (...cardIndices) => {
    const lostAmount = cardIndices.length;
    if (lostAmount < this.gameRules.SwapCardsRatio) {
      throw new ActionError(
        `Should swap at least ${this.gameRules.SwapCardsRatio} cards.`
      );
    }

    const gainAmount = Math.floor(lostAmount / this.gameRules.SwapCardsRatio);
    if (gainAmount > this.#dealer.CardsTotal) {
      throw new ActionError('Not Enough cards in the deck. Choose less cards.');
    }

    const discardedCards = this.#cardsPlayerToGraveyard(cardIndices);
    const newCards = this.#cardsDeckToPlayer(gainAmount);

    this.#spendAction();

    return { newCards, discardedCards };
  };

  #setLastPlayedRace = (race) => {
    if (this.#firstRace) return;
    this.#firstRace = race;
  };

  get #currentTowers() {
    return this.currentPlayer.towers;
  }

  get activeGroup() {
    return this.#currentTowers.activeSlotItem?.group;
  }

  get activeGroupSlot() {
    return this.#currentTowers.activeSlot;
  }

  build = (cardIndex, towerIndex) => {
    const card = this.currentPlayer.getCards(cardIndex);
    const cardSlots = card.slots;
    const towerNextSlot = this.#currentTowers.nextSlots[towerIndex];

    if (!cardSlots.includes(towerNextSlot)) {
      throw new Error("You can't build this tower with this card!");
    }
    if (!this.#activeGroup === GROUP.WORKER) {
      const cardRace = card.race;
      if (!this.#firstRace === cardRace) {
        throw new Error('You can only play same race card!');
      }
    }

    this.#activeGroup ? this.#removeGroup() : this.#spendAction();
    this.currentPlayer.build(cardIndex, towerIndex);
    this.#setLastPlayedRace(card.race);
    return card;
  };

  get canSwap() {
    return (
      this.currentPlayer.cardsAmount >= this.gameRules.SwapCardsRatio &&
      this.#dealer.canDeal
    );
  }

  #checkWrongCards = (discardAmount, cardRacesToDiscard) => {
    return (
      (discardAmount === this.gameRules.WarCryDiscardSameRace &&
        !cardRacesToDiscard.includes(activeWarCry)) ||
      (discardAmount === this.gameRules.WarCryDiscardOtherRace &&
        cardRacesToDiscard.includes(activeWarCry))
    );
  };

  #checkTooFewCards = (discardAmount, cardRacesToDiscard) => {
    return (
      (cardRacesToDiscard.includes(activeWarCry) &&
        discardAmount < this.gameRules.WarCryDiscardSameRace) ||
      (!cardRacesToDiscard.includes(activeWarCry) &&
        discardAmount < this.gameRules.WarCryDiscardOtherRace)
    );
  };

  #checkTooManyCards = (discardAmount, cardRacesToDiscard) => {
    return (
      (cardRacesToDiscard.includes(activeWarCry) &&
        discardAmount > this.gameRules.WarCryDiscardSameRace) ||
      (!cardRacesToDiscard.includes(activeWarCry) &&
        discardAmount > this.gameRules.WarCryDiscardOtherRace)
    );
  };

  get #warCryIsDone() {
    return !this.warCryDone.some((discardAmount) => discardAmount === 0);
  }

  WarCryDiscard = (playerIndex, ...cardIndices) => {
    const player = this.#players[playerIndex];
    const discardAmount = cardIndices.length;
    const cardRacesToDiscard = player.cards
      .filter((_, index) => cardIndices.includes(index))
      .map((card) => card.race);
    if (this.#checkWrongCards(discardAmount, cardRacesToDiscard)) {
      throw new WarCryError(`Wrong cards.`);
    }
    if (this.#checkTooFewCards(discardAmount, cardRacesToDiscard)) {
      throw new WarCryError(`You must discard more cards.`);
    }
    if (this.#checkTooManyCards(discardAmount, cardRacesToDiscard)) {
      throw new WarCryError(`You must discard less cards.`);
    }

    player.removeCards(...cardIndices);
    this.warCryDone[playerIndex] = discardAmount;
  };

  #removeGroup = () => {
    this.currentPlayer.towers.nextActiveSlot();
  };

  #resetGroups = () => {
    this.currentPlayer.towers.unsetActiveSlot();
  };

  groupFailed = () => {
    this.#resetGroups();
  };

  groupNone = () => {
    this.#removeGroup();
  };

  groupOracle = () => {
    if (this.#dealer.CardsTotal < 2) {
      throw new GroupError('Not enough cards for group.');
    }

    try {
      const cards = this.#dealer.askCards(2);
      cards.forEach((card) => this.currentPlayer.draw(card));
      this.#removeGroup();
      return cards.map((card) => card.id);
    } catch (error) {
      throw error;
    }
  };

  get saboteurTargets() {
    return this.currentPlayer.towers.map((tower) => tower.currentSlot);
  }

  groupSaboteur = (targetPlayerIndex, towerIndex) => {
    if (targetPlayerIndex !== this.#currentPlayerIndex) {
      throw new Error('Wrong target! You must choose your own tower.');
    }

    const card = this.currentPlayer.towers.destroyTop(towerIndex);
    this.#dealer.askBury(card);
    this.#removeGroup();

    return card;
  };

  get MageTargets() {
    return this.#players.map((player, index) =>
      index === this.currentPlayerIndex
        ? []
        : player.towers.map((tower) => tower.currentSlot)
    );
  }

  groupMage = (targetPlayerIndex, towerIndex) => {
    if (targetPlayerIndex === this.currentPlayerIndex) {
      throw new Error('Wrong target! You must choose an opponent tower.');
    }

    const card = this.#players[targetPlayerIndex].towers.destroyTop(towerIndex);
    this.currentPlayer.drawCard(card);
    this.#removeGroup();

    return card;
  };

  get bomberTargets() {
    return this.#players.map((player, index) =>
      index === this.playerIndex
        ? []
        : player.towers
            .map((tower, index) => (tower.isComplete ? null : index))
            .filter((towerIndex) => towerIndex !== null)
    );
  }

  groupBomber = (targetPlayerIndex, towerIndex) => {
    if (targetPlayerIndex === this.currentPlayerIndex) {
      throw new Error('Wrong target! You must choose an opponent tower.');
    }

    const cards = this.#getPlayer(targetPlayerIndex).towers.destroy(towerIndex);
    this.#dealer.askBury(cards);
    this.#removeGroup();

    return cards;
  };

  get freePlayTargets() {
    const cards = this.currentPlayer.activeCards;
    const nextSlots = this.currentPlayer.towers.nextSlots;

    return cards.map((card) =>
      nextSlots.map((slot) =>
        card.slots.reduce(
          (prev, cur) => (prev ? prev : cur === slot ? cur : prev),
          null
        )
      )
    );
  }

  get playTargets() {
    const cards = this.currentPlayer.activeCards;
    const nextSlots = this.currentPlayer.towers.nextSlots;

    return cards.map((card) =>
      card.race === lastRace
        ? nextSlots.map((slot) =>
            card.slots.reduce(
              (prev, cur) => (prev ? prev : cur === slot ? cur : prev),
              null
            )
          )
        : []
    );
  }

  groupEngineerDraw = () => {
    try {
      const cards = this.#dealer.askCards(2);
      const isEngineerHand = true;
      this.currentPlayer.addCards(cards, isEngineerHand);

      return cards;
    } catch (error) {
      throw error;
    }
  };
}

module.exports = {
  Game,
  ActionError,
  WarCryError,
  GroupError,
};
