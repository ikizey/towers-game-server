const TOWER_SLOTS = require('./TowerSlots');
const { Card } = require('./Card');
class TowerBuildError extends Error {
  constructor(message) {
    super(message);
  }
}

class Tower {
  #slots = [...Tower.#defaultSlots];
  #activeSlot = TOWER_SLOTS.BASE; //for completions

  static #emptySlot = null;
  static #defaultSlots = [Tower.#emptySlot, Tower.#emptySlot, Tower.#emptySlot];

  get items() {
    return [...this.#slots];
  }

  get nextEmptySlot() {
    if (this.isComplete) return null;

    return this.#slots.findIndex((slot) => slot === Tower.#emptySlot);
  }

  get lastBuiltSlot() {
    if (this.#isDestroyed) return null;
    if (this.isComplete) return TOWER_SLOTS.TOP;
    return this.nextEmptySlot - 1;
  }

  #cantBuild = (slots) => {
    const validSlots = slots.filter((slot) => slot === this.nextEmptySlot);
    return validSlots.length === 0;
  };

  get isComplete() {
    return this.#slots[TOWER_SLOTS.TOP] !== Tower.#emptySlot;
  }

  get #isDestroyed() {
    return this.#slots[TOWER_SLOTS.BASE] === Tower.#emptySlot;
  }

  #setNextActiveSlot = () => {
    if (!this.isComplete) return;
    this.nextActiveSlot();
  };

  nextActiveSlot = () => {
    if (this.#activeSlot === null) {
      this.#activeSlot = TOWER_SLOTS.TOP;
    } else if (this.#activeSlot === TOWER_SLOTS.BASE) {
      this.#activeSlot === null;
    } else {
      this.#activeSlot -= 1;
    }
  };

  unsetActiveSlot = () => {
    this.#activeSlot = null;
  };

  get activeSlot() {
    return this.#activeSlot;
  }

  get activeSlotItem() {
    return this.#activeSlot ? this.#slots[this.#activeSlot] : null;
  }

  get isActive() {
    return this.#activeSlot !== null;
  }

  build = (card) => {
    // if (this.#cantBuild(card.slots)) return; //TODO! Throw

    this.#slots[this.nextEmptySlot] = card;
    this.#setNextActiveSlot();
  };

  get #cantDestroyTop() {
    return this.lastBuiltSlot === Tower.#emptySlot;
  }

  destroyTop = () => {
    //TODO! throw if cant destroy top
    return this.#slots.splice(this.lastBuiltSlot, 1, Tower.#emptySlot);
  };

  get #cantDestroy() {
    return this.#cantDestroyTop || this.isComplete;
  }

  destroy = () => {
    //TODO! throw if cant destroy

    return this.#slots.splice(
      TOWER_SLOTS.BASE,
      Infinity,
      ...Tower.#defaultSlots
    );
  };
}

module.exports = { Tower, TowerBuildError };
