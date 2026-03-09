
document.addEventListener('DOMContentLoaded', () => {
    const socket = io({ path: '/socket.io' });

    const landingPage = document.getElementById('landing-page');
    const gamePage = document.getElementById('game-page');
    const boardElement = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const statusText = document.getElementById('status');
    const scoreXText = document.getElementById('score-x');
    const scoreOText = document.getElementById('score-o');
    const scoreDrawText = document.getElementById('score-draw');
    const roundInfo = document.getElementById('round-info');
    const playerXName = document.getElementById('player-x-name');
    const playerOName = document.getElementById('player-o-name');
    const scoreXLabel = document.getElementById('score-x-label');
    const scoreOLabel = document.getElementById('score-o-label');

    let gameMode = null;
    let mySymbol = null;
    let myName = '';
    let opponentName = '';
    let roomId = null;
    let currentTurn = 'X';
    let gameActive = true;
    let gameState = ['','','','','','','','',''];
    let totalRounds = 3;
    let currentRound = 1;
    let scores = { X: 0, O: 0, draws: 0 };
    let soundEnabled = true;
    let isOnline = false;
    let stickerTimeout = null;
    let isSpectator = false;
    let inactivityCountdownInterval = null;
    let pendingRoomFullData = null;

    const ANIM_CDN = 'https://fonts.gstatic.com/s/e/notoemoji/latest';

    const stickers = [
        { emoji: '😂', code: '1f602' },
        { emoji: '😎', code: '1f60e' },
        { emoji: '🤣', code: '1f923' },
        { emoji: '💪', code: '1f4aa' },
        { emoji: '🏆', code: '1f3c6' },
        { emoji: '🔥', code: '1f525' },
        { emoji: '💀', code: '1f480' },
        { emoji: '🤡', code: '1f921' },
        { emoji: '😤', code: '1f624' },
        { emoji: '😈', code: '1f608' },
        { emoji: '👻', code: '1f47b' },
        { emoji: '🎉', code: '1f389' },
        { emoji: '🥳', code: '1f973' },
        { emoji: '😜', code: '1f61c' },
        { emoji: '🤪', code: '1f92a' },
        { emoji: '👎', code: '1f44e' },
        { emoji: '👍', code: '1f44d' },
        { emoji: '🫡', code: '1fae1' },
        { emoji: '🤯', code: '1f92f' },
        { emoji: '😱', code: '1f631' },
        { emoji: '🥶', code: '1f976' },
        { emoji: '💩', code: '1f4a9' },
        { emoji: '🤓', code: '1f913' },
        { emoji: '😏', code: '1f60f' },
        { emoji: '🙄', code: '1f644' },
        { emoji: '😴', code: '1f634' },
        { emoji: '🤫', code: '1f92b' },
        { emoji: '🫣', code: '1fae3' },
        { emoji: '😭', code: '1f62d' },
        { emoji: '💅', code: '1f485' },
        { emoji: '😍', code: '1f60d' },
        { emoji: '🤩', code: '1f929' }
    ];

    function getAnimUrl(code) {
        return `${ANIM_CDN}/${code}/512.webp`;
    }

    function preloadStickers() {
        stickers.forEach(s => {
            const img = new Image();
            img.src = getAnimUrl(s.code);
        });
    }

    let audioCtx = null;
    let masterGain = null;

    function getAudioCtx() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                masterGain = audioCtx.createGain();
                masterGain.connect(audioCtx.destination);
                masterGain.gain.value = soundEnabled ? 1 : 0;
            } catch(e) {}
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    function setSoundEnabled(enabled) {
        soundEnabled = enabled;
        if (masterGain) {
            masterGain.gain.setValueAtTime(enabled ? 1 : 0, audioCtx.currentTime);
        }
    }

    function playSound(type) {
        if (!soundEnabled) return;
        const ctx = getAudioCtx();
        if (!ctx || !masterGain) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);

            switch(type) {
                case 'move':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
                    gain.gain.setValueAtTime(0.15, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.12);
                    break;
                case 'win':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(523, ctx.currentTime);
                    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12);
                    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24);
                    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.36);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.55);
                    break;
                case 'lose':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(400, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4);
                    gain.gain.setValueAtTime(0.12, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.4);
                    break;
                case 'draw':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(440, ctx.currentTime);
                    gain.gain.setValueAtTime(0.15, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.25);
                    break;
                case 'click':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1000, ctx.currentTime);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.05);
                    break;
                case 'sticker':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.25);
                    break;
                case 'join':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400, ctx.currentTime);
                    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
                    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.15, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.3);
                    break;
            }
        } catch(e) {}
    }

    function initStickerGrid() {
        const grid = document.getElementById('sticker-grid');
        grid.innerHTML = '';
        stickers.forEach(s => {
            const item = document.createElement('div');
            item.className = 'sticker-item';
            item.textContent = s.emoji;
            item.addEventListener('click', () => {
                if (isOnline && roomId) {
                    socket.emit('send-sticker', { sticker: s.code });
                    playSound('sticker');
                    showStickerDisplay(myName, s.code);
                    toggleStickerPanel();
                }
            });
            grid.appendChild(item);
        });
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        document.getElementById('toast-msg').textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    }

    window.copyText = function(elementId) {
        const text = document.getElementById(elementId).textContent;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied!');
            playSound('click');
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Copied!');
        });
    };

    window.closeModal = function(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    };

    window.toggleStickerPanel = function() {
        const panel = document.getElementById('sticker-panel');
        panel.classList.toggle('hidden');
    };

    function openModal(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('hidden');
            const content = el.querySelector('.modal-content');
            if (content && window.gsap) {
                gsap.fromTo(content, { scale: 0.85, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.5)' });
            }
        }
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        document.getElementById('sticker-panel').classList.add('hidden');
        clearInactivityUI();
    }

    function showScreen(screen) {
        landingPage.classList.add('hidden');
        gamePage.classList.add('hidden');
        screen.classList.remove('hidden');
        if (window.gsap) {
            gsap.fromTo(screen, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        }
    }

    function placeMark(index, symbol) {
        const cell = cells[index];
        if (cell.querySelector('.mark')) return;

        const icon = document.createElement('div');
        icon.className = 'mark';
        icon.innerHTML = symbol === 'X' ?
            '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' :
            '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="9"></circle></svg>';

        cell.appendChild(icon);
        if (window.gsap) {
            gsap.fromTo(icon, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(2)' });
        }
    }

    function clearBoard() {
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('win-cell', 'disabled');
        });
        gameState = ['','','','','','','','',''];
    }

    function updateScoreboard() {
        scoreXText.textContent = scores.X;
        scoreOText.textContent = scores.O;
        scoreDrawText.textContent = scores.draws;
    }

    function updateStatus(text) {
        statusText.textContent = text;
        if (window.gsap) {
            gsap.fromTo(statusText, { opacity: 0, y: -5 }, { opacity: 0.7, y: 0, duration: 0.2 });
        }
    }

    function disableBoard() {
        cells.forEach(c => c.classList.add('disabled'));
    }

    function enableBoard() {
        cells.forEach(c => c.classList.remove('disabled'));
    }

    const winningConditions = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

    function checkResult(board) {
        for (const [a,b,c] of winningConditions) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], combo: [a,b,c] };
            }
        }
        if (!board.includes('')) return { winner: 'draw' };
        return null;
    }

    function minimax(board, player) {
        const avail = board.map((v,i) => v === '' ? i : null).filter(v => v !== null);
        const res = checkResult(board);
        if (res) {
            if (res.winner === 'X') return { score: -10 };
            if (res.winner === 'O') return { score: 10 };
            return { score: 0 };
        }
        const moves = [];
        for (const spot of avail) {
            const move = { index: spot };
            board[spot] = player;
            move.score = minimax(board, player === 'O' ? 'X' : 'O').score;
            board[spot] = '';
            moves.push(move);
        }
        let best;
        if (player === 'O') {
            let bestScore = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) { bestScore = moves[i].score; best = i; }
            }
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) { bestScore = moves[i].score; best = i; }
            }
        }
        return moves[best];
    }

    function handleAIMove() {
        if (!gameActive || currentTurn !== 'O') return;
        disableBoard();
        updateStatus('AI Thinking...');
        setTimeout(() => {
            const move = minimax([...gameState], 'O');
            if (move && move.index !== undefined) {
                gameState[move.index] = 'O';
                placeMark(move.index, 'O');
                playSound('move');
                const result = checkResult(gameState);
                if (result) {
                    handleLocalGameOver(result);
                } else {
                    currentTurn = 'X';
                    updateStatus("Your Turn");
                    enableBoard();
                }
            }
        }, 500);
    }

    function handleLocalGameOver(result) {
        gameActive = false;
        disableBoard();

        if (result.combo) {
            result.combo.forEach(i => cells[i].classList.add('win-cell'));
        }

        if (result.winner === 'draw') {
            scores.draws++;
            playSound('draw');
        } else {
            scores[result.winner]++;
            if ((gameMode === 'ai' && result.winner === 'X') || gameMode === 'friend') {
                playSound('win');
            } else {
                playSound('lose');
            }
        }
        updateScoreboard();

        setTimeout(() => {
            let title;
            if (result.winner === 'draw') {
                title = "It's a Tie!";
            } else if (gameMode === 'ai') {
                title = result.winner === 'X' ? 'You Win!' : 'AI Wins!';
            } else {
                title = `Player ${result.winner} Wins!`;
            }

            const isMatchOver = currentRound >= totalRounds;

            if (isMatchOver) {
                document.getElementById('result-title').textContent = title;
                document.getElementById('result-subtitle').textContent = 'Game Over!';
                document.getElementById('next-round-btn').classList.add('hidden');
                document.getElementById('rematch-btn').classList.remove('hidden');
            } else {
                document.getElementById('result-title').textContent = title;
                document.getElementById('result-subtitle').textContent = `Round ${currentRound} of ${totalRounds}`;
                document.getElementById('next-round-btn').classList.remove('hidden');
                document.getElementById('rematch-btn').classList.add('hidden');
            }
            openModal('result-modal');
        }, 600);
    }

    function startLocalNextRound() {
        currentRound++;
        roundInfo.textContent = `Round ${currentRound}/${totalRounds}`;
        clearBoard();
        gameActive = true;
        currentTurn = 'X';
        updateStatus(gameMode === 'ai' ? 'Your Turn' : "Player X's Turn");
        enableBoard();
        closeAllModals();
    }

    function startLocalRematch() {
        currentRound = 1;
        scores = { X: 0, O: 0, draws: 0 };
        updateScoreboard();
        roundInfo.textContent = `Round 1/${totalRounds}`;
        clearBoard();
        gameActive = true;
        currentTurn = 'X';
        updateStatus(gameMode === 'ai' ? 'Your Turn' : "Player X's Turn");
        enableBoard();
        closeAllModals();
    }

    function showStickerDisplay(from, stickerCode) {
        if (stickerTimeout) {
            clearTimeout(stickerTimeout);
            stickerTimeout = null;
        }

        const display = document.getElementById('sticker-display');
        const fromEl = document.getElementById('sticker-from-name');
        const emojiEl = document.getElementById('sticker-emoji-display');
        fromEl.textContent = from;
        emojiEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = getAnimUrl(stickerCode);
        img.alt = '';
        img.className = 'sticker-anim-img';
        img.draggable = false;
        emojiEl.appendChild(img);
        display.classList.remove('hidden');

        const bubble = display.querySelector('.sticker-bubble');
        if (window.gsap) {
            gsap.killTweensOf(bubble);
            gsap.killTweensOf(img);
            gsap.fromTo(bubble,
                { scale: 0.3, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' }
            );
            gsap.fromTo(img,
                { scale: 0.5, rotation: -15 },
                { scale: 1, rotation: 0, duration: 0.5, delay: 0.15, ease: 'back.out(1.7)' }
            );
        }

        stickerTimeout = setTimeout(() => {
            if (window.gsap) {
                gsap.to(bubble, {
                    scale: 0.85, opacity: 0, y: -10, duration: 0.6, ease: 'power2.inOut',
                    onComplete: () => display.classList.add('hidden')
                });
            } else {
                display.classList.add('hidden');
            }
            stickerTimeout = null;
        }, 3500);
    }

    document.getElementById('play-friend').addEventListener('click', () => {
        playSound('click');
        openModal('friend-mode-modal');
    });

    document.getElementById('play-ai').addEventListener('click', () => {
        playSound('click');
        gameMode = 'ai';
        isOnline = false;
        mySymbol = 'X';
        totalRounds = 1;
        currentRound = 1;
        scores = { X: 0, O: 0, draws: 0 };
        playerXName.textContent = 'You';
        playerOName.textContent = 'AI';
        scoreXLabel.textContent = 'You';
        scoreOLabel.textContent = 'AI';
        roundInfo.textContent = `Round 1/${totalRounds}`;
        updateScoreboard();
        clearBoard();
        gameActive = true;
        currentTurn = 'X';
        updateStatus('Your Turn');
        enableBoard();
        showScreen(gamePage);
        document.getElementById('sticker-toggle').classList.add('hidden');
    });

    document.getElementById('create-room-btn').addEventListener('click', () => {
        playSound('click');
        closeModal('friend-mode-modal');
        setTimeout(() => openModal('create-room-modal'), 100);
    });

    document.getElementById('join-room-btn').addEventListener('click', () => {
        playSound('click');
        closeModal('friend-mode-modal');
        setTimeout(() => openModal('join-room-modal'), 100);
    });

    let selectedRounds = 1;
    document.querySelectorAll('.round-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            document.querySelectorAll('.round-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const val = btn.getAttribute('data-rounds');
            if (val === 'custom') {
                document.getElementById('custom-rounds-input').classList.remove('hidden');
            } else {
                document.getElementById('custom-rounds-input').classList.add('hidden');
                selectedRounds = parseInt(val);
            }
        });
    });

    document.getElementById('custom-rounds-input').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (val >= 1 && val <= 99) selectedRounds = val;
    });

    document.getElementById('confirm-create-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('create-name-input');
        const name = nameInput.value.trim();
        if (!name) {
            nameInput.style.borderColor = '#ff4444';
            nameInput.focus();
            return;
        }
        nameInput.style.borderColor = '';
        const customInput = document.getElementById('custom-rounds-input');
        if (!customInput.classList.contains('hidden')) {
            const val = parseInt(customInput.value);
            if (!val || val < 1 || val > 99) {
                customInput.style.borderColor = '#ff4444';
                customInput.focus();
                return;
            }
            selectedRounds = val;
        }

        playSound('click');
        myName = name;
        gameMode = 'online';
        isOnline = true;
        socket.emit('create-room', { name: myName, rounds: selectedRounds });
        closeModal('create-room-modal');
    });

    let pendingRoomId = null;

    document.getElementById('confirm-join-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('join-name-input');
        const name = nameInput.value.trim();
        const errEl = document.getElementById('join-error');

        if (!name) {
            nameInput.style.borderColor = '#ff4444';
            nameInput.focus();
            return;
        }
        nameInput.style.borderColor = '';

        if (!pendingRoomId) {
            const codeInput = document.getElementById('join-code-input');
            const code = codeInput.value.trim().toUpperCase();
            if (!code) {
                codeInput.style.borderColor = '#ff4444';
                codeInput.focus();
                return;
            }
            codeInput.style.borderColor = '';
            playSound('click');
            myName = name;
            gameMode = 'online';
            isOnline = true;
            errEl.classList.add('hidden');
            socket.emit('join-room', { name: myName, code: code });
        } else {
            playSound('click');
            myName = name;
            gameMode = 'online';
            isOnline = true;
            errEl.classList.add('hidden');
            socket.emit('join-room', { name: myName, roomId: pendingRoomId });
        }
    });

    socket.on('room-created', (data) => {
        roomId = data.roomId;
        mySymbol = data.playerSymbol;
        totalRounds = data.totalRounds;

        const baseUrl = window.location.origin + window.location.pathname;
        const shareLink = `${baseUrl}?room=${data.roomId}`;

        document.getElementById('room-code-display').textContent = data.roomCode;
        document.getElementById('room-link-display').textContent = shareLink;
        openModal('share-room-modal');
    });

    socket.on('join-error', (data) => {
        const errEl = document.getElementById('join-error');
        errEl.textContent = data.message;
        errEl.classList.remove('hidden');
    });

    socket.on('room-joined', (data) => {
        roomId = data.roomId;
        mySymbol = data.playerSymbol;
        opponentName = data.opponentName;
        totalRounds = data.totalRounds;
        currentRound = data.currentRound;
        scores = data.scores;
        closeAllModals();
        playSound('join');
    });

    socket.on('game-start', (data) => {
        closeAllModals();
        playSound('join');

        const players = data.players;
        const xPlayer = players.find(p => p.symbol === 'X');
        const oPlayer = players.find(p => p.symbol === 'O');

        playerXName.textContent = xPlayer.name;
        playerOName.textContent = oPlayer.name;
        scoreXLabel.textContent = xPlayer.name.substring(0, 8);
        scoreOLabel.textContent = oPlayer.name.substring(0, 8);

        totalRounds = data.totalRounds;
        currentRound = data.currentRound;
        scores = data.scores;
        currentTurn = data.currentTurn;
        gameActive = true;

        roundInfo.textContent = `Round ${currentRound}/${totalRounds}`;
        updateScoreboard();
        clearBoard();

        if (mySymbol === currentTurn) {
            updateStatus('Your Turn');
            enableBoard();
        } else {
            updateStatus("Opponent's Turn");
            disableBoard();
        }

        showScreen(gamePage);
        document.getElementById('sticker-toggle').classList.remove('hidden');
        initStickerGrid();
        preloadStickers();
    });

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const index = parseInt(cell.getAttribute('data-index'));

            if (gameMode === 'online') {
                if (!gameActive || gameState[index] !== '' || mySymbol !== currentTurn) return;
                socket.emit('make-move', { index });
            } else if (gameMode === 'ai') {
                if (!gameActive || gameState[index] !== '' || currentTurn !== 'X') return;
                gameState[index] = 'X';
                placeMark(index, 'X');
                playSound('move');
                const result = checkResult(gameState);
                if (result) {
                    handleLocalGameOver(result);
                } else {
                    currentTurn = 'O';
                    handleAIMove();
                }
            } else if (gameMode === 'friend-local') {
                if (!gameActive || gameState[index] !== '') return;
                gameState[index] = currentTurn;
                placeMark(index, currentTurn);
                playSound('move');
                const result = checkResult(gameState);
                if (result) {
                    handleLocalGameOver(result);
                } else {
                    currentTurn = currentTurn === 'X' ? 'O' : 'X';
                    updateStatus(`Player ${currentTurn}'s Turn`);
                }
            }
        });
    });

    socket.on('move-made', (data) => {
        gameState[data.index] = data.symbol;
        placeMark(data.index, data.symbol);
        playSound('move');

        if (isSpectator) {
            clearInactivityUI();
        }

        if (data.nextTurn) {
            currentTurn = data.nextTurn;
            if (isSpectator) {
                const xName = playerXName.textContent;
                const oName = playerOName.textContent;
                const nextName = data.nextTurn === 'X' ? xName : oName;
                updateStatus(`${nextName}'s Turn`);
                disableBoard();
            } else if (mySymbol === currentTurn) {
                updateStatus('Your Turn');
                enableBoard();
            } else {
                updateStatus("Opponent's Turn");
                disableBoard();
            }
        }
    });

    socket.on('round-over', (data) => {
        gameActive = false;
        disableBoard();
        clearInactivityUI();
        scores = data.scores;
        updateScoreboard();

        if (data.result.combo) {
            data.result.combo.forEach(i => cells[i].classList.add('win-cell'));
        }

        const iWon = !isSpectator && data.result.winner === mySymbol;
        const isDraw = data.result.winner === 'draw';

        if (isDraw) {
            playSound('draw');
        } else if (isSpectator) {
            playSound('win');
        } else if (iWon) {
            playSound('win');
        } else {
            playSound('lose');
        }

        setTimeout(() => {
            if (data.isMatchOver) {
                let winTitle, winSub;
                if (data.matchWinner === 'tie') {
                    winTitle = "It's a Tie Match!";
                    winSub = 'Both players played equally well';
                } else if (isSpectator) {
                    winTitle = `${data.matchWinner} Wins!`;
                    winSub = 'What a match!';
                } else {
                    const didIWinMatch = data.matchWinner === myName;
                    winTitle = didIWinMatch ? 'You Won the Match!' : `${data.matchWinner} Wins!`;
                    winSub = didIWinMatch ? 'Congratulations!' : 'Better luck next time!';
                }

                document.getElementById('match-winner-title').textContent = winTitle;
                document.getElementById('match-winner-subtitle').textContent = winSub;

                const xName = playerXName.textContent;
                const oName = playerOName.textContent;
                document.getElementById('final-x-name').textContent = xName;
                document.getElementById('final-o-name').textContent = oName;
                document.getElementById('final-x-score').textContent = scores.X;
                document.getElementById('final-o-score').textContent = scores.O;

                if (isSpectator) {
                    document.getElementById('rematch-final-btn').classList.add('hidden');
                }

                openModal('match-over-modal');
            } else {
                let title;
                if (isDraw) title = "It's a Tie!";
                else if (isSpectator) title = `${data.winnerName} Wins This Round!`;
                else title = iWon ? 'You Win This Round!' : `${data.winnerName} Wins!`;

                document.getElementById('result-title').textContent = title;
                document.getElementById('result-subtitle').textContent = `Round ${data.currentRound} of ${data.totalRounds}`;

                if (isSpectator) {
                    document.getElementById('next-round-btn').classList.add('hidden');
                    document.getElementById('rematch-btn').classList.add('hidden');
                } else {
                    document.getElementById('next-round-btn').classList.remove('hidden');
                    document.getElementById('rematch-btn').classList.add('hidden');
                }
                openModal('result-modal');
            }
        }, 600);
    });

    document.getElementById('next-round-btn').addEventListener('click', () => {
        playSound('click');
        closeAllModals();
        if (isOnline) {
            socket.emit('next-round');
        } else {
            startLocalNextRound();
        }
    });

    document.getElementById('rematch-btn').addEventListener('click', () => {
        playSound('click');
        closeAllModals();
        if (isOnline) {
            socket.emit('rematch');
        } else {
            startLocalRematch();
        }
    });

    document.getElementById('rematch-final-btn').addEventListener('click', () => {
        playSound('click');
        closeAllModals();
        if (isOnline) {
            socket.emit('rematch');
        } else {
            startLocalRematch();
        }
    });

    document.getElementById('leave-final-btn').addEventListener('click', () => {
        playSound('click');
        goHome();
    });

    socket.on('new-round', (data) => {
        currentRound = data.currentRound;
        totalRounds = data.totalRounds;
        currentTurn = data.currentTurn;
        scores = data.scores;
        gameActive = true;

        roundInfo.textContent = `Round ${currentRound}/${totalRounds}`;
        updateScoreboard();
        clearBoard();
        closeAllModals();

        if (isSpectator) {
            const xName = playerXName.textContent;
            const oName = playerOName.textContent;
            const nextName = currentTurn === 'X' ? xName : oName;
            updateStatus(`${nextName}'s Turn`);
            disableBoard();
        } else if (mySymbol === currentTurn) {
            updateStatus('Your Turn');
            enableBoard();
        } else {
            updateStatus("Opponent's Turn");
            disableBoard();
        }
    });

    socket.on('rematch-start', (data) => {
        currentRound = 1;
        totalRounds = data.totalRounds;
        currentTurn = data.currentTurn;
        scores = data.scores;
        gameActive = true;

        roundInfo.textContent = `Round 1/${totalRounds}`;
        updateScoreboard();
        clearBoard();
        closeAllModals();

        if (isSpectator) {
            const xName = playerXName.textContent;
            const oName = playerOName.textContent;
            const nextName = currentTurn === 'X' ? xName : oName;
            updateStatus(`${nextName}'s Turn`);
            disableBoard();
        } else if (mySymbol === currentTurn) {
            updateStatus('Your Turn');
            enableBoard();
        } else {
            updateStatus("Opponent's Turn");
            disableBoard();
        }
    });

    socket.on('sticker-received', (data) => {
        playSound('sticker');
        showStickerDisplay(data.from, data.sticker);
    });

    socket.on('rounds-updated', (data) => {
        totalRounds = data.totalRounds;
        roundInfo.textContent = `Round ${currentRound}/${totalRounds}`;
        syncSettingsRoundPicker();
        showToast(`Rounds updated to ${totalRounds}`);
    });

    document.getElementById('sticker-toggle').addEventListener('click', () => {
        toggleStickerPanel();
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
        playSound('click');
        const soundToggle = document.getElementById('sound-toggle');
        soundToggle.checked = soundEnabled;
        syncSettingsRoundPicker();
        if (!isOnline) {
            document.getElementById('rounds-setting').style.display = '';
        } else {
            document.getElementById('rounds-setting').style.display = 'none';
        }
        openModal('settings-modal');
    });

    document.getElementById('sound-toggle').addEventListener('change', (e) => {
        setSoundEnabled(e.target.checked);
        if (soundEnabled) playSound('click');
    });

    function syncSettingsRoundPicker() {
        document.querySelectorAll('.settings-round-opt').forEach(btn => {
            const val = parseInt(btn.getAttribute('data-val'));
            if (val === totalRounds) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    document.querySelectorAll('.settings-round-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            const val = parseInt(btn.getAttribute('data-val'));
            document.querySelectorAll('.settings-round-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (isOnline) {
                socket.emit('update-rounds', { rounds: val });
            } else {
                totalRounds = val;
                roundInfo.textContent = `Round ${currentRound}/${totalRounds}`;
            }
        });
    });

    document.getElementById('leave-game-btn').addEventListener('click', () => {
        playSound('click');
        closeModal('settings-modal');
        setTimeout(() => openModal('leave-confirm-modal'), 100);
    });

    document.getElementById('leave-yes').addEventListener('click', () => {
        playSound('click');
        goHome();
    });

    document.getElementById('leave-no').addEventListener('click', () => {
        playSound('click');
        closeModal('leave-confirm-modal');
    });

    socket.on('player-left', (data) => {
        gameActive = false;
        disableBoard();
        clearInactivityUI();
        closeAllModals();
        document.getElementById('player-left-title').textContent = `${data.name} Left`;
        document.getElementById('player-left-msg').textContent = `${data.name} has disconnected from the game.`;
        openModal('player-left-modal');
        playSound('lose');
    });

    socket.on('inactivity-warning', (data) => {
        let secondsLeft = data.secondsLeft;
        document.getElementById('inactivity-countdown').textContent = secondsLeft;
        const bar = document.getElementById('countdown-bar');
        bar.style.transition = 'none';
        bar.style.width = '100%';
        openModal('inactivity-warning-modal');
        playSound('click');

        setTimeout(() => {
            bar.style.transition = `width ${secondsLeft}s linear`;
            bar.style.width = '0%';
        }, 50);

        if (inactivityCountdownInterval) clearInterval(inactivityCountdownInterval);
        inactivityCountdownInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(inactivityCountdownInterval);
                inactivityCountdownInterval = null;
                document.getElementById('inactivity-countdown').textContent = '0';
            } else {
                document.getElementById('inactivity-countdown').textContent = secondsLeft;
            }
        }, 1000);
    });

    document.getElementById('inactivity-dismiss-btn').addEventListener('click', () => {
        playSound('click');
        closeModal('inactivity-warning-modal');
        clearInactivityUI();
    });

    function clearInactivityUI() {
        if (inactivityCountdownInterval) {
            clearInterval(inactivityCountdownInterval);
            inactivityCountdownInterval = null;
        }
        const modal = document.getElementById('inactivity-warning-modal');
        if (modal) modal.classList.add('hidden');
    }

    socket.on('inactivity-timeout', (data) => {
        gameActive = false;
        disableBoard();
        clearInactivityUI();
        closeAllModals();

        const iTimedOut = (isOnline && !isSpectator &&
            ((mySymbol === 'X' && data.timedOutSymbol === 'X') ||
             (mySymbol === 'O' && data.timedOutSymbol === 'O')));

        if (isSpectator) {
            document.getElementById('timeout-title').textContent = 'Game Ended';
            document.getElementById('timeout-msg').textContent = `${data.timedOutPlayer} ran out of time.`;
        } else if (iTimedOut) {
            document.getElementById('timeout-title').textContent = 'Time\'s Up!';
            document.getElementById('timeout-msg').textContent = 'You took too long to make a move. The game has ended.';
        } else {
            document.getElementById('timeout-title').textContent = 'Opponent Timed Out';
            document.getElementById('timeout-msg').textContent = `${data.timedOutPlayer} ran out of time to make a move.`;
        }

        openModal('inactivity-timeout-modal');
        playSound('lose');
    });

    document.getElementById('timeout-home-btn').addEventListener('click', () => {
        playSound('click');
        goHome();
    });

    socket.on('room-full', (data) => {
        pendingRoomFullData = data;
        const xPlayer = data.players.find(p => p.symbol === 'X');
        const oPlayer = data.players.find(p => p.symbol === 'O');
        document.getElementById('room-full-player-x').textContent = xPlayer ? xPlayer.name : 'Player 1';
        document.getElementById('room-full-player-o').textContent = oPlayer ? oPlayer.name : 'Player 2';
        closeAllModals();
        openModal('room-full-modal');
    });

    document.getElementById('watch-play-btn').addEventListener('click', () => {
        playSound('click');
        if (!pendingRoomFullData) return;
        isSpectator = true;
        socket.emit('spectate-room', { roomId: pendingRoomFullData.roomId, name: myName || 'Spectator' });
        closeModal('room-full-modal');
    });

    document.getElementById('room-full-leave-btn').addEventListener('click', () => {
        playSound('click');
        pendingRoomFullData = null;
        closeModal('room-full-modal');
        goHome();
    });

    socket.on('spectate-started', (data) => {
        roomId = data.roomId;
        isSpectator = true;
        isOnline = true;
        gameMode = 'spectator';

        const players = data.players;
        const xPlayer = players.find(p => p.symbol === 'X');
        const oPlayer = players.find(p => p.symbol === 'O');

        playerXName.textContent = xPlayer ? xPlayer.name : 'Player 1';
        playerOName.textContent = oPlayer ? oPlayer.name : 'Player 2';
        scoreXLabel.textContent = (xPlayer ? xPlayer.name : 'X').substring(0, 8);
        scoreOLabel.textContent = (oPlayer ? oPlayer.name : 'O').substring(0, 8);

        totalRounds = data.totalRounds;
        currentRound = data.currentRound;
        scores = data.scores;
        currentTurn = data.currentTurn;
        gameActive = data.gameActive;

        roundInfo.textContent = `Round ${currentRound}/${totalRounds}`;
        updateScoreboard();
        clearBoard();

        for (let i = 0; i < data.board.length; i++) {
            if (data.board[i]) {
                gameState[i] = data.board[i];
                placeMark(i, data.board[i]);
            }
        }

        if (data.gameActive) {
            const currentPlayerName = data.currentTurn === 'X' ? (xPlayer ? xPlayer.name : 'X') : (oPlayer ? oPlayer.name : 'O');
            updateStatus(`${currentPlayerName}'s Turn`);
        } else {
            updateStatus('Waiting for next round...');
        }
        disableBoard();

        showScreen(gamePage);
        document.getElementById('sticker-toggle').classList.add('hidden');
        document.getElementById('spectator-banner').classList.remove('hidden');
        document.getElementById('settings-btn').style.display = 'none';
    });

    socket.on('spectator-count', (data) => {
    });

    document.getElementById('back-home-btn').addEventListener('click', () => {
        playSound('click');
        goHome();
    });

    function goHome() {
        closeAllModals();
        clearInactivityUI();
        if ((isOnline || isSpectator) && roomId) {
            socket.emit('leave-game');
        }
        isOnline = false;
        isSpectator = false;
        pendingRoomFullData = null;
        gameMode = null;
        roomId = null;
        mySymbol = null;
        gameActive = false;
        clearBoard();
        scores = { X: 0, O: 0, draws: 0 };
        currentRound = 1;
        showScreen(landingPage);
        document.getElementById('sticker-toggle').classList.add('hidden');
        document.getElementById('sticker-panel').classList.add('hidden');
        document.getElementById('spectator-banner').classList.add('hidden');
        document.getElementById('settings-btn').style.display = '';
        document.getElementById('rematch-final-btn').classList.remove('hidden');

        pendingRoomId = null;
        document.getElementById('join-code-input').closest('.form-group').style.display = '';
        window.history.replaceState({}, '', window.location.pathname);
    }

    const params = new URLSearchParams(window.location.search);
    const joinRoomIdParam = params.get('room');
    if (joinRoomIdParam) {
        pendingRoomId = joinRoomIdParam;
        openModal('join-room-modal');
        document.getElementById('join-code-input').closest('.form-group').style.display = 'none';
    }

    try {
        if (window.gsap) {
            gsap.fromTo('.logo-icon', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 0.4, duration: 0.5, ease: 'back.out(1.7)' });
            gsap.fromTo('.title', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.15 });
            gsap.fromTo('.subtitle', { y: 10, opacity: 0 }, { y: 0, opacity: 0.4, duration: 0.3, delay: 0.25 });
            gsap.fromTo('#play-friend', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.35 });
            gsap.fromTo('#play-ai', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.45 });
        }
    } catch(e) {}
});