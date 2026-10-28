/**
 * =========================================================================
 * CIEL WEBGAMES - GOOGLE ADSENSE H5 GAMES ADS & PLACEMENT API BRIDGE
 * =========================================================================
 * Manages Google H5 Game Ads (adBreak) for CIEL WebGames.
 * - Test Ads: Supported natively via Google Ad Placement API (data-adbreak-test="on")
 * - Smart Audio Mute/Resume: Automatically silences CreateJS sounds during ads
 * - Graceful Fallback Modal: Ensures local testing and ad-blockers never freeze gameplay
 * =========================================================================
 */

(function(window) {
  'use strict';

  // Initialize Google AdSense H5 queue
  window.adsbygoogle = window.adsbygoogle || [];
  window.adBreak = window.adConfig = function(o) { window.adsbygoogle.push(o); };

  const CielAds = {
    config: {
      testMode: true,
      googlePublisherId: 'ca-pub-0000000000000000',
      interstitialDuration: 3, // seconds for test fallback modal
      rewardedDuration: 4,     // seconds for test fallback modal
      brandingTitle: 'CIEL WebGames'
    },

    isAdActive: false,
    _activeTimer: null,
    _modalEl: null,

    init: function() {
      this._injectModalStyles();
      this._createModalDOM();
      console.log('[CIEL Ads] Initialized Google H5 Games Ads Bridge (Test Mode:', this.config.testMode, ')');
    },

    /**
     * Mute game sounds during ad playback
     */
    muteAudio: function() {
      try {
        if (typeof createjs !== 'undefined' && createjs.Sound) {
          createjs.Sound.setMute(true);
        }
      } catch (e) {
        console.warn('[CIEL Ads] Error muting sound:', e);
      }
    },

    /**
     * Resume game sounds after ad playback
     */
    unmuteAudio: function() {
      try {
        if (typeof createjs !== 'undefined' && createjs.Sound) {
          createjs.Sound.setMute(false);
        }
      } catch (e) {
        console.warn('[CIEL Ads] Error unmuting sound:', e);
      }
    },

    /**
     * Preroll Ad on game launch
     */
    showPreroll: function(callback) {
      const self = this;
      let handled = false;
      const done = function() {
        if (!handled) {
          handled = true;
          self.unmuteAudio();
          if (typeof callback === 'function') callback();
        }
      };

      // Only attempt preroll if real Google AdSense placement API is loaded and active
      const isGoogleAdReady = typeof window.adBreak === 'function' &&
                              window.adBreak !== window.adConfig &&
                              !this._isAdBlocked();

      if (isGoogleAdReady) {
        try {
          let adStarted = false;
          window.adBreak({
            type: 'start',
            name: 'game_start',
            beforeAd: function() {
              adStarted = true;
              self.muteAudio();
            },
            afterAd: function() {
              self.unmuteAudio();
            },
            adBreakDone: function() {
              done();
            }
          });
          // Safety timeout: if Google has no preroll to show, proceed immediately
          setTimeout(function() {
            if (!adStarted) done();
          }, 250);
          return;
        } catch (e) {
          console.warn('[CIEL Ads] adBreak start error:', e);
        }
      }

      // If Google Ads is not ready, in queue shim, or blocked, launch game immediately
      done();
    },

    /**
     * Interstitial Ad (Level complete, transitions)
     */
    showInterstitial: function(placement, callback) {
      placement = placement || 'next_level';
      const self = this;
      let handled = false;
      const done = function() {
        if (!handled) {
          handled = true;
          self.unmuteAudio();
          if (typeof callback === 'function') callback();
        }
      };

      self.muteAudio();

      if (typeof window.adBreak === 'function' && !this._isAdBlocked()) {
        try {
          window.adBreak({
            type: 'next',
            name: placement,
            beforeAd: function() { self.muteAudio(); },
            afterAd: function() { self.unmuteAudio(); },
            adBreakDone: function() { done(); }
          });
          // Fallback timeout in case adBreak stays pending
          setTimeout(function() {
            if (!handled && !self.isAdActive) {
              self._showTestModal(false, placement, done);
            }
          }, 800);
          return;
        } catch (e) {
          console.warn('[CIEL Ads] adBreak next error:', e);
        }
      }

      this._showTestModal(false, placement, done);
    },

    /**
     * Rewarded Ad (Revive, Skip level, Undo strokes)
     */
    showRewarded: function(placement, callback) {
      placement = placement || 'rewarded_bonus';
      const self = this;
      let handled = false;
      let rewarded = false;

      const finish = function(success) {
        if (!handled) {
          handled = true;
          self.unmuteAudio();
          if (typeof callback === 'function') callback(success);
        }
      };

      self.muteAudio();

      if (typeof window.adBreak === 'function' && !this._isAdBlocked()) {
        try {
          window.adBreak({
            type: 'reward',
            name: placement,
            beforeAd: function() { self.muteAudio(); },
            afterAd: function() { self.unmuteAudio(); },
            beforeReward: function(showAdFn) {
              self.isAdActive = true;
              showAdFn();
            },
            adViewed: function() {
              rewarded = true;
              self.isAdActive = false;
              finish(true);
            },
            adDismissed: function() {
              self.isAdActive = false;
              finish(false);
            },
            adBreakDone: function() {
              self.isAdActive = false;
              if (!handled) finish(rewarded);
            }
          });

          // If adBreak fails to trigger within 800ms, fallback to test modal
          setTimeout(function() {
            if (!handled && !self.isAdActive) {
              self._showTestModal(true, placement, finish);
            }
          }, 800);
          return;
        } catch (e) {
          console.warn('[CIEL Ads] adBreak reward error:', e);
        }
      }

      this._showTestModal(true, placement, finish);
    },

    _isAdBlocked: function() {
      return typeof window.adsbygoogle === 'undefined' || !window.adsbygoogle.loaded;
    },

    /**
     * Interactive Test Ad Modal with CIEL Games branding
     */
    _showTestModal: function(isRewarded, placement, callback) {
      const self = this;
      self.isAdActive = true;
      self.muteAudio();

      if (!self._modalEl) self._createModalDOM();

      const modal = self._modalEl;
      const typeBadge = modal.querySelector('#ciel-ad-type');
      const placementText = modal.querySelector('#ciel-ad-placement');
      const timerText = modal.querySelector('#ciel-ad-timer');
      const actionBtn = modal.querySelector('#ciel-ad-btn');

      typeBadge.textContent = isRewarded ? '🎁 REWARDED TEST AD' : '📢 INTERSTITIAL TEST AD';
      placementText.textContent = 'Placement: ' + placement;
      
      let secondsLeft = isRewarded ? self.config.rewardedDuration : self.config.interstitialDuration;
      timerText.textContent = 'Ad playing: ' + secondsLeft + 's';
      actionBtn.style.display = 'none';

      modal.style.display = 'flex';

      if (self._activeTimer) clearInterval(self._activeTimer);

      self._activeTimer = setInterval(function() {
        secondsLeft--;
        if (secondsLeft > 0) {
          timerText.textContent = 'Ad playing: ' + secondsLeft + 's';
        } else {
          clearInterval(self._activeTimer);
          self._activeTimer = null;
          timerText.textContent = isRewarded ? 'Reward Ready!' : 'Ad Finished';
          actionBtn.style.display = 'inline-block';
          actionBtn.textContent = isRewarded ? 'Claim Reward & Continue' : 'Continue to Game';
        }
      }, 1000);

      actionBtn.onclick = function() {
        modal.style.display = 'none';
        self.isAdActive = false;
        self.unmuteAudio();
        if (callback) callback(isRewarded ? true : undefined);
      };
    },

    _createModalDOM: function() {
      if (document.getElementById('ciel-ad-modal')) {
        this._modalEl = document.getElementById('ciel-ad-modal');
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'ciel-ad-modal';
      modal.className = 'ciel-ad-overlay';
      modal.innerHTML = `
        <div class="ciel-ad-card">
          <div class="ciel-ad-header">
            <span class="ciel-ad-logo">🎮 CIEL WebGames</span>
            <span class="ciel-ad-tag" id="ciel-ad-type">SPONSORED TEST AD</span>
          </div>
          <div class="ciel-ad-body">
            <div class="ciel-ad-art">
              <div class="ciel-ad-icon-holder">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#FF6E00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3>Google AdSense H5 Games Ads</h3>
              <p id="ciel-ad-placement">Placement: default</p>
              <div class="ciel-ad-status" id="ciel-ad-timer">Loading Test Ad...</div>
            </div>
          </div>
          <div class="ciel-ad-footer">
            <button id="ciel-ad-btn" class="ciel-ad-button">Claim Reward & Continue</button>
            <div class="ciel-ad-brand-note">Powered by CIEL Tech Ad Placement Bridge</div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      this._modalEl = modal;
    },

    _injectModalStyles: function() {
      if (document.getElementById('ciel-ad-styles')) return;

      const style = document.createElement('style');
      style.id = 'ciel-ad-styles';
      style.textContent = `
        .ciel-ad-overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.88);
          z-index: 9999999;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .ciel-ad-card {
          background: linear-gradient(145deg, #1f232b, #15181e);
          border: 2px solid #FF6E00;
          border-radius: 16px;
          width: 90%;
          max-width: 440px;
          padding: 24px;
          color: #ffffff;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 110, 0, 0.35);
          text-align: center;
          animation: cielAdPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes cielAdPop {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .ciel-ad-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 18px;
        }
        .ciel-ad-logo {
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.5px;
          color: #FF8908;
          text-transform: uppercase;
        }
        .ciel-ad-tag {
          font-size: 10px;
          font-weight: 700;
          background: rgba(255, 110, 0, 0.18);
          color: #FFA726;
          border: 1px solid rgba(255, 110, 0, 0.4);
          padding: 3px 8px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }
        .ciel-ad-art h3 {
          font-size: 19px;
          margin: 12px 0 6px;
          color: #ffffff;
          font-weight: 700;
        }
        .ciel-ad-art p {
          font-size: 12px;
          color: #94a3b8;
          margin: 0 0 16px;
        }
        .ciel-ad-icon-holder {
          display: inline-flex;
          padding: 16px;
          border-radius: 50%;
          background: rgba(255, 110, 0, 0.1);
          margin-bottom: 8px;
        }
        .ciel-ad-status {
          font-size: 15px;
          font-weight: 600;
          color: #FFB74D;
          background: rgba(0, 0, 0, 0.3);
          padding: 8px 16px;
          border-radius: 8px;
          display: inline-block;
          margin-bottom: 18px;
        }
        .ciel-ad-button {
          background: linear-gradient(135deg, #FF6E00, #E65100);
          color: #ffffff;
          border: none;
          padding: 12px 28px;
          border-radius: 25px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(255, 110, 0, 0.45);
        }
        .ciel-ad-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 110, 0, 0.65);
        }
        .ciel-ad-brand-note {
          font-size: 11px;
          color: #64748b;
          margin-top: 14px;
        }
      `;
      document.head.appendChild(style);
    }
  };

  window.CielAds = CielAds;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { CielAds.init(); });
  } else {
    CielAds.init();
  }
})(window);

