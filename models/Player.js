const { Hand } = require('./Hand');
const { Towers } = require('./Towers');

class Player {
  #id;
  name;
  #hand = new Hand();
  tempHand = new Hand();
  #towers;

  constructor(id, name, towersAmount) {
    this.#id = id;
    this.name = name;
    this.#towers = new Towers(towersAmount);
  }

  get id() {
    return this.#id;
  }

  get activeCards() {
    return [...this.#activeHand.cards];
  }

  get amountOfCards() {
    return this.hand.length;
  }

  getCards = (...cardIndices) => {
    return this.#activeHand.getCards(...cardIndices);
  };

  addCards = (cards, engHand = undefined) => {
    engHand ? this.tempHand.addCard(...cards) : this.#hand.addCards(...cards);
  };

  removeCards = (...cardIndices) => {
    return this.#activeHand.remove(...cardIndices);
  };

  get towers() {
    return this.#towers;
  }

  get #activeHand() {
    return this.tempHand.size > 0 ? this.tempHand : this.#hand;
  }

  build = (cardIndex, towerIndex) => {
    const card = this.removeCards([cardIndex])[0];
    this.#towers.buildTower(card, towerIndex);
  };
}

module.exports = { Player };
