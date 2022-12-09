const PLAYER_STATUS = Object.freeze({
  IN_GAME: 'in game',
  IN_PREGAME: 'in pregame',
  IN_LOBBY: 'in lobby',
});
class ClientController {
  #clients = new Map(); //uid : {client, name, status}

  get clients() {
    return [...this.#clients].map((client) => client[1]);
  }

  get players() {
    return [...this.clients.entries()].map((client) => ({
      id: client[1].uid,
      name: client[1].name,
      status: client[1].status,
    }));
  }

  addClient = (client) => {
    this.#clients.set(client.uid, client);
  };

  removeClient = (clientUid) => {
    this.#clients.delete(clientUid);
  };

  get totalPlayers() {
    return this.#clients.size;
  }

  setStatus = (clientUid, status) => {
    const client = this.#clients.get(clientUid);
    if (client) {
      client.status = status;
    }
  };

  getStatus = (clientUid) => {
    return this.#clients(clientUid).status;
  };
}

const clientController = new ClientController();

module.exports = { clientController, PLAYER_STATUS };
