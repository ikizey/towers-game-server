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
    this.#getPreGame(preGameId)?.addClient(client);
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
    preGame?.removeClient(clientUid);
    preGame?.playersAmount === 0 && this.#remove(preGame.id);
  };

  kickClient = (admin, clientUid) => {
    const preGame = this.#getGameByClient(clientUid);
    preGame?.kickClient(admin, clientUid);
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
  #clients = new Map();
  // #isPrivate;

  constructor(name, playersAmount, admin, isPrivate = false) {
    this.#name = name;
    this.#playersToStart = playersAmount;
    this.#admin = admin;
    this.#clients.set(admin.uid, admin);
    // this.#isPrivate = isPrivate;
    admin.emit('pre-game-created', {
      name,
      id: this.id,
      playersToStart: playersAmount,
    });
    this.#announcePlayers();
  }

  get id() {
    return this.#id;
  }

  get info() {
    return {
      name: this.#name,
      id: this.#id,
      playersToStart: this.#playersToStart,
      playersAmount: this.playersAmount,
    };
  }

  get #playersInfo() {
    return [...this.#clients.values()].map((client) => ({
      id: client.uid,
      name: client.name,
    }));
  }

  hasPlayer = (clientUid) => {
    return this.#clients.has(clientUid);
  };

  get playersAmount() {
    return this.#clients.size;
  }

  get isReady() {
    return this.playersAmount === this.#playersToStart;
  }

  #announce(type, message) {
    this.#clients.forEach((client, _) => client.emit(type, message));
  }

  #announcePlayers() {
    this.#announce('pre-game-player-list', { players: this.#playersInfo });
  }

  addClient = (client) => {
    if (this.isReady) {
      client.emit('pre-game-is-full', {});
      return;
    }
    if (this.#clients.has(client.uid)) {
      return;
    }

    this.#clients.set(client.uid, client);
    client.emit('pre-game-name', {
      id: this.id,
      name: this.#name,
      playersToStart: this.#playersToStart,
    });
    this.#announcePlayers();

    if (this.isReady) {
      this.#announce('pre-game-ready', {});
    }
  };

  removeClient = (clientUid) => {
    const client = this.#clients.get(clientUid);
    if (!client) return;

    if (client.uid === this.#admin.uid) {
      this.#announce('pre-game-admin-left', {});
      this.#clients.delete(clientUid);
      return;
    }
    this.#clients.delete(clientUid);
    client.emit('pre-game-left', {});
    this.#announcePlayers();
    this.#announce('pre-game-not-ready', {});
  };

  kickClient = (admin, clientUid) => {
    if (admin.uid !== this.#admin.uid) return;

    const client = this.#clients.get(clientUid);
    this.#clients.delete(clientUid);
    client.emit('kicked-from-pre-game', {});
    this.#announcePlayers();
    this.#announce('pre-game-not-ready', {});
  };

  startGame = () => {
    const newGameController = new GameController(...this.#clients);
    this.#clients.forEach((client, _) => {
      client.gameController = newGameController;
    });
  };
}

module.exports = { preGameController };
