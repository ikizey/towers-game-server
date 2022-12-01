let { totalPlayers } = require('../globals');

const connectHandler = (client) => {
  client.emit('welcome');

  client.on('hello', ({ name, uid }) => {
    client.name = name;
    client.uid = uid;
    totalPlayers += 1;
  });
};

module.exports = { connectHandler };
