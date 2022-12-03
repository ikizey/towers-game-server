const { Dealer } = require('./Dealer');
const { Player } = require('../models/Player');
const { shuffle } = require('../globals');

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
  #playersAmount;
  #currentPlayerActions = 0;
  //warCry
  activeWarCryRace = false;
  warCryDone;
  //
  activeGroups;
  //completed Tower
  activeTowerIndex;

  constructor(...clients) {
    const players = clients.map(
      (client) => new Player(client.uid, client.name, this.gameRules.MaxTowers)
    );

    this.#playersAmount = players.length;
    shuffle(players);
    this.players = players;
  }

  get playersInfo() {
    return this.#players.map((player) => ({
      id: player.id,
      name: player.name,
    }));
  }

  #decreaseActions = () => {
    this.#currentPlayerActions -= 1;
  };

  #resetActions = () => {
    this.#currentPlayerActions = this.gameRules.ActionsPerTurn;
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
  //* gameController logic spilled
  get #usableSlotsIndices() {
    return this.currentPlayer.towers
      .map((tower, index) =>
        tower.nextEmptySlot !== null
          ? tower.nextEmptySlot + index + index * 2 // magic
          : null
      )
      .filter((index) => index !== null);
  }
  //* gameController logic spilled
  get currentPlayTargets() {
    const cards = this.currentPlayer.hand;
    const availableSlots = this.#usableSlotsIndices;

    return cards.maps(
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

  //* gameController logic spilled
  build = (cardIndex, targetSlotIndex) => {
    if (!this.currentPlayTargets[cardIndex]?.includes(targetSlotIndex)) {
      throw new ActionError("You can't build this tower with this card!");
    }

    const cardId = this.currentPlayer.cards[cardIndex].id;
    const towerIndex = Math.floor(targetSlotIndex / 3);
    const card = this.currentPlayer.discardCards([cardIndex])[0];
    const buildResult = this.currentPlayer.towers.buildTower(card, towerIndex);
    const result = { ...buildResult, cardId };
    this.#setBuildResults(result);

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
      throw new ActionError(`Not Enough cards in the deck. Choose less cards`);
    }

    this.currentPlayer.discardCards(...cardIndices);

    let gotCardsIds = [];
    for (let amount = gainAmount; amount > 0; amount -= 1) {
      const card = this.#dealer.askCard();
      gotCardsIds.push(card);
      this.currentPlayer.drawCard(card);
    }

    this.#decreaseActions();

    return gotCardsIds;
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
}

module.exports = {
  Game,
  ActionError,
  WarCryError,
};
