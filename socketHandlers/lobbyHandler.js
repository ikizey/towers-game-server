const clientController = require('../controllers/ClientController');
const {
  preGameController,
  PreGame,
} = require('../controllers/PreGameController');

const LOBBY_EVENTS = {
  ENTERS: 'lobby',
  CREATE_GAME: 'create-game',
  JOIN_GAME: 'join-game',
  LEAVE_LOBBY: 'leave-lobby',
};

const lobbyHandler = (client) => {
  const onLobbyEnter = ({ name, uid }) => {
    client.name = name;
    client.uid = uid;
    console.info(`player ${name}(${uid}) enters lobby.`);
    clientController.addClient(client);
  };

  const onCreateGame = ({ name, playersAmount, client, isPrivate }) => {
    const preGame = new PreGame(name, playersAmount, client, isPrivate);
    preGameController.add(preGame, isPrivate);
  };

  const onJoinGame = () => {};

  const onLeaveLobby = () => {};

  client.on(LOBBY_EVENTS.ENTERS, onLobbyEnter);
  client.on(LOBBY_EVENTS.CREATE_GAME, onCreateGame);
  client.on(LOBBY_EVENTS.JOIN_GAME, onJoinGame);
  client.on(LOBBY_EVENTS.ENTER_QUEUE, onLeaveLobby);
};

module.exports = { lobbyHandler };
