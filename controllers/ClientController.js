class ClientController {
  #clients = [];

  get clients() {
    return this.#clients;
  }

  get #uids() {
    return this.#clients.map((client) => client.uid);
  }
  addClient = (client) => {
    const uids = this.#uids;
    if (!uids.includes(client.uid)) {
      this.push(client);
    }
  };

  removeClient = (clientUid) => {
    const clientIndex = this.#clients.findIndex(
      (client) => client.uid === clientUid
    );
    if (clientIndex !== -1) {
      this.clients.splice(clientIndex, 1);
    }
  };

  get totalPlayers() {
    return this.#clients.length;
  }
}

const clientController = new ClientController();

module.exports = clientController;
