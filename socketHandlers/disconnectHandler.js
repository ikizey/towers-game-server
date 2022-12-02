const { queuesController } = require('../controllers/QueuesController');
let { totalPlayers } = require('../globals');

const disconnectHandler = (client) => {
  client.on('disconnect', () => {
    totalPlayers -= 1;

    queuesController.remove(client);
    //TODO concede in game (if exist)
    console.info('client disconnected: ' + client.id);
  });
};

module.exports = { disconnectHandler };
