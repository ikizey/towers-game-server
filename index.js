const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const registerEventHandlers = require('./eventHandler');

app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

const onConnection = (client) => {
  console.info('client connected: ' + client.id);
  registerEventHandlers(io, client);
};

const PORT = 3001;
server.listen(PORT, () => {
  console.log('Server is running on port: ' + PORT);
});

io.on('connection', onConnection);
