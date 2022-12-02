const Mutex = require('async-mutex').Mutex;

const QUEUES = Object.freeze({
  P2QUEUE: 0,
  P3QUEUE: 1,
  P4QUEUE: 2,
});

class QueuesController {
  #QUEUES = [[], [], []];
  #mutexes = [new Mutex(), new Mutex(), new Mutex()];

  add = async (player, queue) => {
    const release = await this.#mutexes[queue].acquire();
    try {
      this.#QUEUES[queue].unshift(player);
    } finally {
      release();
    }
  };

  takeFirst = async (queue) => {
    //TODO add for P3 and P4
    const release = await this.#mutexes[queue].acquire();
    try {
      return this.#QUEUES[queue].pop();
    } finally {
      release();
    }
  };

  remove = (player) => {
    const playerUid = player.uid;

    this.#QUEUES.forEach(async (queue) => {
      const release = await this.#mutexes[queue].acquire();
      try {
        const index = this.#QUEUES[queue].findIndex(
          (player) => player.uid === playerUid
        );
        if (index >= -1) {
          this.#QUEUES[queue].splice(index, 1);
        }
      } finally {
        release();
      }
    });
  };
}

const queuesController = new QueuesController();

module.exports = { queuesController, QUEUES };
