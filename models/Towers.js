const { Tower } = require('./Tower');

class Towers {
  #towers = [];

  constructor(towersNum) {
    this.towers = [...new Array(towersNum)].map((_) => new Tower());
  }

  get towers() {
    return this.#towers.filter((tower) => tower !== null);
  }

  get usableSlots() {
    const slots = this.towers.map((tower) => tower.nextEmptySlot);
    const uniqSlots = [...new Set(slots)];
    const nonNullSlots = uniqSlots.filter((slot) => slot !== null);

    if (nonNullSlots.length === 0) return null;
    return nonNullSlots;
  }

  get nextSlots() {
    return this.#towers.map((tower) => tower.nextEmptySlot);
  }

  get availSlots() {
    return [...new Set(this.nextSlots)].filter((slot) => slot !== null);
  }

  getTower = (id) => {
    const index = this.#towers.findIndex((tower) => tower.id === id);
    return this.#towers[index];
  };

  buildTower = (card, towerIndex) => {
    return this.#towers[towerIndex].build(card);
  };

  destroyTop = (towerIndex) => {
    return this.#towers[towerIndex].destroyTop();
  };

  destroy = (towerIndex) => {
    return this.#towers[towerIndex].destroy();
  };
}

module.exports = { Towers };
