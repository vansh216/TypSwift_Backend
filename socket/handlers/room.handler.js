import {
  createRoom,
  joinRoom,
  getRoom,
  getPlayersArray,
} from '../roomManager.js';

// Register room event handlers
export const registerRoomHandlers = (io, socket) => {

  // Create room
  // Host creates a new room with time limit
  socket.on('create-room', ({ timeLimit }) => {
    try {
      // Validate time limit
      const validLimits = [1, 2, 3, 5];
      const limit       = validLimits.includes(timeLimit) ? timeLimit : 1;

      // Create room in memory
      const room = createRoom(socket.id, socket.user, limit);

      // Join socket.io room
      socket.join(room.roomCode);

      // Send room code back to host
      socket.emit('room-created', {
        roomCode : room.roomCode,
        timeLimit: limit,
        players  : getPlayersArray(room),
        hostId   : socket.user.id,
      });


    } catch (error) {
      socket.emit('room-error', { message: 'Failed to create room' });
    }
  });

  // Join room
  // Player joins existing room with code
  socket.on('join-room', ({ roomCode }) => {
    try {
      const code   = roomCode?.toUpperCase().trim();
      const result = joinRoom(code, socket.id, socket.user);

      if (result.error) {
        return socket.emit('room-error', { message: result.error });
      }

      const { room } = result;

      // Join socket.io room
      socket.join(code);

      // Send updated player list to ALL players in room
      io.to(code).emit('room-update', {
        roomCode : code,
        timeLimit: room.timeLimit / 60,
        players  : getPlayersArray(room),
        hostId   : room.players[room.hostId]?.userId,
      });


    } catch (error) {
      socket.emit('room-error', { message: 'Failed to join room' });
    }
  });

  // Leave room manually
  socket.on('leave-room', ({ roomCode }) => {
    try {
      const room = getRoom(roomCode);
      if (!room || !room.players[socket.id]) return;

      // Remove from socket.io room
      socket.leave(roomCode);

      // Remove from room manager
      delete room.players[socket.id];

      // Room empty
      if (Object.keys(room.players).length === 0) {
        return;
      }

      // Assign new host if host left
      if (room.hostId === socket.id) {
        room.hostId = Object.keys(room.players)[0];

        io.to(roomCode).emit('host-changed', {
          newHostId: room.players[room.hostId].userId,
          username : room.players[room.hostId].username,
        });
      }

      // Update everyone with new player list
      io.to(roomCode).emit('room-update', {
        roomCode,
        timeLimit: room.timeLimit / 60,
        players  : getPlayersArray(room),
        hostId   : room.players[room.hostId]?.userId,
      });


    } catch (error) {
      console.error('Leave room error:', error.message);
    }
  });
};