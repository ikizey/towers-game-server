const {
  clientController,
  PLAYER_STATUS,
} = require('../controllers/ClientController');
const { preGameController } = require('../controllers/PreGameController');

const LOBBY_EVENTS = {
  ENTERS: 'enters-lobby',
  CREATE_PRE_GAME: 'pregame-create',
  JOIN_PRE_GAME: 'pregame-join',
  LEAVE_PRE_GAME: 'pregame-leave',
  // LEAVE_LOBBY: 'leave-lobby',
  LIST: 'pregames-list-public',
  LIST_PLAYERS: 'list-all-players',
  START_GAME: 'start-game',
};

const lobbyHandler = (client, io) => {
  const onLobbyEnter = (name, uid) => {
    if (name === '') {
      client.emit('no-name', {});
    }
    client.name = name;
    client.uid = uid;
    console.info(`player ${name}(${uid}) enters lobby.`);
    clientController.addClient(client);
    clientController.setStatus(client.uid, PLAYER_STATUS.IN_LOBBY);
    client.join('lobby');
    announce();
  };

  const announce = () => {
    io.in('lobby').emit('pregames-public-list', {
      gameList: preGameController.list,
    });
    io.in('lobby').emit('players-all', { players: clientController.players });
  };

  const onList = (client) => {
    client.emit('pregames-public-list', { gameList: preGameController.list });
  };

  const onListPlayers = (client) => {
    client.emit('all-players', { players: clientController.players });
  };

  const onCreatePreGame = (name, playersAmount, client, isPrivate) => {
    preGameController.addPreGame(name, playersAmount, client, isPrivate);
    clientController.setStatus(client.uid, PLAYER_STATUS.IN_PREGAME);
    client.leave('lobby');
    announce();
  };

  const onJoinPreGame = (preGameId, client) => {
    preGameController.addClient(preGameId, client);
    clientController.setStatus(client.uid, PLAYER_STATUS.IN_PREGAME);
    client.leave('lobby');
    announce();
  };

  const onLeavePreGame = (client) => {
    preGameController.removeClient(client.uid);
    clientController.setStatus(client.uid, PLAYER_STATUS.IN_LOBBY);
    client.join('lobby');
    announce();
  };

  // const onLeaveLobby = () => {};

  client.on(LOBBY_EVENTS.ENTERS, ({ name, uid }) => onLobbyEnter(name, uid));
  client.on(LOBBY_EVENTS.LIST, () => onList(client));
  client.on(LOBBY_EVENTS.LIST_PLAYERS, () => onListPlayers(client));
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
