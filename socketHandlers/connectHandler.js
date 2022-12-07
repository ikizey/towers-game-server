let { totalPlayers, players } = require('../globals');
let clientController = require('../controllers/ClientController');

const connectHandler = (client) => {
  client.emit('welcome', {});

  client.on('hello', () => {
    totalPlayers += 1;
    //TODO search for games, where client might be playing.
  });

  client.on('lobby', ({ name, uid }) => {
    client.name = name;
    client.uid = uid;
    console.info(`player ${name}(${uid}) enters lobby.`);
    clientController.addClient(client);
    console.log(players.map((player) => player.uid));
    //TODO search for games, where client might be playing.
  });
};

module.exports = { connectHandler };
