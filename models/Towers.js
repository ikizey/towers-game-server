const { Tower } = require('./Tower');

class Towers {
  #towers = [];

  constructor(towersNum) {
    this.towers = [...new Array(towersNum)].map((_, index) => new Tower(index));
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

  getTower = (id) => {
    const index = this.#towers.findIndex((tower) => tower.id === id);
    return this.#towers[index];
  };

  buildTower = (card, towerIndex) => {
    this.#towers[towerIndex].build(card);
  };
}

module.exports = { Towers };
