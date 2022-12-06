const { Dealer } = require('./Dealer');
const { Player } = require('../models/Player');
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
  #players = [];
  #currentPlayerIndex = -1;
  #currentPlayerActions = 0;
  #gameLastStage; //Action, Group, Worker, Engineer
  #lastRace;
  //warCry
  activeWarCryRace = false;
  warCryDone;
  //groups
  activeGroups;
  //completed Tower
  activeTowerIndex;

  //ENGINEER GROUP
  #engineerHand = new Hand();
  //engWarCry
  engActiveWarCryRace = false;
  engWarCryDone;
  //engGroups
  engActiveGroups;
  //completed Tower
  activeTowerIndex;

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
    this.#lastRace = undefined;
  };

  get currentPlayerActions() {
    return this.#currentPlayerActions;
  }

  #getPlayer = (index) => {
    this.#players[index];
  };

  get currentPlayer() {
    return this.#getPlayer(this.#currentPlayerIndex);
  }

  get currentPlayerIndex() {
    return this.#currentPlayerIndex;
  }

  #cardsDeckToPlayer = (cardsAmount, playerIndex) => {
    const _playerIndex = playerIndex || this.#currentPlayerIndex;
    const cards = this.#dealer.askCards(cardsAmount);
    this.#getPlayer(_playerIndex).drawCards(cards);
    return cards;
  };

  #cardsPlayerToGraveyard = (cardIndices, playerIndex) => {
    const _playerIndex = playerIndex || this.#currentPlayerIndex;
    const player = this.#players[_playerIndex];
    const discardedCards = player.discardCards(...cardIndices);
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

  #setBuildResults = (result) => {
    if (result.isComplete) {
      this.activeWarCry = result.monoRace;
      this.activeGroups = result.groups;
      this.activeTowerIndex = result.index;
      if (result.monoRace) {
        this.warCryDone = this.#players.map((_) => 0);
      }
    }
  };

  #setLastPlayedRace = (race) => {
    if (this.#lastRace) return;
    this.#lastRace = race;
  };

  build = (cardIndex, towerIndex) => {
    const cardSlots = this.#activeHandCards[cardIndex].slots;
    const cardRace = this.#activeHandCards[cardIndex].race;
    const towerNextSlot = this.currentPlayer.towers.nextSlots[towerIndex];

    if (!cardSlots.includes(towerNextSlot)) {
      throw new Error("You can't build this tower with this card!");
    }
    if (!this.#lastRace === cardRace) {
      throw new Error('You can only play same race card!');
    }

    const card = this.#takeCardFromActiveHand([cardIndex])[0];
    const buildResult = this.currentPlayer.towers.buildTower(card, towerIndex);
    const result = { ...buildResult, card };
    this.#setBuildResults(result);
    this.#setLastPlayedRace(cardRace);

    this.#spendAction();
    return result;
  };

  groupWorker = (cardIndex, towerIndex) => {
    const cardSlots = this.#activeHandCards[cardIndex].slots;
    const towerNextSlot = this.currentPlayer.towers.nextSlots[towerIndex];
    if (!cardSlots.includes(towerNextSlot)) {
      throw new Error("You can't build this tower with this card!");
    }

    const card = this.#takeCardFromActiveHand([cardIndex])[0];
    const buildResult = this.currentPlayer.towers.buildTower(card, towerIndex);
    const result = { ...buildResult, cardId };
    this.#setBuildResults(result);

    this.#removeGroup();
    return result;
  };

  get canSwap() {
    return (
      this.currentPlayer.hand.length >= this.gameRules.SwapCardsRatio &&
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

    player.discardCards(...cardIndices);
    this.warCryDone[playerIndex] = discardAmount;

    if (this.#warCryIsDone) {
      this.activeWarCryRace = false;
      this.warCryDone = undefined;
    }
  };

  #removeGroup = () => {
    this.activeGroups.splice(0, 1);
  };

  #resetGroups = () => {
    this.activeGroups.splice(0);
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
    return this.#players.towers.map((_, index) =>
      index === this.currentPlayerIndex
        ? []
        : this.towers.map((tower) => tower.currentSlot)
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

    const cards = this.#players[targetPlayerIndex].towers.destroy(towerIndex);
    this.#dealer.askBury(cards);
    this.#removeGroup();

    return cards;
  };

  get isEngineerActive() {
    return this.#engineerHand.size > 0;
  }

  get #activeHandCards() {
    return this.isEngineerActive
      ? this.#engineerHand.cards
      : this.currentPlayer.hand.cards;
  }

  get freePlayTargets() {
    const cards = this.#activeHandCards;
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
    const cards = this.#activeHandCards;
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
      cards.forEach((card) => {
        this.#engineerHand.draw(card);
      });

      return cards;
    } catch (error) {
      throw error;
    }
  };

  #setEngBuildResults = (result) => {
    if (result.isComplete) {
      this.engActiveWarCry = result.monoRace;
      this.engActiveGroups = result.groups;
      this.engActiveTowerIndex = result.index;
      if (result.monoRace) {
        this.engWarCryDone = this.#players.map((_) => 0);
      }
    }
  };

  #takeCardFromActiveHand = (...cardIndices) => {
    return this.isEngineerActive
      ? this.#engineerHand.remove(...cardIndices)
      : this.currentPlayer.discardCards(cardIndices);
  };

  groupEngineerPlay = (cardIndex, towerIndex) => {
    if (!this.PlayTargets[cardIndex]?.includes(towerIndex)) {
      throw new Error("You can't build this tower with this card!");
    }
    const cardRace = activeHandCards[cardIndex].race;
    if (!this.#lastRace === cardRace) {
      throw new Error('You can only play same race card!');
    }

    const card = this.#takeCardFromActiveHand([cardIndex])[0];
    const buildResult = this.currentPlayer.towers.buildTower(card, towerIndex);
    const result = { ...buildResult, discardCard: card };
    this.#setEngBuildResults(result);

    return result;
  };
}

module.exports = {
  Game,
  ActionError,
  WarCryError,
  GroupError,
};
