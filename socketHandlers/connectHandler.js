const connectHandler = (client) => {
  client.emit('welcome', {});

  client.on('hello', () => {
    //TODO maybe search for games, where client might be playing.
  });
};

module.exports = { connectHandler };
