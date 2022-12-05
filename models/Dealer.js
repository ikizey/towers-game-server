const { Deck } = require('./Deck');
const { Discard } = require('./Discard');
const { shuffle } = require('../globals');

class Dealer {
  #deck;
  #graveYard = new Discard();

  constructor(cards) {
    const shuffled = cards.map((card) => card);
    shuffle(shuffled);
    this.#deck = new Deck(shuffled);
  }

  get CardsTotal() {
    return this.#deck.cards.length + this.#graveYard.cards.length;
  }

  get canDeal() {
    return this.#deck.isEmpty && this.#graveYard.isEmpty;
  }

  #restockDeck = () => {
    if (this.#graveYard.isEmpty) {
      throw new Error('Dealer: no more cards in the Game');
    }
    const cards = this.#graveYard.removeAll();
    this.#deck.cards = cards;
  };

  askCards = (amount) => {
    let cards = [];
    while (amount > 0) {
      const card = this.#deck.getTopCard();
      if (this.#deck.isEmpty) {
        this.#restockDeck();
      }
      cards.push(card);
      amount -= 1;
    }
    return cards;
  };

  askCard = () => {
    if (this.#deck.isEmpty) {
      if (this.#graveYard.isEmpty) {
        throw new Error('Dealer: no more cards in the Game');
      }
      const cards = this.#graveYard.removeAll();
      shuffle(cards);
      this.#deck.cards = cards;
    }
    const card = this.#deck.getTopCard();
    //TODO reshuffle, if empty after taking card
    return card;
  };

  askBury = (...cards) => {
    this.#graveYard.add(...cards);
  };

  askShowDead = () => {
    return this.cards.map((card) => ({ ...card.id }));
  };
}

module.exports = { Dealer };
