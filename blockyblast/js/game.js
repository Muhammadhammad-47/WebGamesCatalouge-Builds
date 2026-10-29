class BlockyGame {
    constructor() {
        this.board = new Board(8);
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('blocky_best_score') || '0', 10);
        this.streak = 0;
        this.availablePieces = [null, null, null];

        // Dragging state
        this.draggedPieceIndex = null;
        this.draggedPiece = null;
        this.dragElement = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.touchFingerOffset = 70; // Offset above finger so player sees placement clearly

        // DOM elements
        this.boardEl = document.getElementById('game-board');
        this.dockEl = document.getElementById('piece-dock');
        this.scoreEl = document.getElementById('current-score');
        this.bestScoreEl = document.getElementById('best-score');
        this.particlesContainer = document.getElementById('particles-layer');
        this.particles = new ParticleSystem(this.particlesContainer);

        // Modals
        this.gameOverModal = document.getElementById('game-over-modal');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalBestEl = document.getElementById('final-best');

        this.init();
    }

    init() {
        this.bestScoreEl.innerText = this.bestScore;
        this.buildBoardDOM();
        this.bindEvents();
        this.startNewGame();
    }

    buildBoardDOM() {
        this.boardEl.innerHTML = '';
        this.cellElements = [];

        for (let r = 0; r < 8; r++) {
            this.cellElements[r] = [];
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                this.boardEl.appendChild(cell);
                this.cellElements[r][c] = cell;
            }
        }
    }

    startNewGame() {
        this.board.reset();
        this.score = 0;
        this.streak = 0;
        this.updateScore(0);
        this.renderBoard();
        this.spawnDockPieces();
        if (this.gameOverModal) {
            this.gameOverModal.classList.remove('active');
        }
    }

    updateScore(addPoints) {
        this.score += addPoints;
        this.scoreEl.innerText = this.score;

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreEl.innerText = this.bestScore;
            localStorage.setItem('blocky_best_score', this.bestScore);
        }
    }

    renderBoard() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = this.cellElements[r][c];
                const block = this.board.grid[r][c];
                cell.className = 'board-cell';
                cell.innerHTML = '';

                if (block) {
                    cell.classList.add('filled');
                    const img = document.createElement('img');
                    img.src = block.texture;
                    img.className = 'block-img';
                    img.draggable = false;
                    cell.appendChild(img);
                }
            }
        }
    }

    spawnDockPieces() {
        this.availablePieces = [
            getRandomPiece(),
            getRandomPiece(),
            getRandomPiece()
        ];
        this.renderDock();
        window.audioManager.play('new_turn', 0.8);
        this.checkGameOver();
    }

    renderDock() {
        this.dockEl.innerHTML = '';

        for (let i = 0; i < 3; i++) {
            const slot = document.createElement('div');
            slot.className = 'dock-slot';
            slot.dataset.index = i;

            const piece = this.availablePieces[i];
            if (piece) {
                const pieceEl = this.createPieceElement(piece, 24);
                pieceEl.dataset.index = i;
                slot.appendChild(pieceEl);

                // Add pointer drag event
                pieceEl.addEventListener('pointerdown', (e) => this.onPointerDown(e, i, piece, pieceEl));
            }

            this.dockEl.appendChild(slot);
        }
    }

    createPieceElement(piece, cellSize = 24) {
        const shape = piece.shape;
        const rows = shape.length;
        const cols = shape[0].length;

        const container = document.createElement('div');
        container.className = 'piece-container';
        container.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
        container.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const block = document.createElement('div');
                    block.className = 'piece-block';
                    block.style.width = `${cellSize}px`;
                    block.style.height = `${cellSize}px`;

                    const img = document.createElement('img');
                    img.src = piece.texture;
                    img.className = 'block-img';
                    img.draggable = false;
                    block.appendChild(img);
                    container.appendChild(block);
                } else {
                    const empty = document.createElement('div');
                    empty.className = 'piece-empty';
                    container.appendChild(empty);
                }
            }
        }

        return container;
    }

    onPointerDown(e, index, piece, originalEl) {
        e.preventDefault();
        e.stopPropagation();

        this.draggedPieceIndex = index;
        this.draggedPiece = piece;

        window.audioManager.play('pickup', 0.8);

        // Get cell size on board to scale piece 1:1 with board
        const boardRect = this.boardEl.getBoundingClientRect();
        const boardCellSize = (boardRect.width - 20) / 8; // account for gaps/padding

        // Create dragging element
        this.dragElement = this.createPieceElement(piece, boardCellSize);
        this.dragElement.classList.add('dragging');
        document.body.appendChild(this.dragElement);

        originalEl.style.opacity = '0.2';
        this.originalPieceEl = originalEl;

        const pieceRect = this.dragElement.getBoundingClientRect();
        this.dragOffsetX = pieceRect.width / 2;
        this.dragOffsetY = pieceRect.height / 2 + (e.pointerType === 'touch' ? this.touchFingerOffset : 0);

        this.updateDragPosition(e.clientX, e.clientY);

        const onMove = (moveEvent) => {
            moveEvent.preventDefault();
            this.updateDragPosition(moveEvent.clientX, moveEvent.clientY);
            this.updateBoardPreview(moveEvent.clientX, moveEvent.clientY);
        };

        const onUp = (upEvent) => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            this.onPointerUp(upEvent);
        };

        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    }

    updateDragPosition(clientX, clientY) {
        if (!this.dragElement) return;
        const x = clientX - this.dragOffsetX;
        const y = clientY - this.dragOffsetY;
        this.dragElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    getHoveredGridCoords(clientX, clientY) {
        const boardRect = this.boardEl.getBoundingClientRect();
        const dropX = clientX - this.dragOffsetX;
        const dropY = clientY - this.dragOffsetY;

        // Board inner content offset
        const relX = dropX - boardRect.left;
        const relY = dropY - boardRect.top;

        const cellWidth = boardRect.width / 8;
        const cellHeight = boardRect.height / 8;

        const col = Math.round(relX / cellWidth);
        const row = Math.round(relY / cellHeight);

        return { row, col };
    }

    clearPreview() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                this.cellElements[r][c].classList.remove('preview-valid', 'preview-invalid');
            }
        }
    }

    updateBoardPreview(clientX, clientY) {
        this.clearPreview();
        if (!this.draggedPiece) return;

        const { row, col } = this.getHoveredGridCoords(clientX, clientY);
        const shape = this.draggedPiece.shape;

        if (this.board.canPlace(shape, row, col)) {
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        this.cellElements[row + r][col + c].classList.add('preview-valid');
                    }
                }
            }
        }
    }

    onPointerUp(e) {
        this.clearPreview();

        if (!this.draggedPiece) return;

        const { row, col } = this.getHoveredGridCoords(e.clientX, e.clientY);
        const shape = this.draggedPiece.shape;

        if (this.board.canPlace(shape, row, col)) {
            // Valid placement!
            const count = this.board.place(shape, row, col, this.draggedPiece.color, this.draggedPiece.texture);
            this.updateScore(count * 10);
            window.audioManager.play('place', 0.9);

            // Animate snap on newly placed cells
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const cell = this.cellElements[row + r][col + c];
                        cell.classList.add('snap');
                        setTimeout(() => cell.classList.remove('snap'), 250);
                    }
                }
            }

            // Remove piece from dock
            this.availablePieces[this.draggedPieceIndex] = null;
            this.renderBoard();

            // Check completed lines
            this.processCompletedLines();

            // Check if all 3 dock pieces used
            if (this.availablePieces.every(p => p === null)) {
                setTimeout(() => this.spawnDockPieces(), 200);
            } else {
                this.renderDock();
                this.checkGameOver();
            }
        } else {
            // Invalid - snap back
            if (this.originalPieceEl) {
                this.originalPieceEl.style.opacity = '1';
            }
        }

        // Clean up drag element
        if (this.dragElement && this.dragElement.parentNode) {
            this.dragElement.parentNode.removeChild(this.dragElement);
        }
        this.dragElement = null;
        this.draggedPiece = null;
        this.draggedPieceIndex = null;
    }

    processCompletedLines() {
        const completed = this.board.findCompletedLines();
        const totalLines = completed.rows.length + completed.cols.length;

        if (totalLines > 0) {
            this.streak++;

            // Highlight completed lines
            completed.rows.forEach(r => {
                for (let c = 0; c < 8; c++) this.cellElements[r][c].classList.add('clearing');
            });
            completed.cols.forEach(c => {
                for (let r = 0; r < 8; r++) this.cellElements[r][c].classList.add('clearing');
            });

            // Play combo sound based on line count & streak
            if (totalLines === 1 && this.streak === 1) {
                window.audioManager.play('clear_single', 1.0);
            } else if (totalLines >= 3 || this.streak >= 3) {
                window.audioManager.play('clear_super', 1.0);
            } else {
                window.audioManager.play('clear_combo', 1.0);
            }

            setTimeout(() => {
                const clearedList = this.board.clearLines(completed);

                // Spawn particle blasts for each cleared cell
                clearedList.forEach(item => {
                    const cellRect = this.cellElements[item.r][item.c].getBoundingClientRect();
                    const containerRect = this.particlesContainer.getBoundingClientRect();
                    const x = cellRect.left - containerRect.left + cellRect.width / 2;
                    const y = cellRect.top - containerRect.top + cellRect.height / 2;
                    this.particles.createBlast(x, y, '#38BDF8');
                });

                // Calculate score: base lines points * streak multiplier
                const basePoints = [0, 100, 300, 600, 1000, 1500, 2100, 2800][Math.min(totalLines, 7)];
                const streakMultiplier = Math.max(1, this.streak);
                const awarded = basePoints * streakMultiplier;
                this.updateScore(awarded);

                // Show combo banner popup
                const boardRect = this.boardEl.getBoundingClientRect();
                const containerRect = this.particlesContainer.getBoundingClientRect();
                const popupX = boardRect.left - containerRect.left + boardRect.width / 2;
                const popupY = boardRect.top - containerRect.top + boardRect.height / 2;

                if (this.streak > 1 || totalLines > 1) {
                    const text = this.streak > 2 ? `COMBO x${this.streak}!` : 'WOW!';
                    this.particles.showPopup(text, popupX, popupY - 40, true);
                }
                this.particles.showPopup(`+${awarded}`, popupX, popupY + 20, false);

                this.renderBoard();
                this.checkGameOver();
            }, 200);
        } else {
            this.streak = 0;
        }
    }

    checkGameOver() {
        const canMove = this.board.hasAnyMove(this.availablePieces);
        if (!canMove && this.availablePieces.some(p => p !== null)) {
            setTimeout(() => {
                window.audioManager.play('game_over', 1.0);
                if (this.finalScoreEl) this.finalScoreEl.innerText = this.score;
                if (this.finalBestEl) this.finalBestEl.innerText = this.bestScore;
                if (this.gameOverModal) this.gameOverModal.classList.add('active');
            }, 500);
        }
    }

    bindEvents() {
        // Restart button
        const restartBtn = document.getElementById('btn-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                window.audioManager.play('button');
                this.startNewGame();
            });
        }

        // Play Again button on Game Over modal
        const playAgainBtn = document.getElementById('btn-play-again');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                window.audioManager.play('button');
                this.startNewGame();
            });
        }

        // Mute toggle
        const muteBtn = document.getElementById('btn-mute');
        if (muteBtn) {
            const updateMuteIcon = () => {
                muteBtn.classList.toggle('muted', window.audioManager.muted);
            };
            updateMuteIcon();
            muteBtn.addEventListener('click', () => {
                window.audioManager.toggleMute();
                updateMuteIcon();
            });
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new BlockyGame();
});

