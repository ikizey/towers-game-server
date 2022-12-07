const { queuesController } = require('../controllers/QueuesController');
const clientsController = require('../controllers/ClientController');
let { totalPlayers, players } = require('../globals');

const disconnectHandler = (client) => {
  client.on('disconnect', () => {
    totalPlayers -= 1;
    queuesController.remove(client);
    clientsController.remove(client);
    //TODO concede in game (if exist)
    console.info('client disconnected: ' + client.uid);
  });
};

module.exports = { disconnectHandler };
