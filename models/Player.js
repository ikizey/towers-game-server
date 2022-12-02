const { Hand } = require('./Hand');
const { Towers } = require('./Towers');

class Player {
  #id;
  name;
  #hand = new Hand();
  #towers;

  constructor(id, name, maxTowers) {
    this.#id = id;
    this.name = name;
    this.#towers = new Towers(maxTowers);
  }

  get id() {
    return this.#id;
  }

  get cards() {
    return this.#hand.cardsList;
  }

  get amountOfCards() {
    return this.cards.length;
  }

  drawCard = (card) => {
    this.#hand.add(card);
  };

  discardCards = (...cardIndices) => {
    return this.#hand.remove(...cardIndices);
  };

  get towers() {
    return this.#towers;
  }
}

module.exports = { Player };
