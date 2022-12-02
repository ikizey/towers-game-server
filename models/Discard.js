const { Cards } = require('./Cards');

class Discard extends Cards {
  get isEmpty() {
    return this.cards.length === 0;
  }

  show = () => this.cards.map((card) => ({ ...card }));

  add = (card) => {
    this.cards.push(card);
  };

  removeAll = () => {
    const cards = this.cards;
    this.cards = [];
    return cards;
  };
}

module.exports = { Discard };
