
const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    path: '/socket.io'
});

const PORT = 5000;

const MONGODB_URI = 'mongodb+srv://shipuaimirai:chitron%402448766@shipuaimiraibot.nwesgqa.mongodb.net/?retryWrites=true&w=majority&appName=ShiPuAiMiraiBot';
const DEFAULT_COUNT = 5658;

let db = null;
let downloadCollection = null;

async function connectMongoDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db('uwu_app');
        downloadCollection = db.collection('downloads');
        const existing = await downloadCollection.findOne({ _id: 'counter' });
        if (!existing) {
            await downloadCollection.insertOne({ _id: 'counter', count: DEFAULT_COUNT, base: DEFAULT_COUNT });
        } else {
            const base = typeof existing.base === 'number' ? existing.base : DEFAULT_COUNT;
            const count = typeof existing.count === 'number' ? existing.count : base;
            if (count < base) {
                await downloadCollection.updateOne({ _id: 'counter' }, { $set: { count: base, base } });
            }
        }
        console.log('MongoDB connected successfully');
    } catch (e) {
        console.error('MongoDB connection error:', e.message);
    }
}

async function getDownloadCount() {
    try {
        if (downloadCollection) {
            const doc = await downloadCollection.findOne({ _id: 'counter' });
            if (!doc) return DEFAULT_COUNT;
            const base = typeof doc.base === 'number' ? doc.base : DEFAULT_COUNT;
            const count = typeof doc.count === 'number' ? doc.count : base;
            return count < base ? base : count;
        }
    } catch (e) {}
    return DEFAULT_COUNT;
}

async function incrementDownloadCount() {
    try {
        if (downloadCollection) {
            const result = await downloadCollection.findOneAndUpdate(
                { _id: 'counter' }, { $inc: { count: 1 } },
                { returnDocument: 'after', upsert: true }
            );
            const doc = result.value || {};
            const base = typeof doc.base === 'number' ? doc.base : DEFAULT_COUNT;
            const count = typeof doc.count === 'number' ? doc.count : base;
            return count < base ? base : count;
        }
    } catch (e) {}
    return DEFAULT_COUNT;
}

connectMongoDB();

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.use('/code-formating-pro', express.static(path.join(__dirname, 'code-formating-pro')));
app.get('/code-formating-pro', (req, res) => {
    res.sendFile(path.join(__dirname, 'code-formating-pro', 'index.html'));
});

app.use('/tic-tac-toe', express.static(path.join(__dirname, 'Love')));
app.get('/tic-tac-toe', (req, res) => {
    res.sendFile(path.join(__dirname, 'Love', 'index.html'));
});

app.use('/chat-bots', express.static(path.join(__dirname, 'chat-bot')));
app.get('/chat-bots', (req, res) => {
    res.sendFile(path.join(__dirname, 'chat-bot', 'index.html'));
});

app.get('/yume-music', (req, res) => {
    res.sendFile(path.join(__dirname, 'yume.html'));
});

app.get('/yume.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'yume.png'));
});

app.get('/YumeMusic.apk', (req, res) => {
    res.download(path.join(__dirname, 'YumeMusic.apk'), 'YumeMusic.apk');
});

app.get('/download-yume-music', async (req, res) => {
    const filePath = path.join(__dirname, 'YumeMusic.apk');
    if (fs.existsSync(filePath)) {
        await incrementDownloadCount();
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="YumeMusic.apk"');
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } else {
        res.status(404).send('File not found');
    }
});

app.get('/api/download-count', async (req, res) => {
    const count = await getDownloadCount();
    res.json({ count });
});

app.use(express.static(path.join(__dirname, 'PORTFOLIO')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'PORTFOLIO', 'index.html'));
});

const rooms = new Map();

const INACTIVITY_WARNING_MS = 8000;
const INACTIVITY_TIMEOUT_MS = 15000;

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

function resetInactivityTimer(room, roomId) {
    if (room.inactivityWarningTimer) clearTimeout(room.inactivityWarningTimer);
    if (room.inactivityTimeoutTimer) clearTimeout(room.inactivityTimeoutTimer);
    room.inactivityWarningSent = false;

    if (!room.gameActive || room.players.length < 2) return;

    const currentPlayer = room.players.find(p => p.symbol === room.currentTurn);
    if (!currentPlayer) return;

    room.inactivityWarningTimer = setTimeout(() => {
        if (!room.gameActive) return;
        room.inactivityWarningSent = true;
        io.to(currentPlayer.id).emit('inactivity-warning', {
            secondsLeft: Math.round((INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_MS) / 1000)
        });
    }, INACTIVITY_WARNING_MS);

    room.inactivityTimeoutTimer = setTimeout(() => {
        if (!room.gameActive) return;
        room.gameActive = false;
        io.to(roomId).emit('inactivity-timeout', {
            timedOutPlayer: currentPlayer.name,
            timedOutSymbol: currentPlayer.symbol
        });
        clearInactivityTimers(room);
    }, INACTIVITY_TIMEOUT_MS);
}

function clearInactivityTimers(room) {
    if (room.inactivityWarningTimer) { clearTimeout(room.inactivityWarningTimer); room.inactivityWarningTimer = null; }
    if (room.inactivityTimeoutTimer) { clearTimeout(room.inactivityTimeoutTimer); room.inactivityTimeoutTimer = null; }
    room.inactivityWarningSent = false;
}

function checkWinner(board) {
    const combos = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of combos) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], combo: [a,b,c] };
        }
    }
    if (!board.includes('')) return { winner: 'draw' };
    return null;
}

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('create-room', (data) => {
        const roomId = uuidv4().substring(0, 8);
        const roomCode = generateRoomCode();
        const room = {
            id: roomId,
            code: roomCode,
            players: [{
                id: socket.id,
                name: data.name || 'Player 1',
                symbol: 'X'
            }],
            spectators: [],
            board: ['','','','','','','','',''],
            currentTurn: 'X',
            totalRounds: data.rounds || 3,
            currentRound: 1,
            scores: { X: 0, O: 0, draws: 0 },
            gameActive: true,
            createdAt: Date.now(),
            inactivityWarningTimer: null,
            inactivityTimeoutTimer: null,
            inactivityWarningSent: false
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        socket.roomId = roomId;
        socket.isSpectator = false;
        socket.emit('room-created', {
            roomId,
            roomCode,
            playerSymbol: 'X',
            playerName: data.name,
            totalRounds: room.totalRounds
        });
    });

    socket.on('join-room', (data) => {
        let room = null;
        let roomId = null;

        if (data.roomId) {
            room = rooms.get(data.roomId);
            roomId = data.roomId;
        }
        if (!room && data.code) {
            for (const [id, r] of rooms) {
                if (r.code === data.code.toUpperCase()) {
                    room = r;
                    roomId = id;
                    break;
                }
            }
        }

        if (!room) {
            socket.emit('join-error', { message: 'Room not found. Please check the code and try again.' });
            return;
        }
        if (room.players.length >= 2) {
            const playerNames = room.players.map(p => ({ name: p.name, symbol: p.symbol }));
            socket.emit('room-full', {
                roomId: roomId,
                players: playerNames,
                currentRound: room.currentRound,
                totalRounds: room.totalRounds
            });
            return;
        }

        room.players.push({
            id: socket.id,
            name: data.name || 'Player 2',
            symbol: 'O'
        });

        socket.join(roomId);
        socket.roomId = roomId;
        socket.isSpectator = false;

        socket.emit('room-joined', {
            roomId,
            roomCode: room.code,
            playerSymbol: 'O',
            playerName: data.name,
            opponentName: room.players[0].name,
            totalRounds: room.totalRounds,
            currentRound: room.currentRound,
            scores: room.scores
        });

        io.to(roomId).emit('game-start', {
            players: room.players.map(p => ({ name: p.name, symbol: p.symbol })),
            board: room.board,
            currentTurn: room.currentTurn,
            totalRounds: room.totalRounds,
            currentRound: room.currentRound,
            scores: room.scores
        });

        resetInactivityTimer(room, roomId);
    });

    socket.on('spectate-room', (data) => {
        let room = null;
        let roomId = null;

        if (data.roomId) {
            room = rooms.get(data.roomId);
            roomId = data.roomId;
        }

        if (!room) {
            socket.emit('join-error', { message: 'Room not found.' });
            return;
        }

        room.spectators.push({ id: socket.id, name: data.name || 'Spectator' });
        socket.join(roomId);
        socket.roomId = roomId;
        socket.isSpectator = true;

        const spectatorCount = room.spectators.length;
        io.to(roomId).emit('spectator-count', { count: spectatorCount });

        socket.emit('spectate-started', {
            roomId: roomId,
            players: room.players.map(p => ({ name: p.name, symbol: p.symbol })),
            board: room.board,
            currentTurn: room.currentTurn,
            totalRounds: room.totalRounds,
            currentRound: room.currentRound,
            scores: room.scores,
            gameActive: room.gameActive
        });
    });

    socket.on('make-move', (data) => {
        const room = rooms.get(socket.roomId);
        if (!room || !room.gameActive) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;
        if (player.symbol !== room.currentTurn) return;
        if (room.board[data.index] !== '') return;

        room.board[data.index] = player.symbol;
        const result = checkWinner(room.board);

        if (result) {
            room.gameActive = false;
            clearInactivityTimers(room);
            if (result.winner === 'draw') {
                room.scores.draws++;
            } else {
                room.scores[result.winner]++;
            }

            io.to(socket.roomId).emit('move-made', {
                index: data.index,
                symbol: player.symbol,
                playerName: player.name
            });

            const roundOver = room.currentRound >= room.totalRounds;
            let matchWinner = null;
            if (roundOver) {
                if (room.scores.X > room.scores.O) matchWinner = room.players.find(p => p.symbol === 'X').name;
                else if (room.scores.O > room.scores.X) matchWinner = room.players.find(p => p.symbol === 'O').name;
                else matchWinner = 'tie';
            }

            io.to(socket.roomId).emit('round-over', {
                result: result,
                scores: room.scores,
                currentRound: room.currentRound,
                totalRounds: room.totalRounds,
                isMatchOver: roundOver,
                matchWinner: matchWinner,
                winnerName: result.winner !== 'draw' ? room.players.find(p => p.symbol === result.winner).name : null
            });
        } else {
            room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
            io.to(socket.roomId).emit('move-made', {
                index: data.index,
                symbol: player.symbol,
                playerName: player.name,
                nextTurn: room.currentTurn
            });
            resetInactivityTimer(room, socket.roomId);
        }
    });

    socket.on('next-round', () => {
        const room = rooms.get(socket.roomId);
        if (!room) return;
        if (room.gameActive) return;
        if (room.currentRound >= room.totalRounds) return;
        room.currentRound++;
        room.board = ['','','','','','','','',''];
        room.currentTurn = 'X';
        room.gameActive = true;

        io.to(socket.roomId).emit('new-round', {
            currentRound: room.currentRound,
            totalRounds: room.totalRounds,
            board: room.board,
            currentTurn: room.currentTurn,
            scores: room.scores
        });

        resetInactivityTimer(room, socket.roomId);
    });

    socket.on('rematch', () => {
        const room = rooms.get(socket.roomId);
        if (!room) return;
        if (room.gameActive) return;
        room.currentRound = 1;
        room.board = ['','','','','','','','',''];
        room.currentTurn = 'X';
        room.gameActive = true;
        room.scores = { X: 0, O: 0, draws: 0 };

        io.to(socket.roomId).emit('rematch-start', {
            currentRound: 1,
            totalRounds: room.totalRounds,
            board: room.board,
            currentTurn: room.currentTurn,
            scores: room.scores,
            players: room.players.map(p => ({ name: p.name, symbol: p.symbol }))
        });

        resetInactivityTimer(room, socket.roomId);
    });

    socket.on('send-sticker', (data) => {
        const room = rooms.get(socket.roomId);
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;
        socket.to(socket.roomId).emit('sticker-received', {
            sticker: data.sticker,
            from: player.name,
            fromSymbol: player.symbol
        });
    });

    socket.on('update-rounds', (data) => {
        const room = rooms.get(socket.roomId);
        if (!room) return;
        const rounds = parseInt(data.rounds);
        if (!rounds || rounds < 1 || rounds > 99) return;
        room.totalRounds = rounds;
        io.to(socket.roomId).emit('rounds-updated', { totalRounds: rounds });
    });

    socket.on('leave-game', () => {
        if (socket.roomId) {
            const room = rooms.get(socket.roomId);
            if (room) {
                if (socket.isSpectator) {
                    room.spectators = room.spectators.filter(s => s.id !== socket.id);
                    io.to(socket.roomId).emit('spectator-count', { count: room.spectators.length });
                } else {
                    clearInactivityTimers(room);
                    const player = room.players.find(p => p.id === socket.id);
                    socket.to(socket.roomId).emit('player-left', {
                        name: player ? player.name : 'Opponent'
                    });
                    rooms.delete(socket.roomId);
                }
            }
            socket.leave(socket.roomId);
            socket.roomId = null;
            socket.isSpectator = false;
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        if (socket.roomId) {
            const room = rooms.get(socket.roomId);
            if (room) {
                if (socket.isSpectator) {
                    room.spectators = room.spectators.filter(s => s.id !== socket.id);
                    io.to(socket.roomId).emit('spectator-count', { count: room.spectators.length });
                } else {
                    clearInactivityTimers(room);
                    const player = room.players.find(p => p.id === socket.id);
                    socket.to(socket.roomId).emit('player-left', {
                        name: player ? player.name : 'Opponent'
                    });
                    rooms.delete(socket.roomId);
                }
            }
        }
    });
});

setInterval(() => {
    const now = Date.now();
    for (const [id, room] of rooms) {
        if (now - room.createdAt > 3600000) {
            rooms.delete(id);
        }
    }
}, 600000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Portfolio: http://localhost:${PORT}/`);
    console.log(`Code Formatting Pro: http://localhost:${PORT}/code-formating-pro`);
    console.log(`Tic-Tac-Toe: http://localhost:${PORT}/tic-tac-toe`);
    console.log(`Chat Bots: http://localhost:${PORT}/chat-bots`);
});
