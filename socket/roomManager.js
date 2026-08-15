// Room Manager
// All rooms stored in memory
// Temporary — cleared when server restarts

const rooms = new Map();

// Generate unique 6 character room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code    = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Make sure code is unique
  return rooms.has(code) ? generateRoomCode() : code;
};

// Create a new room
const createRoom = (hostSocketId, hostUser, timeLimit) => {
  const roomCode = generateRoomCode();

  const room = {
    roomCode,
    status   : 'waiting',      // waiting | countdown | playing | finished
    hostId   : hostSocketId,
    timeLimit: timeLimit * 60, // convert minutes to seconds
    paragraph: null,
    players  : {},
    createdAt: Date.now(),
    startedAt: null,
    timerId  : null,           // server side countdown timer
  };

  // Add host as first player
  room.players[hostSocketId] = {
    socketId : hostSocketId,
    userId   : hostUser.id,
    username : hostUser.username,
    avatar   : hostUser.avatar,
    progress : 0,
    wpm      : 0,
    accuracy : 100,
    finished : false,
    rank     : null,
    finishedAt: null,
  };

  rooms.set(roomCode, room);
  return room;
};

// Add player to existing room
const joinRoom = (roomCode, socketId, user) => {
  const room = rooms.get(roomCode);

  if (!room)                                    return { error: 'Room not found' };
  if (room.status !== 'waiting')                return { error: 'Game already started' };
  if (Object.keys(room.players).length >= 10)   return { error: 'Room is full — max 10 players' };

  // Check if user already in room
  const alreadyIn = Object.values(room.players)
    .find(p => p.userId === user.id);
  if (alreadyIn) return { error: 'You are already in this room' };

  room.players[socketId] = {
    socketId,
    userId  : user.id,
    username: user.username,
    avatar  : user.avatar,
    progress: 0,
    wpm     : 0,
    accuracy: 100,
    finished: false,
    rank    : null,
    finishedAt: null,
  };

  return { room };
};

// Remove player from room
// Assigns new host if host left
// Deletes room if empty
const removePlayer = (socketId) => {
  let affectedRoom = null;
  let newHost      = null;
  let roomDeleted  = false;

  for (const [roomCode, room] of rooms) {
    if (room.players[socketId]) {
      delete room.players[socketId];
      affectedRoom = room;

      // Room empty — delete it
      if (Object.keys(room.players).length === 0) {
        if (room.timerId) clearInterval(room.timerId);
        rooms.delete(roomCode);
        roomDeleted = true;
        break;
      }

      // Host left — assign new host
      if (room.hostId === socketId) {
        const nextSocketId = Object.keys(room.players)[0];
        room.hostId        = nextSocketId;
        newHost            = room.players[nextSocketId];
      }

      break;
    }
  }

  return { affectedRoom, newHost, roomDeleted };
};

// Get room by code
const getRoom = (roomCode) => rooms.get(roomCode);

// Get room by socket ID
const getRoomBySocketId = (socketId) => {
  for (const room of rooms.values()) {
    if (room.players[socketId]) return room;
  }
  return null;
};

// Get all players as array
const getPlayersArray = (room) => {
  return Object.values(room.players);
};

// Update player progress
const updatePlayerProgress = (roomCode, socketId, progress, wpm, accuracy) => {
  const room = rooms.get(roomCode);
  if (!room || !room.players[socketId]) return;

  room.players[socketId].progress = progress;
  room.players[socketId].wpm      = wpm;
  room.players[socketId].accuracy = accuracy;
};

// Mark player as finished
const markPlayerFinished = (roomCode, socketId, wpm, accuracy) => {
  const room = rooms.get(roomCode);
  if (!room || !room.players[socketId]) return null;

  const finishedPlayers = Object.values(room.players)
    .filter(p => p.finished).length;

  room.players[socketId].finished   = true;
  room.players[socketId].rank       = finishedPlayers + 1;
  room.players[socketId].wpm        = wpm;
  room.players[socketId].accuracy   = accuracy;
  room.players[socketId].progress   = 100;
  room.players[socketId].finishedAt = Date.now();

  return room;
};

// Check if all players finished
const allPlayersFinished = (room) => {
  return Object.values(room.players).every(p => p.finished);
};

// Delete room
const deleteRoom = (roomCode) => {
  const room = rooms.get(roomCode);
  if (room?.timerId) clearInterval(room.timerId);
  rooms.delete(roomCode);
};

export {
  createRoom,
  joinRoom,
  removePlayer,
  getRoom,
  getRoomBySocketId,
  getPlayersArray,
  updatePlayerProgress,
  markPlayerFinished,
  allPlayersFinished,
  deleteRoom,
};