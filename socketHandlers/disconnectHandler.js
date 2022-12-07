const { queuesController } = require('../controllers/QueuesController');
const clientsController = require('../controllers/ClientController');
const { preGameController } = require('../controllers/PreGameController');
let { totalPlayers, players } = require('../globals');

const disconnectHandler = (client) => {
  client.on('disconnect', () => {
    totalPlayers -= 1;
    queuesController.remove(client);
    clientsController.remove(client);
    preGameController.removeClient(client.id);

    //TODO concede in game (if exist)
    console.info('client disconnected: ' + client.uid);
  });
};

module.exports = { disconnectHandler };
