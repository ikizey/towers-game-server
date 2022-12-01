const TOWER_SLOTS = require('./TowerSlots');

class TowerBuildError extends Error {
  constructor(message) {
    super(message);
  }
}

class Tower {
  #slots = [null, null, null]; // BASE, MIDDLE, TOP

  constructor(id) {
    this.id = id;
  }

  get nextEmptySlot() {
    if (this.isComplete) return null;

    return this.#slots.findIndex((slot) => slot === null);
  }

  get #currentSlot() {
    return this.nextEmptySlot === null
      ? TOWER_SLOTS.TOP
      : this.nextEmptySlot - 1;
  }

  #cantBuild = (slots) => {
    const validSlots = slots.filter((slot) => slot === this.nextEmptySlot);
    return validSlots.length === 0;
  };

  get id() {
    return this.#id;
  }

  get cards() {
    return this.#slots.filter((slot) => slot !== null);
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

  get isDestroyed() {
    return this.#slots[TOWER_SLOTS.BASE] === null;
  }

  build = (card) => {
    if (this.#cantBuild(card.slots)) return;

    this.#slots[this.nextEmptySlot] = card;
  };

  destroyTop = () => {
    const card = this.#slots[this.#currentSlot];
    this.#slots[this.#currentSlot] = null;
    return card;
  };

  destroy = () => {
    const cards = this.cards;
    this.#slots = [null, null, null];
    return cards;
  };

  get state() {
    //* {tower: this.id, slots: [bottom-card-id?, middle-card-id?, top-card-id?] }
    return { tower: this.#id, slots: this.cards.map((card) => card.id) };
  }
}

module.exports = { Tower, TowerBuildError };
