import Paragraph from '../../src/model/Paragraph.model.js';
import {
    getRoom,
    getPlayersArray,
    updatePlayerProgress,
    markPlayerFinished,
    allPlayersFinished,
    deleteRoom,
} from '../roomManager.js';

// Register game event handlers
export const registerGameHandlers = (io, socket) => {

    // Start game
    // Only host can start
    // Minimum 2 players required
    socket.on('start-game', async ({ roomCode }) => {
        try {
            const room = getRoom(roomCode);

            if (!room) {
                return socket.emit('room-error', { message: 'Room not found' });
            }

            // Only host can start
            if (room.hostId !== socket.id) {
                return socket.emit('room-error', { message: 'Only host can start the game' });
            }

            // Minimum 2 players
            if (Object.keys(room.players).length < 2) {
                return socket.emit('room-error', { message: 'Need at least 2 players to start' });
            }

            // Already started
            if (room.status !== 'waiting') {
                return socket.emit('room-error', { message: 'Game already started' });
            }

            // Fetch random paragraph
            const count = await Paragraph.countDocuments({ isActive: true });
            const skip = Math.floor(Math.random() * count);
            const paragraph = await Paragraph.findOne({ isActive: true }).skip(skip);

            if (!paragraph) {
                return socket.emit('room-error', { message: 'No paragraphs available' });
            }

            // Update room state
            room.status = 'countdown';
            room.paragraph = paragraph;
            room.startedAt = Date.now();

            //  Countdown 3 2 1 Go 
            let countdown = 3;

            const countdownInterval = setInterval(() => {
                if (countdown > 0) {
                    io.to(roomCode).emit('game-countdown', { count: countdown });
                    countdown--;
                } else {
                    clearInterval(countdownInterval);
                    // emit Go
                    io.to(roomCode).emit('game-countdown', { count: 'Go!' });
                    room.status = 'playing';
                    // start game...
                }
            }, 1000);
            room.status = 'playing';

            // Send game started event with paragraph and time limit
            io.to(roomCode).emit('game-started', {
                paragraph: {
                    id: paragraph._id,
                    content: paragraph.content,
                },
                timeLimit: room.timeLimit,
                players: getPlayersArray(room),
            });

            //Server side game timer 
            let timeLeft = room.timeLimit;
            room.timerId = setInterval(() => {
                timeLeft--;

                // Send time update every second
                io.to(roomCode).emit('time-update', { timeLeft });

                if (timeLeft <= 0) {
                    clearInterval(room.timerId);
                    endGame(io, roomCode);
                }
            }, 1000);

            console.log(`🎮 Game started — room: ${roomCode} — players: ${Object.keys(room.players).length}`);
        } catch (error) {
            socket.emit('room-error', { message: 'Failed to start game' });
            console.error('Start game error:', error.message);
        }
    });

    // Progress update
    // Player sends progress every 500ms
    socket.on('progress-update', ({ roomCode, progress, wpm, accuracy }) => {
    try {
        const room = getRoom(roomCode);
        if (!room || room.status !== 'playing') return;
        if (!room.players[socket.id]) return;

        // Update player progress in memory
        updatePlayerProgress(roomCode, socket.id, progress, wpm, accuracy);

        // Broadcast all players progress to everyone in room
        io.to(roomCode).emit('all-progress', {
            players: getPlayersArray(room),
        });

    } catch (error) {
        console.error('Progress update error:', error.message);
    }
});

// Player finished
// Player completed the paragraph
socket.on('player-finished', ({ roomCode, wpm, accuracy }) => {
    try {
        const room = getRoom(roomCode);
        if (!room || room.status !== 'playing') return;

        // Mark player as finished
        markPlayerFinished(roomCode, socket.id, wpm, accuracy);

        // Notify everyone someone finished
        io.to(roomCode).emit('all-progress', {
            players: getPlayersArray(room),
        });

        console.log(`🏁 ${socket.user.username} finished — room: ${roomCode} — WPM: ${wpm}`);

        // All players finished — end game immediately
        if (allPlayersFinished(room)) {
            clearInterval(room.timerId);
            endGame(io, roomCode);
        }

    } catch (error) {
        console.error('Player finished error:', error.message);
    }
});
};

// End game
// Called when time up or all finished
const endGame = (io, roomCode) => {
    const room = getRoom(roomCode);
    if (!room) return;

    room.status = 'finished';

    // Sort players by rank then WPM
    const results = getPlayersArray(room)
        .map((player, index) => ({
            ...player,
            rank: player.finished
                ? player.rank
                : Object.values(room.players)
                    .filter(p => p.finished).length + index + 1,
        }))
        .sort((a, b) => {
            if (a.finished && !b.finished) return -1;
            if (!a.finished && b.finished) return 1;
            return b.wpm - a.wpm;
        })
        .map((player, index) => ({
            ...player,
            rank: index + 1,
        }));

    // Send final results to everyone
    io.to(roomCode).emit('game-over', {
        results,
        roomCode,
    });

    console.log(`🏆 Game over — room: ${roomCode}`);

    // Clean up room after 30 seconds
    setTimeout(() => {
        deleteRoom(roomCode);
        console.log(`🗑️ Room deleted — ${roomCode}`);
    }, 30000);
};