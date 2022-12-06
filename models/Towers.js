const { Tower } = require('./Tower');

class Towers {
  #towers = [new Tower(), new Tower(), new Tower(), new Tower(), new Tower()]; //for completions

  constructor(towersAmount) {
    this.towers = [...new Array(towersAmount)].map((_) => new Tower());
  }

  #getTower(towerIndex) {
    return this.#towers[towerIndex];
  }

  get towers() {
    return this.#towers;
  }

  get nextSlots() {
    return this.#towers.map((tower) => tower.nextEmptySlot);
  }

  // get activeTowerIndex() {
  //   return this.#towers
  //     .map((tower, index) => (tower.activeTower ? index : undefined))
  //     .filter((towerIndex) => !!towerIndex)[0];
  // }

  get activeTower() {
    return this.#towers.filter((tower) => tower.activeSlot !== null)[0];
  }

  get activeSlot() {
    return this.activeTower.activeSlot;
  }

  get activeSlotItem() {
    return this.activeTower.activeSlotItem;
  }

  nextActiveSlot = () => {
    this.activeTower.nextActiveSlot();
  };

  unsetActiveSlot = () => {
    this.activeTower.unsetActiveSlot();
  };

  get activeTowerItems() {
    return this.activeTower.items;
  }

  buildTower = (card, towerIndex) => {
    this.#getTower(towerIndex).build(card);

    if (!this.#getTower(towerIndex).isComplete) return;
    this.#towers
      .filter((_, index) => towerIndex !== index)
      .forEach((tower) => {
        tower.unsetActiveSlot();
      });
  };

  destroyTowerTop = (towerIndex) => {
    return this.#getTower(towerIndex).destroyTop();
  };

  destroyTower = (towerIndex) => {
    return this.#getTower(towerIndex).destroy();
  };
}

module.exports = { Towers };
