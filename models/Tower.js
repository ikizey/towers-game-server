const TOWER_SLOTS = require('./TowerSlots');

class TowerBuildError extends Error {
  constructor(message) {
    super(message);
  }
}

class Tower {
  #slots = [null, null, null]; // BASE, MIDDLE, TOP

  get nextEmptySlot() {
    if (this.isComplete) return null;

    return this.#slots.findIndex((slot) => slot === null);
  }

  get currentSlot() {
    if (this.isDestroyed) return null;
    if (this.isComplete) return TOWER_SLOTS.TOP;
    return this.nextEmptySlot - 1;
  }

  #cantBuild = (slots) => {
    const validSlots = slots.filter((slot) => slot === this.nextEmptySlot);
    return validSlots.length === 0;
  };

  get cards() {
    return this.#slots.filter((slot) => slot !== null).reverse();
  }

  get isComplete() {
    return this.#slots[TOWER_SLOTS.TOP] !== null;
  }

  get isIncomplete() {
    return !this.isComplete;
  }

  get isMonoRace() {
    if (this.isIncomplete) return;

    return (
      this.#slots[TOWER_SLOTS.BASE].sameRace(this.#slots[TOWER_SLOTS.MIDDLE]) &&
      this.#slots[TOWER_SLOTS.BASE].race.sameRace(
        this.#slots[TOWER_SLOTS.TOP].race
      )
    );
  }

  get #monoRace() {
    return this.isMonoRace ? this.cards[0].race : false;
  }

  get isDestroyed() {
    return this.#slots[TOWER_SLOTS.BASE] === null;
  }

  build = (card) => {
    // if (this.#cantBuild(card.slots)) return; //TODO! Throw

    this.#slots[this.nextEmptySlot] = card;

    if (this.isComplete) {
      return {
        isComplete: this.isComplete,
        monoRace: this.#monoRace,
        groups: this.cards.map((card) => card.group),
        index: this.#id,
      };
    }
    return { isComplete };
  };

  get #cantDestroyTop() {
    return this.currentSlot === null;
  }

  destroyTop = () => {
    //TODO! throw if cant destroy top
    return this.cards.splice(this.currentSlot, 1, null);
  };

  get #cantDestroy() {
    return this.#cantDestroyTop || this.isComplete;
  }

  destroy = () => {
    //TODO! throw if cant destroy
    const cards = this.cards;
    this.#slots = [null, null, null];
    return cards;
  };
}

module.exports = { Tower, TowerBuildError };
