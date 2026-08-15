import { Server } from 'socket.io';
import { verifySocketToken } from './middleware/socketAuth.js';
import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerGameHandlers } from './handlers/game.handler.js';
import { registerDisconnectHandlers } from './handlers/disconnect.handler.js';

// Initialize Socket.io
const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin     : process.env.CLIENT_URL || '*',
      methods    : ['GET', 'POST'],
      credentials: true,
    },
    // Auto disconnect inactive sockets after 5 minutes
    pingTimeout : 60000,
    pingInterval: 25000,
  });

  // Auth middleware
  // Only logged in users can connect
  io.use(verifySocketToken);

  // Connection handler
  io.on('connection', (socket) => {

    // Register all event handlers
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerDisconnectHandlers(io, socket);

    // Handle disconnect log
    socket.on('disconnect', (reason) => {
      console.log(` Socket disconnected — ${socket.id} — reason: ${reason}`);
    });
  });

  return io;
};

export default initializeSocket;