class ClientController {
  #clients = new Map(); //uid : {client, name, status}

  get clients() {
    return [...this.#clients].map((client) => client[1]);
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
    this.#clients.get(clientUid).status = status;
  };

  getStatus = (clientUid) => {
    return this.#clients(clientUid).status;
  };
}

const clientController = new ClientController();

module.exports = clientController;
