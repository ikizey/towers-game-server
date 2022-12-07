const { nanoid } = require('nanoid');
const clientController = require('./ClientController');

class PreGameController {
  #public = [];
  #private = [];

  get #both() {
    return [this.#private, this.#public];
  }

  add = (preGame, isPrivate = false) => {
    const type = isPrivate ? this.#private : this.#public;
    if (!type.map((pregames) => pregames.id).includes(preGame.id)) {
      type.push(preGame);
    }
  };

  remove = (preGameId) => {
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

  removeClient = (clientId) => {
    this.#both.forEach((preGameType) => {
      const pregameIndex = preGameType.findIndex((pregame) =>
        pregame.clientIds.includes(clientId)
      );
      if (pregameIndex !== -1) {
        preGameType.splice(pregameIndex, 1);
        return;
      }
    });
  };
}

const preGameController = new PreGameController();

class PreGame {
  #id = nanoid();
  #name;
  #playersAmount;
  #admin;
  #clients = [];
  #isPrivate;

  constructor(name, playersAmount, admin, isPrivate = false) {
    this.#name = name;
    this.#playersAmount = playersAmount;
    this.#admin = admin;
    this.#clients.push(admin);
    this.#isPrivate = isPrivate;
    admin.emit('join-created', { name });
  }

  get id() {
    return this.#id;
  }

  get clientIds() {
    return this.#clients.map((client) => client.id);
  }

  get isPrivate() {
    return this.#isPrivate;
  }

  get #uids() {
    return this.#clients.map((client) => client.uid);
  }

  get isReady() {
    return this.#clients.length === this.#playersAmount;
  }

  #announce(type, message) {
    clients.forEach((client) => client.emit(type, message));
  }

  addClient = (client) => {
    if (this.isReady) {
      client.emit('join-is-full', {});
      return;
    }

    const uids = this.#uids;
    if (!uids.includes(client.uid)) {
      this.#clients.forEach((cl) => {
        cl.emit('joined-player', { id: client.uid, name: client.name });
      });
      this.#clients.push(client);
    }

    client.emit('joined-to', { gameName: this.#name });
    if (this.isReady) {
      this.#announce('join-ready', {});
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
        cl.emit('join-admin-left', {});
      });
      return;
    }
    if (clientIndex !== -1) {
      this.#clients.splice(clientIndex, 1);
      client.emit('join-left');
      this.#clients.forEach((cl) => {
        cl.emit('left-player', { id: client.id, name: client.name });
      });
      this.#announce('join-not-ready', {});
    }
  };
}

module.exports = { preGameController, PreGame };
