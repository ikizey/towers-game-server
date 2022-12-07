const { queuesController } = require('../controllers/QueuesController');
const clientsController = require('../controllers/ClientController');
const { preGameController } = require('../controllers/PreGameController');

const disconnectHandler = (client) => {
  client.on('disconnect', () => {
    queuesController.remove(client);
    clientsController.remove(client);
    preGameController.removeClient(client.id);

    client.gameController = null;
    //TODO concede in game (if exist)
    console.info('client disconnected: ' + client.uid);
  });
};

module.exports = { disconnectHandler };
