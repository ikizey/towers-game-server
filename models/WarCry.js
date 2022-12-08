class WarCry {
  #isDone = false;
  #discardRatio = 2;
  #race;
  #discardedCards;

  constructor(race) {
    this.#race = race;
  }

  get discardedCards() {
    return [...this.#discardedCards];
  }
  /// if player have no cards, discards nothing
  /// if player have just one card = one card to discard
  /// player can discard 1 card of warcry race
  /// player can discard 2 cards of other races

  // #checkWrongCards = (discardAmount, cardRacesToDiscard) => {
  //   return (
  //     (discardAmount === 1 && !cardRacesToDiscard.includes(this.#race)) ||
  //     (discardAmount === 2 && cardRacesToDiscard.includes(this.#race))
  //   );
  // };

  #checkTooFewCards = (discardAmount, cardRacesToDiscard) => {
    return (
      (cardRacesToDiscard.includes(this.#race) && discardAmount < 1) ||
      (!cardRacesToDiscard.includes(this.#race) && discardAmount < 2)
    );
  };

  #checkTooManyCards = (discardAmount, cardRacesToDiscard) => {
    return (
      (cardRacesToDiscard.includes(this.#race) && discardAmount > 1) ||
      (!cardRacesToDiscard.includes(this.#race) && discardAmount > 2)
    );
  };

  warCryDiscard = (playerIndex, lastCards = false, ...cards) => {
    if (!lastCards) {
      const discardAmount = cards.length;
      const cardRaces = cards.map((card) => card.race);
      if (this.#checkWrongCards(discardAmount, cardRaces)) {
        throw new WarCryError(`Wrong cards.`);
      }
      if (this.#checkTooFewCards(discardAmount, cardRaces)) {
        throw new WarCryError(`You must discard more cards.`);
      }
      if (this.#checkTooManyCards(discardAmount, cardRaces)) {
        throw new WarCryError(`You must discard less cards.`);
      }

      this.#discardedCards[playerIndex] = discardAmount;
    } else {
      if (cards.length > 0) {
      }
    }
  };
}
