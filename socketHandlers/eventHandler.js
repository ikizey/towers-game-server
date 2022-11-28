export const SOCKET_ON = Object.freeze({
  ERROR: 'error',
  MESSAGE: 'message',
  ROOM: 'room',
});

export const SOCKET_OUT = Object.freeze({
  MESSAGE: 'message',
});

export default (io, socket) => {
  const logMessage = ({ gameId, message }) => {
    console.error(
      'Error: client ' + socket.id + ' on ' + gameId + ': ' + message
    );
  };

  socket.on(SOCKET_ON.ERROR, logMessage);
};
