/*!
 * CIEL Games loading screen (shared by every CIEL web game).
 * Include it as the FIRST element inside <body>:
 *   <script src="ciel-loader.js"></script>
 * Modes (attributes on the script tag):
 *   (none)              finishes after the page has loaded.
 *   data-mode="manual"  waits for CielLoader.done(); feed real progress with CielLoader.progress(0..1).
 *                       Unity: call CielLoader.unity(canvas, config, onProgress) instead of createUnityInstance(...).
 *   data-wait="#sel"    also waits until that element is removed or hidden (a game's own preloader).
 * Defold games (dmloader.js) are detected automatically and follow the engine's real progress.
 * Listen for the end with CielLoader.onDone(fn) or window 'ciel-loader:done'.
 */
(function () {
  'use strict';
  if (window.CielLoader) return;
  var script = document.currentScript || {};
  var ds = script.dataset || {};
  var MANUAL = ds.mode === 'manual';
  var WAIT = ds.wait || '';
  var MIN = 3600, BAR_DELAY = 2200, WAIT_MAX = 30000;
  var CSS = "#ciel-loader{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;font-family:'Fredoka',system-ui,-apple-system,'Segoe UI',sans-serif;--cl-purple:#5e45ad;--cl-violet:#6c3fb2;--cl-blue:#4a90e0;--cl-sky:#4fa8ea;--cl-spring:cubic-bezier(.2,1.5,.4,1);--cl-out:cubic-bezier(.16,1,.3,1);background:radial-gradient(circle at 18% 22%,rgba(79,168,234,.20),transparent 42%),radial-gradient(circle at 82% 78%,rgba(108,63,178,.20),transparent 45%),radial-gradient(circle at 50% 45%,#fff 0%,#f4f0ff 55%,#e6ddff 100%);transition:opacity .7s ease .2s,visibility .7s .2s;-webkit-user-select:none;user-select:none;touch-action:none;}#ciel-loader *{box-sizing:border-box;margin:0;padding:0;}#ciel-loader.cl-done{opacity:0;visibility:hidden;pointer-events:none;}#ciel-loader.cl-done .cl-center{transform:scale(1.12);opacity:0;}#ciel-loader .cl-mesh{position:absolute;inset:-10%;opacity:.5;background-image:linear-gradient(32deg,transparent 49.4%,rgba(94,69,173,.10) 49.6%,rgba(94,69,173,.10) 50.4%,transparent 50.6%),linear-gradient(-32deg,transparent 49.4%,rgba(74,144,224,.10) 49.6%,rgba(74,144,224,.10) 50.4%,transparent 50.6%);background-size:120px 76px;animation:clMesh 24s linear infinite;}@keyframes clMesh{to{transform:translate(120px,76px)}}#ciel-loader .cl-bubble{position:absolute;bottom:-30px;border-radius:50%;background:radial-gradient(circle,rgba(108,63,178,.35),rgba(74,144,224,.12) 60%,transparent 70%);animation:clBubble linear infinite;}@keyframes clBubble{to{transform:translate(var(--dx),-115vh)}}#ciel-loader .cl-center{position:relative;display:flex;flex-direction:column;align-items:center;transition:transform .8s var(--cl-out),opacity .55s ease;}#ciel-loader .cl-brain{display:block;width:clamp(150px,34vmin,290px);height:auto;overflow:visible;filter:drop-shadow(0 14px 28px rgba(94,69,173,.28));}#ciel-loader .cl-f{opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(.2) rotate(-25deg);animation:clFacet .55s var(--cl-spring) forwards;animation-delay:calc(.1s + var(--i) * .028s);}@keyframes clFacet{to{opacity:1;transform:none}}#ciel-loader .cl-ln{fill:none;stroke-dasharray:1;stroke-dashoffset:1;animation:clDraw .5s ease-out forwards;animation-delay:calc(.9s + var(--i) * .012s);}#ciel-loader .cl-nd{opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(0);animation:clPop .45s var(--cl-spring) forwards,clTwinkle 1.8s ease-in-out infinite;animation-delay:calc(1.3s + var(--i) * .06s),calc(2s + var(--i) * .23s);}@keyframes clTwinkle{50%{opacity:.45;transform:scale(1.5)}}@keyframes clDraw{to{stroke-dashoffset:0}}@keyframes clPop{to{opacity:1;transform:scale(1) rotate(0)}}@keyframes clFade{to{opacity:1}}#ciel-loader .cl-word{display:flex;margin-top:2vmin;font-size:clamp(50px,12vmin,104px);font-weight:700;letter-spacing:.07em;line-height:1;}#ciel-loader .cl-word span{display:inline-block;color:var(--cl-purple);background:linear-gradient(180deg,#6a52bd 0%,#55399f 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;opacity:0;transform:translateY(45%) scale(.7);animation:clLetter .75s var(--cl-spring) forwards;animation-delay:calc(1.35s + var(--i) * .08s);}@keyframes clLetter{to{opacity:1;transform:none}}#ciel-loader .cl-sub{font-size:clamp(14px,3vmin,24px);font-weight:700;padding-left:.75em;margin-top:.4vmin;background:linear-gradient(90deg,var(--cl-blue),var(--cl-violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;opacity:0;animation:clSpread 1.1s var(--cl-out) 1.8s forwards;}@keyframes clSpread{from{opacity:0;letter-spacing:.15em}to{opacity:1;letter-spacing:.75em}}#ciel-loader .cl-tag{margin-top:1.2vmin;font-size:clamp(12px,2.2vmin,16px);font-weight:500;color:#8a84a3;letter-spacing:.02em;opacity:0;animation:clFade .6s ease 2.1s forwards;}#ciel-loader .cl-bar{width:clamp(180px,42vmin,320px);height:8px;margin-top:4vmin;border-radius:99px;background:#e2d9fb;overflow:hidden;box-shadow:inset 0 1px 2px rgba(60,30,120,.18);opacity:0;animation:clFade .5s ease 2.2s forwards;}#ciel-loader .cl-bar i{display:block;position:relative;height:100%;width:0;border-radius:inherit;overflow:hidden;background:linear-gradient(90deg,var(--cl-sky),var(--cl-blue) 35%,var(--cl-violet));}#ciel-loader .cl-bar i::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);transform:translateX(-100%);animation:clShimmer 1.2s ease-in-out infinite;}@keyframes clShimmer{to{transform:translateX(100%)}}#ciel-loader .cl-meta{width:clamp(180px,42vmin,320px);display:flex;justify-content:space-between;margin-top:10px;font-size:13px;font-weight:600;color:#7d74a8;font-variant-numeric:tabular-nums;opacity:0;animation:clFade .5s ease 2.3s forwards;}#ciel-loader .cl-tip{transition:opacity .25s;}";
  var HTML = "<div class=\"cl-mesh\"></div><div class=\"cl-bubbles\"></div><div class=\"cl-center\"><svg class=\"cl-brain\" viewBox=\"-6 -6 212 134\" aria-hidden=\"true\"><defs><linearGradient id=\"clGrad\" gradientUnits=\"userSpaceOnUse\" x1=\"0\" y1=\"0\" x2=\"200\" y2=\"40\"><stop offset=\"0\" stop-color=\"#4fa8ea\"/><stop offset=\".42\" stop-color=\"#4a7fd6\"/><stop offset=\".55\" stop-color=\"#6a4cc2\"/><stop offset=\"1\" stop-color=\"#6c3fb2\"/></linearGradient></defs><g stroke=\"#fff\" stroke-width=\"1.8\" stroke-linecap=\"round\" fill=\"#fff\"><g class=\"cl-f\" style=\"--i:0\"><polygon points=\"12,48 38,26 60,54\" fill=\"url(#clGrad)\"/><polygon points=\"12,48 38,26 60,54\" fill=\"rgba(255,255,255,.16)\"/></g><g class=\"cl-f\" style=\"--i:1\"><polygon points=\"12,48 60,54 28,78\" fill=\"url(#clGrad)\"/><polygon points=\"12,48 60,54 28,78\" fill=\"rgba(20,0,60,.12)\"/></g><g class=\"cl-f\" style=\"--i:2\"><polygon points=\"2,78 12,48 28,78\" fill=\"url(#clGrad)\"/><polygon points=\"2,78 12,48 28,78\" fill=\"rgba(20,0,60,.05)\"/></g><g class=\"cl-f\" style=\"--i:3\"><polygon points=\"8,105 2,78 28,78\" fill=\"url(#clGrad)\"/><polygon points=\"8,105 2,78 28,78\" fill=\"rgba(255,255,255,0)\"/></g><g class=\"cl-f\" style=\"--i:4\"><polygon points=\"8,105 28,78 24,109\" fill=\"url(#clGrad)\"/><polygon points=\"8,105 28,78 24,109\" fill=\"rgba(255,255,255,.08)\"/></g><g class=\"cl-f\" style=\"--i:5\"><polygon points=\"24,109 28,78 48,107\" fill=\"url(#clGrad)\"/><polygon points=\"24,109 28,78 48,107\" fill=\"rgba(255,255,255,.16)\"/></g><g class=\"cl-f\" style=\"--i:6\"><polygon points=\"28,78 60,54 48,107\" fill=\"url(#clGrad)\"/><polygon points=\"28,78 60,54 48,107\" fill=\"rgba(20,0,60,.12)\"/></g><g class=\"cl-f\" style=\"--i:7\"><polygon points=\"60,54 92,90 48,107\" fill=\"url(#clGrad)\"/><polygon points=\"60,54 92,90 48,107\" fill=\"rgba(20,0,60,.05)\"/></g><g class=\"cl-f\" style=\"--i:8\"><polygon points=\"48,107 92,90 68,116\" fill=\"url(#clGrad)\"/><polygon points=\"48,107 92,90 68,116\" fill=\"rgba(255,255,255,0)\"/></g><g class=\"cl-f\" style=\"--i:9\"><polygon points=\"68,116 92,90 92,117\" fill=\"url(#clGrad)\"/><polygon points=\"68,116 92,90 92,117\" fill=\"rgba(255,255,255,.08)\"/></g><g class=\"cl-f\" style=\"--i:10\"><polygon points=\"60,54 96,38 92,90\" fill=\"url(#clGrad)\"/><polygon points=\"60,54 96,38 92,90\" fill=\"rgba(255,255,255,.16)\"/></g><g class=\"cl-f\" style=\"--i:11\"><polygon points=\"38,26 60,11 60,54\" fill=\"url(#clGrad)\"/><polygon points=\"38,26 60,11 60,54\" fill=\"rgba(20,0,60,.12)\"/></g><g class=\"cl-f\" style=\"--i:12\"><polygon points=\"60,11 96,38 60,54\" fill=\"url(#clGrad)\"/><polygon points=\"60,11 96,38 60,54\" fill=\"rgba(20,0,60,.05)\"/></g><g class=\"cl-f\" style=\"--i:13\"><polygon points=\"60,11 102,3 96,38\" fill=\"url(#clGrad)\"/><polygon points=\"60,11 102,3 96,38\" fill=\"rgba(255,255,255,0)\"/></g><g class=\"cl-f\" style=\"--i:14\"><polygon points=\"102,3 132,36 96,38\" fill=\"url(#clGrad)\"/><polygon points=\"102,3 132,36 96,38\" fill=\"rgba(255,255,255,.08)\"/></g><g class=\"cl-f\" style=\"--i:15\"><polygon points=\"102,3 145,13 132,36\" fill=\"url(#clGrad)\"/><polygon points=\"102,3 145,13 132,36\" fill=\"rgba(255,255,255,.16)\"/></g><g class=\"cl-f\" style=\"--i:16\"><polygon points=\"96,38 132,36 126,82\" fill=\"url(#clGrad)\"/><polygon points=\"96,38 132,36 126,82\" fill=\"rgba(20,0,60,.12)\"/></g><g class=\"cl-f\" style=\"--i:17\"><polygon points=\"96,38 126,82 92,90\" fill=\"url(#clGrad)\"/><polygon points=\"96,38 126,82 92,90\" fill=\"rgba(20,0,60,.05)\"/></g><g class=\"cl-f\" style=\"--i:18\"><polygon points=\"92,90 126,82 122,108\" fill=\"url(#clGrad)\"/><polygon points=\"92,90 126,82 122,108\" fill=\"rgba(255,255,255,0)\"/></g><g class=\"cl-f\" style=\"--i:19\"><polygon points=\"92,90 122,108 92,117\" fill=\"url(#clGrad)\"/><polygon points=\"92,90 122,108 92,117\" fill=\"rgba(255,255,255,.08)\"/></g><g class=\"cl-f\" style=\"--i:20\"><polygon points=\"132,36 152,58 126,82\" fill=\"url(#clGrad)\"/><polygon points=\"132,36 152,58 126,82\" fill=\"rgba(255,255,255,.16)\"/></g><g class=\"cl-f\" style=\"--i:21\"><polygon points=\"145,13 152,58 132,36\" fill=\"url(#clGrad)\"/><polygon points=\"145,13 152,58 132,36\" fill=\"rgba(20,0,60,.12)\"/></g><g class=\"cl-f\" style=\"--i:22\"><polygon points=\"145,13 172,31 152,58\" fill=\"url(#clGrad)\"/><polygon points=\"145,13 172,31 152,58\" fill=\"rgba(20,0,60,.05)\"/></g><g class=\"cl-f\" style=\"--i:23\"><polygon points=\"172,31 192,52 152,58\" fill=\"url(#clGrad)\"/><polygon points=\"172,31 192,52 152,58\" fill=\"rgba(255,255,255,0)\"/></g><g class=\"cl-f\" style=\"--i:24\"><polygon points=\"152,58 192,52 166,88\" fill=\"url(#clGrad)\"/><polygon points=\"152,58 192,52 166,88\" fill=\"rgba(255,255,255,.08)\"/></g><g class=\"cl-f\" style=\"--i:25\"><polygon points=\"152,58 166,88 126,82\" fill=\"url(#clGrad)\"/><polygon points=\"152,58 166,88 126,82\" fill=\"rgba(255,255,255,.16)\"/></g><g class=\"cl-f\" style=\"--i:26\"><polygon points=\"192,52 198,78 166,88\" fill=\"url(#clGrad)\"/><polygon points=\"192,52 198,78 166,88\" fill=\"rgba(20,0,60,.12)\"/></g><g class=\"cl-f\" style=\"--i:27\"><polygon points=\"198,78 194,98 166,88\" fill=\"url(#clGrad)\"/><polygon points=\"198,78 194,98 166,88\" fill=\"rgba(20,0,60,.05)\"/></g><g class=\"cl-f\" style=\"--i:28\"><polygon points=\"194,98 172,107 166,88\" fill=\"url(#clGrad)\"/><polygon points=\"194,98 172,107 166,88\" fill=\"rgba(255,255,255,0)\"/></g><g class=\"cl-f\" style=\"--i:29\"><polygon points=\"172,107 150,116 166,88\" fill=\"url(#clGrad)\"/><polygon points=\"172,107 150,116 166,88\" fill=\"rgba(255,255,255,.08)\"/></g><g class=\"cl-f\" style=\"--i:30\"><polygon points=\"166,88 150,116 126,82\" fill=\"url(#clGrad)\"/><polygon points=\"166,88 150,116 126,82\" fill=\"rgba(255,255,255,.16)\"/></g><g class=\"cl-f\" style=\"--i:31\"><polygon points=\"126,82 150,116 122,108\" fill=\"url(#clGrad)\"/><polygon points=\"126,82 150,116 122,108\" fill=\"rgba(20,0,60,.12)\"/></g><path class=\"cl-ln\" style=\"--i:0\" d=\"M8,105L28,78\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:1\" d=\"M2,78L28,78\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:2\" d=\"M12,48L28,78\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:3\" d=\"M12,48L60,54\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:4\" d=\"M38,26L60,54\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:5\" d=\"M60,11L60,54\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:6\" d=\"M60,11L96,38\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:7\" d=\"M102,3L96,38\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:8\" d=\"M102,3L132,36\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:9\" d=\"M145,13L132,36\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:10\" d=\"M145,13L152,58\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:11\" d=\"M172,31L152,58\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:12\" d=\"M192,52L166,88\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:13\" d=\"M192,52L152,58\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:14\" d=\"M198,78L166,88\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:15\" d=\"M194,98L166,88\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:16\" d=\"M172,107L166,88\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:17\" d=\"M150,116L126,82\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:18\" d=\"M150,116L166,88\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:19\" d=\"M122,108L126,82\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:20\" d=\"M122,108L92,90\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:21\" d=\"M92,117L92,90\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:22\" d=\"M68,116L92,90\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:23\" d=\"M48,107L28,78\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:24\" d=\"M48,107L60,54\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:25\" d=\"M48,107L92,90\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:26\" d=\"M24,109L28,78\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:27\" d=\"M28,78L60,54\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:28\" d=\"M60,54L96,38\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:29\" d=\"M60,54L92,90\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:30\" d=\"M96,38L132,36\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:31\" d=\"M96,38L126,82\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:32\" d=\"M96,38L92,90\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:33\" d=\"M132,36L126,82\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:34\" d=\"M132,36L152,58\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:35\" d=\"M126,82L166,88\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:36\" d=\"M126,82L92,90\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:37\" d=\"M126,82L152,58\" pathLength=\"1\"/><path class=\"cl-ln\" style=\"--i:38\" d=\"M166,88L152,58\" pathLength=\"1\"/><circle class=\"cl-nd\" style=\"--i:0\" cx=\"28\" cy=\"78\" r=\"3.2\"/><circle class=\"cl-nd\" style=\"--i:1\" cx=\"60\" cy=\"54\" r=\"3.2\"/><circle class=\"cl-nd\" style=\"--i:2\" cx=\"96\" cy=\"38\" r=\"3.2\"/><circle class=\"cl-nd\" style=\"--i:3\" cx=\"132\" cy=\"36\" r=\"3.2\"/><circle class=\"cl-nd\" style=\"--i:4\" cx=\"126\" cy=\"82\" r=\"3.2\"/><circle class=\"cl-nd\" style=\"--i:5\" cx=\"166\" cy=\"88\" r=\"3.2\"/><circle class=\"cl-nd\" style=\"--i:6\" cx=\"92\" cy=\"90\" r=\"3.2\"/><circle class=\"cl-nd\" style=\"--i:7\" cx=\"152\" cy=\"58\" r=\"3.2\"/></g></svg><div class=\"cl-word\"><span style=\"--i:0\">C</span><span style=\"--i:1\">I</span><span style=\"--i:2\">E</span><span style=\"--i:3\">L</span></div><div class=\"cl-sub\">GAMES</div><div class=\"cl-tag\">Serving humanity with technology</div><div class=\"cl-bar\"><i></i></div><div class=\"cl-meta\"><span class=\"cl-tip\">Loading…</span><span class=\"cl-pct\">0%</span></div></div>";
  var TIPS = ['Loading assets…', 'Warming up…', 'Preparing the fun…', 'Polishing pixels…', 'Almost there…'];

  var root, fill, pct, tip, t0 = performance.now();
  var real = -1, pageReady = false, finished = false, closing = false, callbacks = [];

  function mount() {
    if (!document.querySelector('link[href*="family=Fredoka"]')) {
      var f = document.createElement('link');
      f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap';
      document.head.appendChild(f);
    }
    var st = document.createElement('style'); st.id = 'ciel-loader-style'; st.textContent = CSS;
    document.head.appendChild(st);
    root = document.createElement('div');
    root.id = 'ciel-loader'; root.setAttribute('role', 'progressbar'); root.setAttribute('aria-label', 'Loading');
    root.innerHTML = HTML;
    var bub = root.querySelector('.cl-bubbles');
    for (var k = 0; k < 16; k++) {
      var b = document.createElement('span'), s = 6 + Math.random() * 22;
      b.className = 'cl-bubble';
      b.style.cssText = 'left:' + Math.random() * 100 + '%;width:' + s + 'px;height:' + s + 'px;--dx:' + (Math.random() - 0.5) * 120 + 'px;' +
        'animation-duration:' + (6 + Math.random() * 7) + 's;animation-delay:' + (-Math.random() * 10) + 's;';
      bub.appendChild(b);
    }
    fill = root.querySelector('.cl-bar i'); pct = root.querySelector('.cl-pct'); tip = root.querySelector('.cl-tip');
    (document.body || document.documentElement).insertBefore(root, (document.body || document.documentElement).firstChild);
    requestAnimationFrame(tick);
  }

  // ---- readiness ----
  function onPageLoad() { pageReady = true; }
  if (document.readyState === 'complete') onPageLoad(); else window.addEventListener('load', onPageLoad);
  setTimeout(onPageLoad, 8000); // never wait forever on a slow font or image

  function waitTargetGone() {
    if (!WAIT) return true;
    if (performance.now() - t0 > WAIT_MAX) return true;
    var el = document.querySelector(WAIT);
    if (!el || !el.isConnected) return true;
    var cs = getComputedStyle(el);
    return cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0;
  }
  function isReady() {
    // Engine-driven loads finish on done(); a 90s cap keeps a failed load from hiding the game's own error forever.
    var base = (MANUAL || defold) ? (finished || performance.now() - t0 > 90000) : pageReady;
    return base && waitTargetGone();
  }

  // ---- animation loop ----
  var p = 0, tipI = 0, lastTip = t0;
  function tick(now) {
    if (closing) return;
    var el = now - t0, ready = isReady();
    var timeShare = el < BAR_DELAY ? 0 : Math.min(1, (el - BAR_DELAY) / (MIN - BAR_DELAY));
    var target;
    if (real >= 0) target = Math.min(timeShare * 100, ready ? 100 : Math.min(99, real * 100));
    else target = timeShare * (ready ? 100 : 90);
    p += (target - p) * 0.12;
    if (ready && el >= MIN && target - p < 0.6) p = 100;
    fill.style.width = p + '%';
    pct.textContent = Math.round(p) + '%';
    if (now - lastTip > 900 && p < 100) {
      lastTip = now; tipI = (tipI + 1) % TIPS.length;
      tip.style.opacity = 0;
      setTimeout(function () { tip.textContent = TIPS[tipI]; tip.style.opacity = 1; }, 200);
    }
    if (p >= 100) { close(); return; }
    requestAnimationFrame(tick);
  }
  function close() {
    closing = true;
    tip.textContent = 'Ready!'; tip.style.opacity = 1;
    setTimeout(function () {
      root.classList.add('cl-done');
      callbacks.splice(0).forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
      try { window.dispatchEvent(new Event('ciel-loader:done')); } catch (e) {}
      setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, 1100);
    }, 280);
  }

  // ---- Defold (dmloader.js) ----
  var defold = false;
  function hookDefold() {
    var PV = window.ProgressView;
    if (!PV || PV.__ciel || typeof PV.updateProgress !== 'function') return;
    defold = true; PV.__ciel = true;
    var up = PV.updateProgress, rm = PV.removeProgress;
    PV.updateProgress = function (percent) { api.progress(percent / 100); return up.apply(this, arguments); };
    PV.removeProgress = function () { api.done(); return rm && rm.apply(this, arguments); };
  }
  document.addEventListener('DOMContentLoaded', hookDefold);

  var api = window.CielLoader = {
    progress: function (f) { if (typeof f === 'number' && isFinite(f)) real = Math.max(real, Math.min(1, Math.max(0, f))); },
    done: function () { finished = true; },
    onDone: function (fn) { if (closing && root && root.classList.contains('cl-done')) fn(); else callbacks.push(fn); },
    get closed() { return closing; },
    unity: function (canvas, config, onProgress) {
      return window.createUnityInstance(canvas, config, function (v) {
        api.progress(v);
        if (onProgress) onProgress(v);
      }).then(function (inst) { api.done(); return inst; }, function (err) { api.done(); throw err; });
    },
  };

  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
