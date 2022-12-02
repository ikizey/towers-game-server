const { Cards } = require('./Cards');

class Deck extends Cards {
  constructor(cards) {
    super(cards);
  }

  get isEmpty() {
    return this.cards.length === 0;
  }

  getTopCard() {
    return this.cards.pop();
  }
}

module.exports = { Deck };
