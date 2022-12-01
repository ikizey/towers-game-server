const QUEUE_EVENTS = {
  IN_P2_QUEUE: 'in-p2-queue',
};

const queueHandler = (io, socket) => {
  socket.on(QUEUE_EVENTS.IN_2P_QUEUE, () => {});
};

module.exports = { queueHandler };
