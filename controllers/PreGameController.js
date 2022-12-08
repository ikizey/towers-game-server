const { nanoid } = require('nanoid');
const { GameController } = require('./GameController');

class PreGameController {
  #public = new Map();
  #private = new Map();

  #getPreGame = (preGameId) => {
    return this.#public.get(preGameId) || this.#private.get(preGameId);
  };

  addPreGame = (name, playersAmount, client, isPrivate = false) => {
    const newPreGame = new PreGame(name, playersAmount, client, isPrivate);

    const type = isPrivate ? this.#private : this.#public;
    type.set(newPreGame.id, newPreGame);
  };

  #remove = (preGameId) => {
    this.#public.delete(preGameId) || this.#private.delete(preGameId);
  };

  addClient = (preGameId, client) => {
    const preGame = this.#getPreGame(preGameId);
    preGame.addClient(client);
  };

  #getGameByClient = (clientUid) => {
    //* can return Undefined
    return (
      [...this.#public.values()].filter((preGame) =>
        preGame?.hasPlayer(clientUid)
      )[0] ||
      [...this.#private.values()].filter((preGame) =>
        preGame?.hasPlayer(clientUid)
      )[0]
    );
  };

  removeClient = (clientUid) => {
    const preGame = this.#getGameByClient(clientUid);
    if (preGame) {
      preGame.removeClient(clientUid);
    }
  };

  startGame = (preGameId) => {
    const preGame = this.#getPreGame(preGameId);
    preGame.startGame();
    this.#remove(preGameId);
  };

  get list() {
    return [...this.#public.values()].map((preGame) => preGame.info);
  }
}

const preGameController = new PreGameController();

class PreGame {
  #id = nanoid();
  #name;
  #playersToStart;
  #admin;
  #clients = [];
  #isPrivate;

  constructor(name, playersAmount, admin, isPrivate = false) {
    this.#name = name;
    this.#playersToStart = playersAmount;
    this.#admin = admin;
    this.#clients.push(admin);
    this.#isPrivate = isPrivate;
    admin.emit('pre-game-created', {
      name,
      id: this.id,
      playersToStart: playersAmount,
    });
  }

  get id() {
    return this.#id;
  }

  get info() {
    return {
      name: this.#name,
      id: this.#id,
      playersToStart: this.playersToStart,
      playersAmount: this.playersAmount,
    };
  }

  get clientIds() {
    return this.#clients.map((client) => client.id);
  }

  get isPrivate() {
    return this.#isPrivate;
  }

  get playersToStart() {
    return this.#playersToStart;
  }

  hasPlayer = (clientUid) => {
    return (
      this.#clients.filter((client) => client.uid === clientUid).length > 0
    );
  };

  get playersAmount() {
    return this.#clients.length;
  }

  get #uids() {
    return this.#clients.map((client) => client.uid);
  }

  get isReady() {
    return this.#clients.length === this.#playersToStart;
  }

  #announce(type, message) {
    clients.forEach((client) => client.emit(type, message));
  }

  addClient = (client) => {
    if (this.isReady) {
      client.emit('pre-game-is-full', {});
      return;
    }

    const uids = this.#uids;
    if (!uids.includes(client.uid)) {
      this.#clients.forEach((cl) => {
        cl.emit('pre-game-new-player', { id: client.uid, name: client.name });
      });
      this.#clients.push(client);
    }

    client.emit('pre-game-name', {
      id: this.id,
      name: this.#name,
      playersToStart: this.#playersToStart,
    });
    if (this.isReady) {
      this.#announce('pre-game-ready', {});
    }
  };

  removeClient = (clientUid) => {
    //TODO! mutex is needed
    const clientIndex = this.#clients.findIndex(
      (client) => client.uid === clientUid
    );
    const client = this.#clients[clientIndex];
    if (client.uid === this.#admin.uid) {
      this.#clients.forEach((cl) => {
        cl.emit('pre-game-admin-left', {});
      });
      return;
    }
    if (clientIndex !== -1) {
      this.#clients.splice(clientIndex, 1);
      client.emit('pre-game-left', {});
      this.#clients.forEach((cl) => {
        cl.emit('pre-game-player-left', { id: client.uid, name: client.name });
      });
      this.#announce('pre-game-not-ready', {});
    }
  };

  startGame = () => {
    const newGameController = new GameController(...this.#clients);
    this.#clients.forEach((client) => {
      client.gameController = newGameController;
    });
  };
}

module.exports = { preGameController };
