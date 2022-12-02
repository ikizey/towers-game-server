const { Cards } = require('./Cards');

class Hand extends Cards {
  constructor() {
    super([]);
  }

  get cardsList() {
    return this.cards.map((card) => card);
  }

  addCard(card) {
    this.cards.push(card);
  }

  remove = (...cardIndices) => {
    const indices = cardIndices.map((index) => index);
    indices.sort((a, b) => a - b);
    indices.reverse();
    indices.forEach((index) => {
      this.cards.splice(index, 1);
    });
  };
}

module.exports = { Hand };
