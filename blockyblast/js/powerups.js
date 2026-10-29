class PowerupManager {
    constructor(game) {
        this.game = game;
        this.activeMode = null; // 'hammer' | 'bomb' | 'rotate' | null

        // Counts persisted in localStorage
        this.counts = {
            hammer: parseInt(localStorage.getItem('blocky_powerup_hammer') || '3', 10),
            bomb: parseInt(localStorage.getItem('blocky_powerup_bomb') || '2', 10),
            refresh: parseInt(localStorage.getItem('blocky_powerup_refresh') || '3', 10),
            rotate: parseInt(localStorage.getItem('blocky_powerup_rotate') || '4', 10)
        };

        // DOM elements
        this.btnHammer = document.getElementById('powerup-hammer');
        this.btnBomb = document.getElementById('powerup-bomb');
        this.btnRefresh = document.getElementById('powerup-refresh');
        this.btnRotate = document.getElementById('powerup-rotate');

        this.badgeHammer = document.getElementById('count-hammer');
        this.badgeBomb = document.getElementById('count-bomb');
        this.badgeRefresh = document.getElementById('count-refresh');
        this.badgeRotate = document.getElementById('count-rotate');

        this.bannerEl = document.getElementById('powerup-mode-banner');
        this.bannerText = document.getElementById('powerup-mode-text');
        this.bannerCancel = document.getElementById('powerup-mode-cancel');

        this.bindEvents();
        this.updateBadges();
    }

    bindEvents() {
        if (this.btnHammer) {
            this.btnHammer.addEventListener('click', () => this.handlePowerupClick('hammer'));
        }
        if (this.btnBomb) {
            this.btnBomb.addEventListener('click', () => this.handlePowerupClick('bomb'));
        }
        if (this.btnRefresh) {
            this.btnRefresh.addEventListener('click', () => this.handlePowerupClick('refresh'));
        }
        if (this.btnRotate) {
            this.btnRotate.addEventListener('click', () => this.handlePowerupClick('rotate'));
        }

        if (this.bannerCancel) {
            this.bannerCancel.addEventListener('click', () => this.cancelActiveMode());
        }
    }

    updateBadges() {
        const updateSingleBadge = (badgeEl, count) => {
            if (!badgeEl) return;
            if (count > 0) {
                badgeEl.innerText = count;
                badgeEl.classList.remove('badge-ad');
            } else {
                badgeEl.innerHTML = `
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                `;
                badgeEl.classList.add('badge-ad');
            }
        };

        updateSingleBadge(this.badgeHammer, this.counts.hammer);
        updateSingleBadge(this.badgeBomb, this.counts.bomb);
        updateSingleBadge(this.badgeRefresh, this.counts.refresh);
        updateSingleBadge(this.badgeRotate, this.counts.rotate);

        localStorage.setItem('blocky_powerup_hammer', this.counts.hammer);
        localStorage.setItem('blocky_powerup_bomb', this.counts.bomb);
        localStorage.setItem('blocky_powerup_refresh', this.counts.refresh);
        localStorage.setItem('blocky_powerup_rotate', this.counts.rotate);
    }

    handlePowerupClick(type) {
        window.audioManager.play('button', 0.8);

        // If count is 0, trigger rewarded ad flow to refill!
        if (this.counts[type] <= 0) {
            const titles = {
                hammer: 'GET +2 HAMMERS',
                bomb: 'GET +2 BOMBS',
                refresh: 'GET +3 SHUFFLES',
                rotate: 'GET +4 ROTATES'
            };
            const descs = {
                hammer: 'Smash and obliterate any single stubborn block instantly!',
                bomb: 'Detonate a 3x3 massive blast to clear clustered blocks!',
                refresh: 'Exchange all 3 current pieces with a fresh new set!',
                rotate: 'Spin pieces 90° clockwise for the perfect fit!'
            };
            const adds = { hammer: 2, bomb: 2, refresh: 3, rotate: 4 };

            this.game.monetization.showRewardAd(
                `powerup_${type}`,
                titles[type],
                descs[type],
                () => {
                    this.counts[type] += adds[type];
                    this.updateBadges();
                    window.audioManager.play('win', 1.0);
                    this.showPowerupBanner(`+${adds[type]} ${type.toUpperCase()} ADDED!`);
                    setTimeout(() => this.hidePowerupBanner(), 1500);
                }
            );
            return;
        }

        // Active mode toggle
        if (this.activeMode === type) {
            this.cancelActiveMode();
            return;
        }

        // Handle instant vs targeted powerups
        if (type === 'refresh') {
            this.useRefresh();
        } else if (type === 'rotate') {
            this.enterRotateMode();
        } else if (type === 'hammer') {
            this.enterHammerMode();
        } else if (type === 'bomb') {
            this.enterBombMode();
        }
    }

    showPowerupBanner(text) {
        if (this.bannerEl && this.bannerText) {
            this.bannerText.innerText = text;
            this.bannerEl.classList.add('active');
        }
    }

    hidePowerupBanner() {
        if (this.bannerEl) {
            this.bannerEl.classList.remove('active');
        }
    }

    cancelActiveMode() {
        this.activeMode = null;
        this.hidePowerupBanner();
        this.clearBoardModeHighlights();
        this.clearDockModeHighlights();
        this.updateButtonsUI();
    }

    updateButtonsUI() {
        [this.btnHammer, this.btnBomb, this.btnRefresh, this.btnRotate].forEach(btn => {
            if (btn) btn.classList.remove('active-powerup');
        });

        if (this.activeMode === 'hammer' && this.btnHammer) this.btnHammer.classList.add('active-powerup');
        if (this.activeMode === 'bomb' && this.btnBomb) this.btnBomb.classList.add('active-powerup');
        if (this.activeMode === 'rotate' && this.btnRotate) this.btnRotate.classList.add('active-powerup');
    }

    clearBoardModeHighlights() {
        document.querySelectorAll('.board-cell').forEach(cell => {
            cell.classList.remove('powerup-targetable', 'powerup-hover-bomb', 'powerup-hover-hammer');
        });
    }

    clearDockModeHighlights() {
        document.querySelectorAll('.dock-slot').forEach(slot => {
            slot.classList.remove('powerup-rotatable');
        });
    }

    // --- 1. REFRESH / SHUFFLE ---
    useRefresh() {
        if (this.counts.refresh <= 0) return;
        this.counts.refresh--;
        this.updateBadges();

        window.audioManager.play('powerup', 1.0);
        this.game.spawnDockPieces();

        const rect = this.game.dockEl.getBoundingClientRect();
        const cRect = this.game.particlesContainer.getBoundingClientRect();
        this.game.particles.showPopup('SHUFFLED!', rect.left - cRect.left + rect.width / 2, rect.top - cRect.top, true);
    }

    // --- 2. ROTATE ---
    enterRotateMode() {
        this.activeMode = 'rotate';
        this.updateButtonsUI();
        this.showPowerupBanner('TAP ANY DOCK PIECE TO ROTATE');

        document.querySelectorAll('.dock-slot').forEach(slot => {
            const index = parseInt(slot.dataset.index, 10);
            if (this.game.availablePieces[index]) {
                slot.classList.add('powerup-rotatable');
            }
        });
    }

    executeRotate(index) {
        if (this.activeMode !== 'rotate') return false;
        const piece = this.game.availablePieces[index];
        if (!piece) return false;

        this.counts.rotate--;
        this.updateBadges();

        // Rotate piece shape clockwise
        piece.shape = rotateShapeClockwise(piece.shape);
        window.audioManager.play('whoosh', 0.9);

        this.game.renderDock();
        this.cancelActiveMode();

        // Check if rotated piece opens new moves or ends game
        this.game.checkGameOver();
        return true;
    }

    // --- 3. HAMMER ---
    enterHammerMode() {
        this.activeMode = 'hammer';
        this.updateButtonsUI();
        this.showPowerupBanner('TAP ANY BLOCK TO SMASH');

        document.querySelectorAll('.board-cell.filled').forEach(cell => {
            cell.classList.add('powerup-targetable');
        });
    }

    executeHammer(r, c) {
        if (this.activeMode !== 'hammer') return false;
        const cleared = this.game.board.clearCell(r, c);
        if (!cleared) return false;

        this.counts.hammer--;
        this.updateBadges();

        window.audioManager.play('place_heavy', 1.0);

        const cell = this.game.cellElements[r][c];
        const rect = cell.getBoundingClientRect();
        const cRect = this.game.particlesContainer.getBoundingClientRect();
        const x = rect.left - cRect.left + rect.width / 2;
        const y = rect.top - cRect.top + rect.height / 2;

        this.game.particles.createBlast(x, y, '#E11D48');
        this.game.particles.showPopup('SMASHED!', x, y - 20, true);

        this.game.updateScore(30);
        this.game.renderBoard();
        this.cancelActiveMode();

        this.game.checkGameOver();
        return true;
    }

    // --- 4. BOMB ---
    enterBombMode() {
        this.activeMode = 'bomb';
        this.updateButtonsUI();
        this.showPowerupBanner('TAP ANY CELL FOR 3X3 BLAST');

        document.querySelectorAll('.board-cell').forEach(cell => {
            cell.classList.add('powerup-targetable');
        });
    }

    executeBomb(r, c) {
        if (this.activeMode !== 'bomb') return false;
        const cleared = this.game.board.clearArea(r, c, 1);
        if (cleared.length === 0) {
            // Even if empty, detonate to satisfy player
        }

        this.counts.bomb--;
        this.updateBadges();

        window.audioManager.play('powerup', 1.0);
        setTimeout(() => window.audioManager.play('clear_super', 1.0), 100);

        const cell = this.game.cellElements[r][c];
        const rect = cell.getBoundingClientRect();
        const cRect = this.game.particlesContainer.getBoundingClientRect();
        const x = rect.left - cRect.left + rect.width / 2;
        const y = rect.top - cRect.top + rect.height / 2;

        cleared.forEach(item => {
            const itemCell = this.game.cellElements[item.r][item.c];
            const itemRect = itemCell.getBoundingClientRect();
            const bx = itemRect.left - cRect.left + itemRect.width / 2;
            const by = itemRect.top - cRect.top + itemRect.height / 2;
            this.game.particles.createBlast(bx, by, '#F59E0B');
        });

        this.game.particles.showPopup('BOOM! 3x3', x, y - 30, true);
        const pts = Math.max(100, cleared.length * 35);
        this.game.updateScore(pts);

        this.game.renderBoard();
        this.cancelActiveMode();

        this.game.checkGameOver();
        return true;
    }
}

