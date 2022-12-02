const { connectHandler } = require('./connectHandler');
const { disconnectHandler } = require('./disconnectHandler');
const { gameHandler } = require('./gameHandler');
const { queueHandler } = require('./queueHandler');
const { io } = require('../index');

const connectionHandler = (client) => {
  console.info('client connected: ' + client.id);

  connectHandler(client);
  gameHandler(io, client);
  queueHandler(io, client);
  disconnectHandler(client);
};

module.exports = { connectionHandler };
