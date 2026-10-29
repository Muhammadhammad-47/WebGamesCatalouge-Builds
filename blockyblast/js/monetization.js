class MonetizationManager {
    constructor(game) {
        this.game = game;
        this.adModal = document.getElementById('ad-modal');
        this.adTitle = document.getElementById('ad-modal-title');
        this.adTimerEl = document.getElementById('ad-timer-countdown');
        this.adProgressBar = document.getElementById('ad-progress-bar');
        this.adRewardDesc = document.getElementById('ad-reward-desc');
        this.adCloseBtn = document.getElementById('btn-close-ad');

        this.isWatching = false;
        this.currentRewardCallback = null;
        this.timer = null;

        this.bindEvents();
    }

    bindEvents() {
        if (this.adCloseBtn) {
            this.adCloseBtn.addEventListener('click', () => {
                this.closeAd(false);
            });
        }
    }

    showRewardAd(rewardType, rewardTitle, rewardDesc, onRewardGranted) {
        if (this.isWatching) return;
        this.isWatching = true;
        this.currentRewardCallback = onRewardGranted;

        if (this.adTitle) this.adTitle.innerText = rewardTitle || 'SPONSORED REWARD';
        if (this.adRewardDesc) this.adRewardDesc.innerText = rewardDesc || 'Watch this short clip to claim your reward';
        if (this.adModal) this.adModal.classList.add('active');
        if (this.adCloseBtn) this.adCloseBtn.style.display = 'none';

        // Notify CIEL portal parent window if embedded
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'CIEL_REWARDED_AD_START',
                    rewardType: rewardType
                }, '*');
            }
        } catch (e) {}

        let secondsRemaining = 5;
        if (this.adTimerEl) this.adTimerEl.innerText = `${secondsRemaining}s`;
        if (this.adProgressBar) this.adProgressBar.style.width = '0%';

        const totalTime = secondsRemaining;
        const startTime = Date.now();

        clearInterval(this.timer);
        this.timer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const remaining = Math.max(0, Math.ceil(totalTime - elapsed));
            const progress = Math.min(100, (elapsed / totalTime) * 100);

            if (this.adTimerEl) this.adTimerEl.innerText = `${remaining}s`;
            if (this.adProgressBar) this.adProgressBar.style.width = `${progress}%`;

            if (remaining <= 0) {
                clearInterval(this.timer);
                if (this.adTimerEl) this.adTimerEl.innerText = 'CLAIM!';
                if (this.adCloseBtn) {
                    this.adCloseBtn.style.display = 'block';
                    this.adCloseBtn.innerText = 'Claim Reward';
                }
                setTimeout(() => {
                    this.closeAd(true);
                }, 400);
            }
        }, 100);
    }

    closeAd(rewardClaimed = false) {
        clearInterval(this.timer);
        this.isWatching = false;

        if (this.adModal) {
            this.adModal.classList.remove('active');
        }

        if (rewardClaimed && typeof this.currentRewardCallback === 'function') {
            const cb = this.currentRewardCallback;
            this.currentRewardCallback = null;
            cb();

            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        type: 'CIEL_REWARDED_AD_COMPLETE',
                        rewardGranted: true
                    }, '*');
                }
            } catch (e) {}
        }
    }
}

