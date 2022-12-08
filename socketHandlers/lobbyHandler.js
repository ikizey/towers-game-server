const clientController = require('../controllers/ClientController');
const { preGameController } = require('../controllers/PreGameController');
const { io } = require('../index');

const LOBBY_EVENTS = {
  ENTERS: 'enters-lobby',
  CREATE_PRE_GAME: 'pregame-create',
  JOIN_PRE_GAME: 'pregame-join',
  LEAVE_PRE_GAME: 'pregame-leave',
  // LEAVE_LOBBY: 'leave-lobby',
  LIST: 'pregames-list-public',
  START_GAME: 'start-game',
};

const lobbyHandler = (client) => {
  const onLobbyEnter = (name, uid) => {
    if (name === '') {
      client.emit('no-name', {});
    }
    client.name = name;
    client.uid = uid;
    console.info(`player ${name}(${uid}) enters lobby.`);
    clientController.addClient(client);
    client.join('lobby');
  };

  const announce = () => {
    io.in('lobby').emit('pregames-public-list', {
      gameList: preGameController.list,
    });
  };

  const onList = (client) => {
    client.emit('pregames-public-list', { gameList: preGameController.list });
  };

  const onCreatePreGame = (name, playersAmount, client, isPrivate) => {
    preGameController.addPreGame(name, playersAmount, client, isPrivate);
    client.leave('lobby');
    announce();
  };

  const onJoinPreGame = (preGameId, client) => {
    preGameController.addClient(preGameId, client);
    client.leave('lobby');
    announce();
  };

  const onLeavePreGame = (client) => {
    preGameController.removeClient(client.uid);
    client.join('lobby');
    announce();
  };

  // const onLeaveLobby = () => {};

  client.on(LOBBY_EVENTS.ENTERS, ({ name, uid }) => onLobbyEnter(name, uid));
  client.on(LOBBY_EVENTS.LIST, () => onList(client));
  client.on(
    LOBBY_EVENTS.CREATE_PRE_GAME,
    ({ name, playersAmount, isPrivate }) =>
      onCreatePreGame(name, playersAmount, client, isPrivate)
  );
  client.on(LOBBY_EVENTS.JOIN_PRE_GAME, ({ preGameId }) =>
    onJoinPreGame(preGameId, client)
  );
  client.on(LOBBY_EVENTS.LEAVE_PRE_GAME, () => onLeavePreGame(client));
  client.on(LOBBY_EVENTS.START_GAME, preGameController.startGame);

  // client.on(LOBBY_EVENTS.ENTER_QUEUE, onLeaveLobby);
};

module.exports = { lobbyHandler };
