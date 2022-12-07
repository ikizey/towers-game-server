const { nanoid } = require('nanoid');
const clientController = require('./ClientController');
const { GameController } = require('./GameController');

class PreGameController {
  #public = [];
  #private = [];

  get #both() {
    return [this.#public, this.#private];
  }

  #getPreGame = (preGameId) => {
    this.#both.forEach((preGameType) => {
      const preGameIndex = preGameType.findIndex(
        (preGame) => preGame.id === preGameId
      );
      if (preGameIndex !== -1) {
        return preGame;
      }
    });
  };

  addPreGame = (name, playersAmount, client, isPrivate = false) => {
    const newPreGame = new PreGame(name, playersAmount, client, isPrivate);

    const type = isPrivate ? this.#private : this.#public;
    if (!type.map((pregames) => pregames.id).includes(preGame.id)) {
      type.push(newPreGame);
    }
  };

  #remove = (preGameId) => {
    this.#both.forEach((preGameType) => {
      const pregameIndex = preGameType.findIndex(
        (pregame) => pregame.id === preGameId
      );
      if (pregameIndex !== -1) {
        preGameType.splice(pregameIndex, 1);
        return;
      }
    });
  };

  addClient = (preGameId, client) => {
    const preGame = this.#getPreGame(preGameId);
    preGame.addClient(client);
  };

  removeClient = (clientUid) => {
    this.#both.forEach((preGameType) => {
      const pregameIndex = preGameType.findIndex((pregame) =>
        pregame.clientIds.includes(clientId)
      );
      if (pregameIndex !== -1) {
        const preGame = preGameType[pregameIndex];
        preGame.removeClient(clientUid);
        if (preGame.clientIds.length === 0) {
          preGameType.splice(pregameIndex, 1);
        }
        return;
      }
    });
  };

  startGame = (preGameId) => {
    const preGame = this.#getPreGame(preGameId);
    preGame.startGame();
    this.#remove(preGameId);
  };

  get list() {
    return this.#public.map((preGame) => preGame.info);
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
      playersToStart,
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

    client.emit('pre-game-name', { id: this.id, name: this.#name });
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
