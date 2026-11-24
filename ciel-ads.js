/*!
 * CIEL Ads SDK v1.0  (one file for every CIEL web game: HTML5 and Unity WebGL)
 *
 * Wraps Google H5 Games Ads (the Ad Placement API: adBreak / adConfig) and adds what a
 * game needs around it:
 *   - every call returns a Promise that ALWAYS settles (no fill, ad blocker, timeout, error)
 *   - the game is paused and muted only while an ad is really on screen
 *   - interstitial frequency limits on our side (Google applies its own as well)
 *   - a built-in "simulated ad" so ads can be tested on localhost without an AdSense account
 *   - events for the game and for the CIEL portal (parent window)
 *
 * Include it in <head> or before your game script:
 *   <script src="ciel-ads.js" data-client="ca-pub-XXXXXXXXXXXXXXXX"></script>
 *
 * Use it in the game:
 *   CielAds.showInterstitial();                                // interstitial ad
 *   CielAds.showRewarded(function () { ...give reward... });   // rewarded ad, reward in the callback
 *
 * Script tag options (all optional):
 *   data-client       AdSense publisher id (ca-pub-...). Without it, live pages run with ads off.
 *   data-mode         auto (default) | google | google-test | simulate | off
 *                       auto        = simulate on localhost/file://, google on a real domain
 *                       google-test = real Google flow with Google's test ads (data-adbreak-test)
 *   data-gap          minimum seconds between interstitials (default 60)
 *   data-first-delay  no interstitial during the first N seconds of a session (default 30)
 *   data-timeout      ms to wait for Google to answer before giving up (default 8000)
 *   data-debug        "on" to log every step to the console
 * Any page can force a mode with ?ads=simulate | google | google-test | off in the URL.
 */
(function (window, document) {
  'use strict';
  if (window.CielAds) return;

  var script = document.currentScript || {};
  var ds = script.dataset || {};
  var num = function (v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; };
  var clean = function (v) { return (v || '').trim().replace(/^\{\{\{.*\}\}\}$/, ''); }; // ignore unfilled Unity template vars

  var cfg = {
    client: clean(ds.client),
    mode: clean(ds.mode).toLowerCase() || 'auto',
    gap: num(ds.gap, 60),
    firstDelay: num(ds.firstDelay, 30),
    timeout: num(ds.timeout, 8000),
    debug: ds.debug === 'on',
  };
  try {
    var q = new URLSearchParams(window.location.search).get('ads');
    if (q) cfg.mode = q.toLowerCase();
  } catch (e) { /* old browser */ }

  var isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/.test(window.location.hostname) ||
    window.location.protocol === 'file:';
  if (cfg.mode === 'auto') cfg.mode = isLocal ? 'simulate' : (cfg.client ? 'google' : 'off');
  if ((cfg.mode === 'google' || cfg.mode === 'google-test') && !cfg.client) {
    console.warn('[CielAds] data-client (ca-pub-...) is missing, so ads are off.');
    cfg.mode = 'off';
  }

  var log = function () { if (cfg.debug) console.log.apply(console, ['[CielAds]'].concat([].slice.call(arguments))); };
  var startedAt = Date.now();
  var lastInterstitial = 0;
  var busy = false;
  var blocked = false;
  var listeners = {};
  var hooks = { pause: [], resume: [], mute: [], unmute: [] };

  // ------------------------------------------------------------------ events
  function emit(type, placement, extra) {
    var detail = { type: type, placement: placement || '' };
    if (extra) for (var k in extra) detail[k] = extra[k];
    log('event', type, detail);
    (listeners[type] || []).slice().forEach(function (fn) { try { fn(detail); } catch (e) { console.error(e); } });
    try { window.dispatchEvent(new CustomEvent('cielads:' + type, { detail: detail })); } catch (e) {}
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ source: 'ciel-ads', event: type, detail: detail }, '*'); } catch (e) {}
  }

  // ---------------------------------------------- pause / mute the game
  function callHooks(list) { list.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); }
  function defaultMute(on) {
    try { if (window.Howler) window.Howler.mute(on); } catch (e) {}
    try { if (window.createjs && window.createjs.Sound) window.createjs.Sound.muted = on; } catch (e) {}
  }
  var paused = false;
  function pauseGame(placement) {
    if (paused) return;
    paused = true;
    defaultMute(true); callHooks(hooks.mute); callHooks(hooks.pause);
    emit('adStart', placement);
  }
  function resumeGame(placement) {
    if (!paused) return;
    paused = false;
    defaultMute(false); callHooks(hooks.unmute); callHooks(hooks.resume);
    emit('adEnd', placement);
  }

  // ---------------------------------------------------------- Google H5
  var googleReady = false;
  function loadGoogle() {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(cfg.client);
    s.setAttribute('data-ad-client', cfg.client);
    s.setAttribute('data-ad-frequency-hint', Math.max(30, cfg.gap) + 's');
    if (cfg.mode === 'google-test') s.setAttribute('data-adbreak-test', 'on');
    s.onerror = function () { blocked = true; emit('blocked'); console.warn('[CielAds] Ad script blocked (ad blocker or offline). Ads are skipped.'); };
    (document.head || document.documentElement).appendChild(s);
    window.adConfig({
      preloadAdBreaks: 'on',
      sound: 'on',
      onReady: function () { googleReady = true; emit('ready'); },
    });
  }

  // Runs one ad break. Resolves exactly once with { shown, rewarded, status, placement }.
  function runBreak(kind, placement, options) {
    return new Promise(function (resolve) {
      var settled = false, started = false, watchdog;
      var result = { kind: kind, placement: placement, shown: false, rewarded: false, status: 'unknown' };
      function finish(status) {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        result.status = status;
        resumeGame(placement);
        busy = false;
        if (kind === 'interstitial' && result.shown) lastInterstitial = Date.now();
        emit('adResult', placement, result);
        if (result.rewarded) emit('reward', placement);
        log('result', result);
        resolve(result);
      }
      function skip(status) { result.status = status; emit('adResult', placement, result); resolve(result); }

      if (busy) return skip('busy');
      if (cfg.mode === 'off') return skip('disabled');
      if (blocked) return skip('blocked');
      if (kind === 'interstitial') {
        var now = Date.now();
        if (now - startedAt < cfg.firstDelay * 1000) return skip('tooEarly');
        if (lastInterstitial && now - lastInterstitial < cfg.gap * 1000) return skip('frequencyCapped');
      }
      busy = true;
      emit('adRequest', placement, { kind: kind });

      var onStart = function () { started = true; clearTimeout(watchdog); result.shown = true; pauseGame(placement); };
      // If the ad network never answers (blocked, slow, broken), do not hang the game.
      watchdog = setTimeout(function () { if (!started) finish('timeout'); }, cfg.timeout);

      if (cfg.mode === 'simulate') return simulate(kind, placement, onStart, function (rewarded, status) {
        result.rewarded = !!rewarded; finish(status);
      });

      var req = {
        name: placement,
        adBreakDone: function (info) {
          var st = (info && info.breakStatus) || 'other';
          if (st === 'viewed') result.shown = true;
          finish(st);
        },
      };
      if (kind === 'preroll') {
        req.type = 'preroll';
      } else {
        req.type = kind === 'rewarded' ? 'reward' : ((options && options.type) || 'next');
        req.beforeAd = onStart;
        req.afterAd = function () { resumeGame(placement); };
      }
      if (kind === 'rewarded') {
        req.beforeReward = function (showAdFn) { showAdFn(); };
        req.adViewed = function () { result.rewarded = true; };
        req.adDismissed = function () { result.rewarded = false; };
      }
      try { window.adBreak(req); } catch (e) { console.warn('[CielAds] adBreak failed:', e); finish('error'); }
    });
  }

  // ------------------------------------------------- simulated test ads
  var simCss = '#cielads-sim{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;background:rgba(20,10,40,.82);font:600 16px/1.4 system-ui,sans-serif;color:#fff}' +
    '#cielads-sim .box{width:min(340px,88vw);background:#2b1a55;border-radius:18px;padding:22px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.5)}' +
    '#cielads-sim .tag{display:inline-block;font-size:11px;letter-spacing:2px;background:#ffc94d;color:#3a2500;border-radius:6px;padding:2px 8px;margin-bottom:10px}' +
    '#cielads-sim h3{margin:0 0 6px;font-size:20px}#cielads-sim p{margin:0 0 16px;opacity:.8;font-weight:500}' +
    '#cielads-sim .bar{height:6px;border-radius:9px;background:rgba(255,255,255,.15);overflow:hidden;margin-bottom:16px}#cielads-sim .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4fa8ea,#8a5cf6);transition:width .2s linear}' +
    '#cielads-sim button{font:inherit;border:0;border-radius:12px;padding:10px 18px;margin:0 4px;cursor:pointer;background:#fff;color:#2b1a55}#cielads-sim button.ghost{background:transparent;color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.35)}#cielads-sim button[disabled]{opacity:.45;cursor:default}';
  function simulate(kind, placement, onStart, done) {
    var secs = kind === 'rewarded' ? 5 : 3;
    if (!document.getElementById('cielads-sim-css')) {
      var st = document.createElement('style'); st.id = 'cielads-sim-css'; st.textContent = simCss; document.head.appendChild(st);
    }
    var el = document.createElement('div');
    el.id = 'cielads-sim';
    el.innerHTML = '<div class="box"><span class="tag">TEST AD</span><h3>' +
      (kind === 'rewarded' ? 'Rewarded ad' : kind === 'preroll' ? 'Pre-roll ad' : 'Interstitial ad') +
      '</h3><p>Placement: <b></b><br>Real ads replace this on your live site.</p><div class="bar"><i></i></div>' +
      '<button class="ghost" data-act="close">Close</button><button data-act="ok" disabled>Wait…</button></div>';
    el.querySelector('b').textContent = placement;
    setTimeout(function () {
      document.body.appendChild(el);
      onStart();
      var t0 = Date.now(), ok = el.querySelector('[data-act=ok]'), bar = el.querySelector('.bar i');
      var iv = setInterval(function () {
        var left = Math.max(0, secs - (Date.now() - t0) / 1000);
        bar.style.width = (100 - left / secs * 100) + '%';
        ok.textContent = left > 0 ? 'Wait ' + Math.ceil(left) + 's' : (kind === 'rewarded' ? 'Claim reward' : 'Continue');
        if (left <= 0) { ok.disabled = false; clearInterval(iv); }
      }, 100);
      el.addEventListener('click', function (e) {
        var act = e.target.getAttribute && e.target.getAttribute('data-act');
        if (!act || (act === 'ok' && ok.disabled)) return;
        clearInterval(iv); el.remove();
        done(kind === 'rewarded' && act === 'ok', act === 'ok' ? 'viewed' : 'dismissed');
      });
    }, 250);
  }

  // ---------------------------------------------------------- public API
  // Runs a game callback without letting an error in game code break the SDK.
  function safeCall(fn, arg) {
    if (typeof fn !== 'function') return;
    try { fn(arg); } catch (e) { console.error('[CielAds] Error in your ad callback:', e); }
  }

  var api = {
    version: '1.0.0',
    get mode() { return cfg.mode; },
    get isBusy() { return busy; },
    get isBlocked() { return blocked; },
    get isReady() { return cfg.mode === 'simulate' || googleReady; },
    config: cfg,

    // ---- Simple API (use these in games) ----

    /**
     * Interstitial ad. onDone runs after the ad (or straight away if no ad is shown).
     *   CielAds.showInterstitial(function () { nextLevel(); });
     */
    showInterstitial: function (onDone, placement) {
      return api.interstitial(placement).then(function (r) { safeCall(onDone, r); return r; });
    },

    /**
     * Rewarded ad. onReward runs ONLY when the player watched the whole ad: give the reward there.
     * onNoReward (optional) runs when the ad was closed early or no ad was available.
     *   CielAds.showRewarded(function () { coins += 100; });
     */
    showRewarded: function (onReward, onNoReward, placement) {
      return api.rewarded(placement).then(function (r) {
        safeCall(r.rewarded ? onReward : onNoReward, r);
        return r;
      });
    },

    // ---- Promise API (same ads, for async/await code) ----

    /** Full-screen ad between levels / on game over. options.type: next | start | pause | browse */
    interstitial: function (placement, options) { return runBreak('interstitial', placement || 'break', options); },
    /** Rewarded ad. Resolves { rewarded: true } only when the player watched it to the end. */
    rewarded: function (placement) { return runBreak('rewarded', placement || 'reward'); },
    /** Ad before the game starts (call once, before gameplay begins). */
    preroll: function () { return runBreak('preroll', 'preroll'); },

    /** Tell the SDK how to pause / resume / mute / unmute your game. Each is optional. */
    setGameHooks: function (h) {
      ['pause', 'resume', 'mute', 'unmute'].forEach(function (k) { if (h && typeof h[k] === 'function') hooks[k].push(h[k]); });
      return api;
    },
    /** Listen to: ready, blocked, adRequest, adStart, adEnd, adResult, reward */
    on: function (type, fn) { (listeners[type] = listeners[type] || []).push(fn); return api; },
    off: function (type, fn) { listeners[type] = (listeners[type] || []).filter(function (f) { return f !== fn; }); return api; },
  };
  window.CielAds = api;

  if (cfg.mode === 'google' || cfg.mode === 'google-test') loadGoogle();
  log('mode =', cfg.mode, cfg);
})(window, document);
