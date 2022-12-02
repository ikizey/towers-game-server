class Cards {
  #cards = [];

  constructor(cards) {
    this.#cards = cards || [];
  }

  get cards() {
    return this.#cards;
  }
}

module.exports = { Cards };
