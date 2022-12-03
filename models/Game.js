const { Dealer } = require('./Dealer');
const { Player } = require('../models/Player');
const { shuffle } = require('../globals');

class Game {
  gameRules = Object.freeze({
    ActionsPerTurn: 2,
    SwapCardsRatio: 2,
    MaxTowers: 5,
    StartWithCards: 5,
  });
  #dealer = new Dealer();
  #players = [];
  #currentPlayerIndex = -1;
  #playersAmount;
  #currentPlayerActions = 0;

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

  //* gameController logic spilled
  playerPlay = (cardIndex, targetSlotIndex) => {
    if (!this.currentPlayTargets[cardIndex]?.includes(targetSlotIndex)) {
      throw new Error("You can't build this tower with this card!");
    }

    const cardId = this.currentPlayer.cards[cardIndex].id;
    const towerIndex = Math.floor(targetSlotIndex / 3);
    const card = this.currentPlayer.discardCards([cardIndex])[0];
    const buildResult = this.currentPlayer.towers.buildTower(card, towerIndex);
    const result = { ...buildResult, cardId };

    this.#decreaseActions();

    return result;
  };

  get canSwap() {
    return (
      this.currentPlayer.hand.length < this.gameRules.SwapCardsRatio &&
      this.#dealer.canDeal
    );
  }

  playerSwapCards = (...cardIndices) => {
    const lostAmount = cardIndices.length;
    if (lostAmount < this.gameRules.SwapCardsRatio) {
      throw new Error(
        `Should swap at least ${this.gameRules.SwapCardsRatio} cards.`
      );
    }

    const gainAmount = Math.floor(lostAmount / this.gameRules.SwapCardsRatio);
    if (gainAmount > this.#dealer.CardsTotal) {
      throw new Error(`Not Enough cards in the deck. Choose less cards`);
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
}

module.exports = { Game };
