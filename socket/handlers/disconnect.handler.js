import {
  removePlayer,
  getPlayersArray,
} from '../roomManager.js';

// Register disconnect handler
export const registerDisconnectHandlers = (io, socket) => {

  socket.on('disconnect', () => {
    try {
      const { affectedRoom, newHost, roomDeleted } = removePlayer(socket.id);

      if (!affectedRoom || roomDeleted) return;

      const roomCode = affectedRoom.roomCode;

      // Notify everyone player left
      io.to(roomCode).emit('player-left', {
        username: socket.user.username,
        players : getPlayersArray(affectedRoom),
      });

      // Notify new host if host changed
      if (newHost) {
        io.to(roomCode).emit('host-changed', {
          newHostId: newHost.userId,
          username : newHost.username,
        });
      }

      // Update room state for everyone
      io.to(roomCode).emit('room-update', {
        roomCode,
        timeLimit: affectedRoom.timeLimit / 60,
        players  : getPlayersArray(affectedRoom),
        hostId   : affectedRoom.players[affectedRoom.hostId]?.userId,
      });


    } catch (error) {
      console.error('Disconnect handler error:', error.message);
    }
  });
};