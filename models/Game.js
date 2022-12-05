const { Dealer } = require('./Dealer');
const { Player } = require('../models/Player');
const { shuffle } = require('../globals');
const { Hand } = require('./Hand');

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

  #decreaseActions = () => {
    this.#currentPlayerActions -= 1;
  };

  #resetActions = () => {
    this.#currentPlayerActions = this.gameRules.ActionsPerTurn;
  };

  #resetLastPlayedRace = () => {
    this.#lastRace = undefined;
  };

  get currentPlayerActions() {
    return this.#currentPlayerActions;
  }

  get currentPlayer() {
    return this.#players[this.#currentPlayerIndex];
  }

  get currentPlayerIndex() {
    return this.#currentPlayerIndex;
  }

  begin = () => {
    const cardSets = [];
    this.#players.forEach((player) => {
      const cards = [];
      for (let i = this.gameRules.StartWithCards; i > 0; i -= 1) {
        const card = this.#dealer.askCard();
        player.drawCard(card);
        cards.push(card);
      }
      cardSets.push(cards);
    });
    return cardSets;
  };

  nextPlayer = () => {
    this.#currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.#playersAmount;
    this.#resetLastPlayedRace();
    this.#resetActions();
    return this.#currentPlayerIndex;
  };

  get canDrawCard() {
    return this.#dealer.canDeal;
  }

  playerDraw = () => {
    try {
      const card = this.#dealer.askCard();
      this.currentPlayer.draw(card);

      this.currentPlayer.decreaseActions();
      return card.id;
    } catch (error) {
      throw error;
    }
  };

  get #usableSlotsIndices() {
    //* gameController logic spilled
    return this.currentPlayer.towers
      .map((tower, index) =>
        tower.nextEmptySlot !== null
          ? tower.nextEmptySlot + index * 3 // magic
          : null
      )
      .filter((index) => index !== null);
  }

  get #currentPlayRaces() {
    return this.#lastRace
      ? [this.#lastRace]
      : [RACE.ELF, RACE.ORC, RACE.HUMAN, RACE.UNDEAD];
  }

  get currentPlayTargets() {
    //TODO!! INCORRECT
    //* gameController logic spilled
    const cards = this.currentPlayer.hand;
    const availableSlots = this.#usableSlotsIndices;
    return cards
      .filter((card) => this.#currentPlayRaces.includes(card.race))
      .map(
        (card) => availableSlots.map((slot) => card.slot === slot % 3) //reverse magic
      );
  }

  get workerPlayTargets() {
    //TODO!! INCORRECT
    //* gameController logic spilled
    const cards = this.currentPlayer.hand;
    const availableSlots = this.#usableSlotsIndices;
    return cards.map(
      (card) => availableSlots.map((slot) => card.slot === slot % 3) //reverse magic
    );
  }

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

  build = (cardIndex, targetSlotIndex) => {
    //* gameController logic spilled
    if (!this.currentPlayTargets[cardIndex]?.includes(targetSlotIndex)) {
      throw new ActionError("You can't build this tower with this card!");
    }
    const cardRace = this.currentPlayer.cards[cardIndex].race;
    if (!this.currentPlayRaces.includes(cardRace)) {
      throw new ActionError('You can only play same race card!');
    }

    const cardId = this.currentPlayer.cards[cardIndex].id;
    const towerIndex = Math.floor(targetSlotIndex / 3);
    const card = this.currentPlayer.discardCards([cardIndex])[0];
    const buildResult = this.currentPlayer.towers.buildTower(card, towerIndex);
    const result = { ...buildResult, cardId };
    this.#setBuildResults(result);
    this.#setLastPlayedRace(cardRace);

    this.#decreaseActions();

    return result;
  };

  get canSwap() {
    return (
      this.currentPlayer.hand.length < this.gameRules.SwapCardsRatio &&
      this.#dealer.canDeal
    );
  }

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

    const discardedCards = this.currentPlayer.discardCards(...cardIndices);
    this.#dealer.askBury(...discardedCards);

    const newCards = [...new Array(gainAmount)].map((_) =>
      this.#dealer.askCard()
    );
    newCards.forEach((card) => {
      this.currentPlayer.drawCard(card);
    });

    this.#decreaseActions();

    return { newCards, discardedCards };
  };

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
      const cards = [this.#dealer.askCard(), this.#dealer.askCard()];
      cards.forEach((card) => this.currentPlayer.draw(card));
      this.#removeGroup();
      return cards.map((card) => card.id);
    } catch (error) {
      throw error;
    }
  };

  groupWorker = (cardIndex, targetSlotIndex) => {
    if (!this.workerPlayTargets[cardIndex]?.includes(targetSlotIndex)) {
      throw new Error("You can't build this tower with this card!");
    }

    const cardId = this.currentPlayer.cards[cardIndex].id;
    const towerIndex = Math.floor(targetSlotIndex / 3);
    const card = this.currentPlayer.discardCards([cardIndex])[0];
    const buildResult = this.currentPlayer.towers.buildTower(card, towerIndex);
    this.#removeGroup();
    const result = { ...buildResult, cardId };
    this.#setBuildResults(result);

    return result;
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

  // get freePlayTargets() {
  //   const cards = this.#activeHandCards;
  //   const nextSlots = this.currentPlayer.towers.nextSlots;

  //   return cards.map((card) =>
  //     nextSlots.map((slot) =>
  //       card.slots.reduce(
  //         (prev, cur) => (prev ? prev : cur === slot ? cur : prev),
  //         null
  //       )
  //     )
  //   );
  // }

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
      const cards = [this.#dealer.askCard(), this.#dealer.askCard()];
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
