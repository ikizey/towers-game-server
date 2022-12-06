const { Cards } = require('./Cards');

class Hand extends Cards {
  constructor() {
    super([]);
  }

  get cardsList() {
    return [...this.cards];
  }

  getCards(...cardIndices) {
    return this.cards.filter((_, index) => cardIndices.includes(index));
  }

  get size() {
    return this.cards.length;
  }

  addCard(card) {
    this.cards.push(card);
  }

  addCards(...cards) {
    this.cards.push(...cards);
  }

  remove = (...cardIndices) => {
    if (cardIndices.length === 0) return;

    cardIndices.sort((a, b) => a - b);
    cardIndices.reverse();
    const cards = [];
    cardIndices.forEach((index) => {
      cards.push(this.cards.splice(index, 1));
    });

    return cards;
  };
}

module.exports = { Hand };
