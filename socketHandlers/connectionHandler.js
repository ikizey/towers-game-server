const { connectHandler } = require('./connectHandler');
const { disconnectHandler } = require('./disconnectHandler');
const { gameHandler } = require('./gameHandler');
const { queueHandler } = require('./queueHandler');

const connectionHandler = (client) => {
  console.info('client connected: ' + client.id);

  connectHandler(client);
  disconnectHandler(client);
  gameHandler(client);
  queueHandler(client);
};

module.exports = { connectionHandler };
