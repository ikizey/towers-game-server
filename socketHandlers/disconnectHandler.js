let { totalPlayers } = require('../globals');

const disconnectHandler = (client) => {
  client.on('disconnect', () => {
    totalPlayers -= 1;

    //TODO remove from all queues
    //TODO concede in game (if exist)
    console.info('client disconnected: ' + client.id);
  });
};

module.exports = { disconnectHandler };
