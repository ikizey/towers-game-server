const { Dealer } = require('./Dealer');
const { Player } = require('../models/Player');
const { shuffle } = require('../globals');

class Game {
  #gameRules = { ActionsPerTurn: 2, SwapCardsRatio: 2, MaxTowers: 5 };
  #dealer = new Dealer();
  #players = [];
  #currentPlayerIndex = 0;
  #playersAmount;
  #currentPlayerActions = 0;

  constructor(...clients) {
    const players = clients.map(
      (client) => new Player(client.uid, client.name, this.#gameRules.MaxTowers)
    );

    this.#playersAmount = players.length;
    shuffle(players);
    this.players = players;
  }

  #decreaseActions = () => {
    this.#currentPlayerActions -= 1;
  };

  #resetActions = () => {
    this.#currentPlayerActions = this.#gameRules.ActionsPerTurn;
  };

  get #currentPlayer() {
    return this.#players[this.#currentPlayerIndex];
  }

  get canDrawCard() {
    return this.#dealer.canDeal;
  }

  playerDraw = () => {
    try {
      const card = this.#dealer.askCard();
      this.#currentPlayer.draw(card);
      this.#currentPlayer.decreaseActions();
    } catch (error) {
      throw error;
    }
  };

  get playableCardIds() {
    const cards = this.#currentPlayer.hand;
    const availableSlots = this.#currentPlayer.towers.usableSlots;

    if (availableSlots === null) return null;
    return cards
      .filter((card) => card.slots.includes(availableSlots))
      .map((card) => card.id);
  }

  playerPlay = (cardId, towerId) => {
    if (!this.playableCardIds.includes(cardId)) return;

    const card = this.#currentPlayer.remove(cardId);
    this.#currentPlayer.towers.buildTower(card, towerId);
  };

  get canSwap() {
    return (
      this.#currentPlayer.hand.length < this.#gameRules.SwapCardsRatio &&
      this.#dealer.canDeal
    );
  }

  playerSwapCards = (...cardIndices) => {
    const lostAmount = cardIndices.length;
    if (lostAmount < this.#gameRules.SwapCardsRatio) {
      throw new Error(
        `Should swap at least ${this.#gameRules.SwapCardsRatio} cards.`
      );
    }

    const gainAmount = Math.floor(lostAmount / this.#gameRules.SwapCardsRatio);
    if (gainAmount > this.#dealer.CardsTotal) {
      throw new Error(`Not Enough cards in the deck. Choose less cards`);
    }

    this.#currentPlayer.discardCards(...cardIndices);

    let gotCardsIds = [];
    for (let amount = gainAmount; amount > 0; amount -= 1) {
      const card = this.#dealer.askCard();
      gotCardsIds.push(card);
      this.#currentPlayer.drawCard(card);
    }

    this.#decreaseActions();

    return gotCardsIds;
  };
}

module.exports = { Game };
