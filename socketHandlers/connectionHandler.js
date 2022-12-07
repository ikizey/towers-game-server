const { connectHandler } = require('./connectHandler');
const { disconnectHandler } = require('./disconnectHandler');
const { gameHandler } = require('./gameHandler');
const { lobbyHandler } = require('./lobbyHandler');
const { queueHandler } = require('./queueHandler');

const connectionHandler = (client) => {
  console.info('client connected: ' + client.id);

  connectHandler(client);
  disconnectHandler(client);
  gameHandler(client);
  lobbyHandler(client);
  queueHandler(client);
};

module.exports = { connectionHandler };
