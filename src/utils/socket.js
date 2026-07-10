let io = null;

// Called once when the server starts, to store the io instance
function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*', // allow our frontend to connect
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 A client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
}

// Called anywhere else in the app that needs to send a live message
function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized yet!');
  }
  return io;
}

module.exports = { initSocket, getIO };