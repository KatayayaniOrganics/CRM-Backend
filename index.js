const app = require('./app'); 
const logger = require('./logger');
const port = process.env.PORT;
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const io = socketIo(server);
// Make the `io` instance accessible in routes
app.set('socketio', io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  // Handle client disconnection
  socket.on('disconnect', () => {
      logger.info(`Client Disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
