const { queuesController } = require('../controllers/QueuesController');
const { clientController } = require('../controllers/ClientController');
const { preGameController } = require('../controllers/PreGameController');

const disconnectHandler = (client) => {
  client.on('disconnect', () => {
    queuesController.remove(client);
    clientController.removeClient(client.uid);
    preGameController.removeClient(client.uid);

    client.gameController = null;
    //TODO concede in game (if exist)
    console.info('client disconnected: ' + client.uid);
  });
};

module.exports = { disconnectHandler };
