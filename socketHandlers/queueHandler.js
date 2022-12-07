const { GameController } = require('../controllers/GameController');
const { queuesController, QUEUES } = require('../controllers/QueuesController');

const QUEUE_EVENTS = {
  IN_P2_QUEUE: 'in-p2-queue',
  IN_P3_QUEUE: 'in-p3-queue',
  IN_P4_QUEUE: 'in-p4-queue',
  LEAVE_QUEUE: 'leave-queue',
};

const queueHandler = (client) => {
  const handleInP2Queue = async () => {
    const queue = QUEUES.P2QUEUE;
    const opponent = queuesController.takeFirst(queue);
    if (!opponent) {
      await queuesController.add(client, queue);
      return;
    }

    const gameController = new GameController(client, opponent);
    client.gameController = gameController;
    opponent.gameController = gameController;
  };

  //TODO IN_P3_QUEUE
  const handleInP3Queue = async () => {
    const queue = QUEUES.P3QUEUE;
  };
  //TODO IN_P4_QUEUE
  const handleInP4Queue = async () => {
    const queue = QUEUES.P4QUEUE;
  };

  const handleLeaveQueue = async () => {
    await queuesController.remove(client);
  };

  client.on(QUEUE_EVENTS.IN_P2_QUEUE, handleInP2Queue);
  client.on(QUEUE_EVENTS.IN_P3_QUEUE, handleInP3Queue);
  client.on(QUEUE_EVENTS.IN_P4_QUEUE, handleInP4Queue);
  client.on(QUEUE_EVENTS.LEAVE_QUEUE, handleLeaveQueue);
};

module.exports = { queueHandler };
