const ALL_CARDS = require('./AllCards');

class Card {
  #id = -1;
  constructor(id) {
    if (
      !id ||
      id < ALL_CARDS[0].id ||
      id > ALL_CARDS[ALL_CARDS.length - 1].id
    ) {
      throw new Error('invalid card id');
    }
    this.#id = id;
  }

  get id() {
    return this.#id;
  }

  get race() {
    return ALL_CARDS[this.#id].race;
  }

  get slots() {
    return ALL_CARDS[this.#id].slots;
  }

  get group() {
    return ALL_CARDS[this.#id].group;
  }

  sameRaceAs(other) {
    return this.race === other.race;
  }
}

module.exports = { Card };
