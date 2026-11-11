/* ==========================================================================
   BRAIN TEST: TRICKY PUZZLES - GAME ENGINE & PUZZLES
   ========================================================================== */

(function () {
  'use strict';

  // ==========================================================================
  // AUDIO SYNTHESIZER (Web Audio API - No external files needed)
  // ==========================================================================
  var Sound = (function () {
    var ctx = null;
    var enabled = true;

    function getCtx() {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    }

    return {
      toggle: function () {
        enabled = !enabled;
        return enabled;
      },
      isEnabled: function () {
        return enabled;
      },
      tap: function () {
        if (!enabled) return;
        var ac = getCtx();
        if (!ac) return;
        var osc = ac.createOscillator();
        var g = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.06);
        g.gain.setValueAtTime(0.2, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.06);
        osc.connect(g);
        g.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.06);
      },
      wrong: function () {
        if (!enabled) return;
        var ac = getCtx();
        if (!ac) return;
        var osc = ac.createOscillator();
        var g = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ac.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ac.currentTime + 0.22);
        g.gain.setValueAtTime(0.25, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.22);
        osc.connect(g);
        g.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.22);
      },
      correct: function () {
        if (!enabled) return;
        var ac = getCtx();
        if (!ac) return;
        var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach(function (f, i) {
          var osc = ac.createOscillator();
          var g = ac.createGain();
          var t = ac.currentTime + i * 0.09;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t);
          g.gain.setValueAtTime(0.28, t);
          g.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
          osc.connect(g);
          g.connect(ac.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
      },
      pop: function () {
        if (!enabled) return;
        var ac = getCtx();
        if (!ac) return;
        var osc = ac.createOscillator();
        var g = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(740, ac.currentTime + 0.08);
        g.gain.setValueAtTime(0.3, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.08);
        osc.connect(g);
        g.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.08);
      }
    };
  })();

  // ==========================================================================
  // CONFETTI SYSTEM
  // ==========================================================================
  var Confetti = (function () {
    var canvas = document.getElementById('confettiCanvas');
    var ctx = canvas ? canvas.getContext('2d') : null;
    var particles = [];
    var animating = false;
    var colors = ['#ff6b35', '#2ecc71', '#3b82f6', '#facc15', '#a855f7', '#ff70a6'];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function update() {
      if (!animating || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = false;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.008;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
          ctx.restore();
        }
      }

      if (alive) {
        requestAnimationFrame(update);
      } else {
        animating = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return {
      launch: function (count) {
        if (!canvas) return;
        resize();
        particles = [];
        var num = count || 80;
        var startX = canvas.width / 2;
        var startY = canvas.height * 0.45;

        for (var i = 0; i < num; i++) {
          var angle = Math.random() * Math.PI * 2;
          var speed = 4 + Math.random() * 12;
          particles.push({
            x: startX + (Math.random() - 0.5) * 80,
            y: startY + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 5,
            gravity: 0.35,
            size: 8 + Math.random() * 8,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.25,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1
          });
        }
        if (!animating) {
          animating = true;
          requestAnimationFrame(update);
        }
      }
    };
  })();

  // ==========================================================================
  // UNIFIED POINTER DRAG & DROP HELPER
  // ==========================================================================
  function makeDraggable(el, options) {
    options = options || {};
    var startX, startY, origX, origY, isDragging = false;

    function getCoords(e) {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      // Don't drag if target is button
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      var c = getCoords(e);
      startX = c.x;
      startY = c.y;
      origX = el.offsetLeft;
      origY = el.offsetTop;
      el.style.zIndex = '300';
      el.classList.add('is-dragging');
      Sound.tap();

      if (options.onStart) options.onStart(el, origX, origY);

      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
      if (!isDragging) return;
      e.preventDefault();
      var c = getCoords(e);
      var dx = c.x - startX;
      var dy = c.y - startY;

      var newX = origX + dx;
      var newY = origY + dy;

      if (options.constrainX) {
        newX = Math.max(options.minX || 0, Math.min(options.maxX || 300, newX));
      }
      if (options.constrainY) {
        newY = Math.max(options.minY || 0, Math.min(options.maxY || 400, newY));
      }

      el.style.left = newX + 'px';
      el.style.top = newY + 'px';

      if (options.onMove) options.onMove(el, newX, newY, c.x, c.y);
    }

    function onEnd(e) {
      if (!isDragging) return;
      isDragging = false;
      el.style.zIndex = '';
      el.classList.remove('is-dragging');

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);

      if (options.onEnd) {
        var c = (e.changedTouches && e.changedTouches.length > 0)
          ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
          : { x: e.clientX, y: e.clientY };
        options.onEnd(el, el.offsetLeft, el.offsetTop, c.x, c.y);
      }
    }

    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
  }

  // Hit test helper
  function isOverlapping(elA, elB) {
    var rA = elA.getBoundingClientRect();
    var rB = elB.getBoundingClientRect();
    return !(
      rA.right < rB.left ||
      rA.left > rB.right ||
      rA.bottom < rB.top ||
      rA.top > rB.bottom
    );
  }

  // ==========================================================================
  // PUZZLES REGISTRY (15 Authentic Brain Test Puzzles)
  // ==========================================================================
  var PUZZLES = [

    // ========================================================================
    // LEVEL 1: Which one is the biggest?
    // Lion is drawn huge, elephant is drawn tiny!
    // ========================================================================
    {
      level: 1,
      title: "Which one is the biggest?",
      hint: "Don't think about real life size. Look at how they are drawn right on your screen!",
      explanation: "Even though elephants are bigger in real life, this lion is drawn much bigger on screen!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div class="animals-grid">',
            // Lion (Biggest)
            '<div class="animal-item animal-lion" id="animalLion" title="Lion">',
              '<div class="animal-svg-wrap">',
                '<svg viewBox="0 0 160 160">',
                  '<!-- Mane -->',
                  '<circle cx="80" cy="80" r="70" fill="#f59e0b" stroke="#2d3748" stroke-width="4.5"/>',
                  '<path d="M40 30 C30 15 50 10 60 25 C70 10 90 10 100 25 C110 10 130 15 120 30 C140 35 145 55 135 65 C150 75 150 95 135 105 C145 115 140 135 120 140 C110 155 90 155 80 140 C70 155 50 155 40 140 C20 135 15 115 25 105 C10 95 10 75 25 65 C15 55 20 35 40 30 Z" fill="#d97706" opacity="0.6"/>',
                  '<!-- Face -->',
                  '<circle cx="80" cy="84" r="48" fill="#fde047" stroke="#2d3748" stroke-width="4"/>',
                  '<!-- Ears -->',
                  '<circle cx="48" cy="48" r="14" fill="#f59e0b" stroke="#2d3748" stroke-width="3.5"/>',
                  '<circle cx="48" cy="48" r="8" fill="#fef08a"/>',
                  '<circle cx="112" cy="48" r="14" fill="#f59e0b" stroke="#2d3748" stroke-width="3.5"/>',
                  '<circle cx="112" cy="48" r="8" fill="#fef08a"/>',
                  '<!-- Eyes -->',
                  '<ellipse cx="64" cy="76" rx="6" ry="8" fill="#2d3748"/>',
                  '<circle cx="62" cy="73" r="2.5" fill="#fff"/>',
                  '<ellipse cx="96" cy="76" rx="6" ry="8" fill="#2d3748"/>',
                  '<circle cx="94" cy="73" r="2.5" fill="#fff"/>',
                  '<!-- Nose & Whiskers -->',
                  '<polygon points="80,90 73,82 87,82" fill="#78350f"/>',
                  '<path d="M80 90 L80 100 M80 100 C74 106 68 100 64 96 M80 100 C86 106 92 100 96 96" stroke="#2d3748" stroke-width="3" fill="none" stroke-linecap="round"/>',
                  '<line x1="42" y1="92" x2="60" y2="94" stroke="#2d3748" stroke-width="2.5" stroke-linecap="round"/>',
                  '<line x1="44" y1="102" x2="62" y2="100" stroke="#2d3748" stroke-width="2.5" stroke-linecap="round"/>',
                  '<line x1="118" y1="92" x2="100" y2="94" stroke="#2d3748" stroke-width="2.5" stroke-linecap="round"/>',
                  '<line x1="116" y1="102" x2="98" y2="100" stroke="#2d3748" stroke-width="2.5" stroke-linecap="round"/>',
                '</svg>',
              '</div>',
            '</div>',
            // Elephant (Drawn tiny)
            '<div class="animal-item animal-elephant" id="animalElephant" title="Elephant">',
              '<div class="animal-svg-wrap">',
                '<svg viewBox="0 0 100 100">',
                  '<!-- Big Ears -->',
                  '<ellipse cx="28" cy="46" rx="22" ry="26" fill="#94a3b8" stroke="#2d3748" stroke-width="3.5"/>',
                  '<ellipse cx="28" cy="46" rx="14" ry="18" fill="#fbcfe8"/>',
                  '<ellipse cx="72" cy="46" rx="22" ry="26" fill="#94a3b8" stroke="#2d3748" stroke-width="3.5"/>',
                  '<ellipse cx="72" cy="46" rx="14" ry="18" fill="#fbcfe8"/>',
                  '<!-- Head -->',
                  '<circle cx="50" cy="50" r="32" fill="#cbd5e1" stroke="#2d3748" stroke-width="3.5"/>',
                  '<!-- Eyes -->',
                  '<circle cx="40" cy="44" r="4.5" fill="#2d3748"/>',
                  '<circle cx="39" cy="42" r="1.5" fill="#fff"/>',
                  '<circle cx="60" cy="44" r="4.5" fill="#2d3748"/>',
                  '<circle cx="59" cy="42" r="1.5" fill="#fff"/>',
                  '<!-- Trunk -->',
                  '<path d="M50 56 C46 68 44 78 54 80 C60 82 62 76 56 74" fill="none" stroke="#2d3748" stroke-width="5" stroke-linecap="round"/>',
                '</svg>',
              '</div>',
            '</div>',
            // Zebra (Medium)
            '<div class="animal-item animal-zebra" id="animalZebra" title="Zebra">',
              '<div class="animal-svg-wrap">',
                '<svg viewBox="0 0 110 110">',
                  '<!-- Ears -->',
                  '<ellipse cx="38" cy="24" rx="7" ry="14" fill="#ffffff" stroke="#2d3748" stroke-width="3"/>',
                  '<ellipse cx="72" cy="24" rx="7" ry="14" fill="#ffffff" stroke="#2d3748" stroke-width="3"/>',
                  '<!-- Mane -->',
                  '<path d="M55 18 C52 26 58 34 55 42" stroke="#2d3748" stroke-width="6" stroke-linecap="round"/>',
                  '<!-- Head -->',
                  '<ellipse cx="55" cy="58" rx="32" ry="38" fill="#ffffff" stroke="#2d3748" stroke-width="3.5"/>',
                  '<!-- Stripes -->',
                  '<path d="M30 46 L46 50 M26 58 L44 60 M78 46 L64 50 M84 58 L66 60" stroke="#2d3748" stroke-width="3.5" stroke-linecap="round"/>',
                  '<!-- Eyes -->',
                  '<circle cx="44" cy="52" r="4" fill="#2d3748"/>',
                  '<circle cx="66" cy="52" r="4" fill="#2d3748"/>',
                  '<!-- Muzzle -->',
                  '<ellipse cx="55" cy="80" rx="16" ry="10" fill="#e2e8f0" stroke="#2d3748" stroke-width="3"/>',
                  '<circle cx="50" cy="80" r="2" fill="#2d3748"/>',
                  '<circle cx="60" cy="80" r="2" fill="#2d3748"/>',
                '</svg>',
              '</div>',
            '</div>',
            // Mouse (Tiny)
            '<div class="animal-item animal-mouse" id="animalMouse" title="Mouse">',
              '<div class="animal-svg-wrap">',
                '<svg viewBox="0 0 70 70">',
                  '<!-- Ears -->',
                  '<circle cx="22" cy="24" r="14" fill="#cbd5e1" stroke="#2d3748" stroke-width="3"/>',
                  '<circle cx="22" cy="24" r="8" fill="#fbcfe8"/>',
                  '<circle cx="48" cy="24" r="14" fill="#cbd5e1" stroke="#2d3748" stroke-width="3"/>',
                  '<circle cx="48" cy="24" r="8" fill="#fbcfe8"/>',
                  '<!-- Head -->',
                  '<ellipse cx="35" cy="44" rx="20" ry="18" fill="#e2e8f0" stroke="#2d3748" stroke-width="3"/>',
                  '<!-- Eyes -->',
                  '<circle cx="28" cy="40" r="3" fill="#2d3748"/>',
                  '<circle cx="42" cy="40" r="3" fill="#2d3748"/>',
                  '<!-- Pink Nose -->',
                  '<circle cx="35" cy="50" r="3" fill="#f43f5e"/>',
                  '<!-- Whiskers -->',
                  '<line x1="16" y1="48" x2="26" y2="50" stroke="#2d3748" stroke-width="2"/>',
                  '<line x1="54" y1="48" x2="44" y2="50" stroke="#2d3748" stroke-width="2"/>',
                '</svg>',
              '</div>',
            '</div>',
          '</div>'
        ].join('');

        // Listeners
        document.getElementById('animalLion').onclick = function () {
          onSolve();
        };

        ['animalElephant', 'animalZebra', 'animalMouse'].forEach(function (id) {
          document.getElementById(id).onclick = function (e) {
            onFail(e.clientX, e.clientY);
          };
        });
      }
    },

    // ========================================================================
    // LEVEL 2: How to blossom this flower?
    // Drag the dark rain clouds away to reveal the warm sun!
    // ========================================================================
    {
      level: 2,
      title: "How to blossom this flower?",
      hint: "Plants need sunlight to bloom. Clear those gloomy clouds out of the way!",
      explanation: "Sunshine gave the flower the energy it needed to bloom beautifully!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div style="position:relative; width:100%; height:360px; overflow:hidden;">',
            // Sun (hidden behind clouds at top right)
            '<div id="sunEl" style="position:absolute; top:20px; right:40px; width:76px; height:76px;">',
              '<svg viewBox="0 0 100 100">',
                '<circle cx="50" cy="50" r="30" fill="#facc15" stroke="#2d3748" stroke-width="4"/>',
                // Sunbeams
                '<g stroke="#f59e0b" stroke-width="4" stroke-linecap="round">',
                  '<line x1="50" y1="8" x2="50" y2="15"/>',
                  '<line x1="50" y1="85" x2="50" y2="92"/>',
                  '<line x1="8" y1="50" x2="15" y2="50"/>',
                  '<line x1="85" y1="50" x2="92" y2="50"/>',
                  '<line x1="20" y1="20" x2="26" y2="26"/>',
                  '<line x1="74" y1="74" x2="80" y2="80"/>',
                  '<line x1="20" y1="80" x2="26" y2="74"/>',
                  '<line x1="74" y1="26" x2="80" y2="20"/>',
                '</g>',
                // Cute face
                '<circle cx="42" cy="48" r="3.5" fill="#2d3748"/>',
                '<circle cx="58" cy="48" r="3.5" fill="#2d3748"/>',
                '<path d="M44 56 Q50 63 56 56" stroke="#2d3748" stroke-width="3" fill="none" stroke-linecap="round"/>',
              '</svg>',
            '</div>',
            // Cloud 1 (Draggable - on top of sun)
            '<div id="cloud1" class="draggable-item" style="position:absolute; top:12px; right:15px; width:125px; height:70px;">',
              '<svg viewBox="0 0 130 80">',
                '<path d="M25 60 A22 22 0 0 1 35 25 A30 30 0 0 1 85 20 A26 26 0 0 1 115 50 A20 20 0 0 1 105 65 Z" fill="#94a3b8" stroke="#2d3748" stroke-width="4" stroke-linejoin="round"/>',
              '</svg>',
            '</div>',
            // Cloud 2 (Draggable - overlapping)
            '<div id="cloud2" class="draggable-item" style="position:absolute; top:35px; right:55px; width:115px; height:65px;">',
              '<svg viewBox="0 0 120 70">',
                '<path d="M20 50 A20 20 0 0 1 30 20 A26 26 0 0 1 75 16 A24 24 0 0 1 100 42 A18 18 0 0 1 95 55 Z" fill="#64748b" stroke="#2d3748" stroke-width="4" stroke-linejoin="round"/>',
              '</svg>',
            '</div>',
            // Flower Pot & Stem
            '<div id="flowerContainer" style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%); width:140px; height:180px;">',
              '<svg viewBox="0 0 140 180">',
                // Pot
                '<polygon points="35,110 105,110 95,170 45,170" fill="#f97316" stroke="#2d3748" stroke-width="4" stroke-linejoin="round"/>',
                '<rect x="28" y="100" width="84" height="15" rx="4" fill="#ea580c" stroke="#2d3748" stroke-width="4"/>',
                // Stem
                '<path d="M70 100 Q65 60 70 30" stroke="#16a34a" stroke-width="6" fill="none" stroke-linecap="round"/>',
                // Leaves
                '<ellipse cx="54" cy="75" rx="14" ry="7" transform="rotate(-30 54 75)" fill="#22c55e" stroke="#2d3748" stroke-width="3"/>',
                '<ellipse cx="86" cy="65" rx="14" ry="7" transform="rotate(30 86 65)" fill="#22c55e" stroke="#2d3748" stroke-width="3"/>',
                // Bud / Bloom
                '<g id="flowerBloomGroup">',
                  '<!-- Drooping Bud -->',
                  '<ellipse cx="70" cy="28" rx="12" ry="16" fill="#ec4899" stroke="#2d3748" stroke-width="3.5"/>',
                  '<ellipse cx="70" cy="24" rx="7" ry="10" fill="#f43f5e"/>',
                '</g>',
              '</svg>',
            '</div>',
          '</div>'
        ].join('');

        var cloud1Moved = false, cloud2Moved = false;
        var sunEl = document.getElementById('sunEl');
        var cloud1 = document.getElementById('cloud1');
        var cloud2 = document.getElementById('cloud2');

        function checkSunExposed() {
          var rSun = sunEl.getBoundingClientRect();
          var rC1 = cloud1.getBoundingClientRect();
          var rC2 = cloud2.getBoundingClientRect();

          var overlap1 = !(rC1.right < rSun.left || rC1.left > rSun.right || rC1.bottom < rSun.top || rC1.top > rSun.bottom);
          var overlap2 = !(rC2.right < rSun.left || rC2.left > rSun.right || rC2.bottom < rSun.top || rC2.top > rSun.bottom);

          if (!overlap1 && !overlap2) {
            // Sun is uncovered! Bloom the flower!
            var bloom = document.getElementById('flowerBloomGroup');
            bloom.innerHTML = [
              '<circle cx="70" cy="24" r="26" fill="#f472b6" stroke="#2d3748" stroke-width="4"/>',
              '<circle cx="70" cy="24" r="14" fill="#fde047" stroke="#2d3748" stroke-width="3.5"/>',
              '<circle cx="66" cy="22" r="2" fill="#2d3748"/>',
              '<circle cx="74" cy="22" r="2" fill="#2d3748"/>',
              '<path d="M67 27 Q70 30 73 27" stroke="#2d3748" stroke-width="2" fill="none" stroke-linecap="round"/>'
            ].join('');
            Sound.pop();
            setTimeout(function () {
              onSolve();
            }, 600);
          }
        }

        makeDraggable(cloud1, {
          onEnd: function () { checkSunExposed(); }
        });
        makeDraggable(cloud2, {
          onEnd: function () { checkSunExposed(); }
        });
      }
    },

    // ========================================================================
    // LEVEL 3: Put the elephant into the fridge
    // Tap the fridge door to open it, drag elephant in, close door!
    // ========================================================================
    {
      level: 3,
      title: "Put the elephant into the fridge.",
      hint: "A closed fridge won't fit anything! Open the door first!",
      explanation: "Open the door, put the elephant inside, and close it. Easy peasy!",
      render: function (stage, onSolve, onFail) {
        var fridgeOpen = false;
        var elephantInside = false;

        stage.innerHTML = [
          '<div style="position:relative; width:100%; height:360px; display:flex; align-items:center; justify-content:space-around;">',
            // Fridge
            '<div id="fridgeEl" style="position:relative; width:130px; height:230px; cursor:pointer;">',
              '<svg viewBox="0 0 130 230" id="fridgeSvg">',
                '<!-- Fridge Body Outer -->',
                '<rect x="8" y="10" width="114" height="210" rx="14" fill="#e2e8f0" stroke="#2d3748" stroke-width="4.5"/>',
                // Closed Door State
                '<g id="fridgeClosedDoor">',
                  // Top Freezer Door
                  '<rect x="12" y="14" width="106" height="70" rx="10" fill="#f8fafc" stroke="#2d3748" stroke-width="3.5"/>',
                  '<rect x="22" y="50" width="10" height="22" rx="3" fill="#94a3b8" stroke="#2d3748" stroke-width="2.5"/>',
                  // Bottom Fridge Door
                  '<rect x="12" y="88" width="106" height="128" rx="10" fill="#f8fafc" stroke="#2d3748" stroke-width="3.5"/>',
                  '<rect x="22" y="100" width="10" height="35" rx="3" fill="#94a3b8" stroke="#2d3748" stroke-width="2.5"/>',
                '</g>',
                // Interior (shown when open)
                '<g id="fridgeInterior" style="display:none;">',
                  '<rect x="14" y="16" width="102" height="198" rx="8" fill="#cffafe"/>',
                  '<line x1="14" y1="84" x2="116" y2="84" stroke="#0891b2" stroke-width="3"/>',
                  '<line x1="14" y1="130" x2="116" y2="130" stroke="#0891b2" stroke-width="3"/>',
                  '<line x1="14" y1="174" x2="116" y2="174" stroke="#0891b2" stroke-width="3"/>',
                '</g>',
              '</svg>',
            '</div>',
            // Elephant (Draggable)
            '<div id="elephantEl" class="draggable-item" style="position:relative; width:100px; height:100px;">',
              '<svg viewBox="0 0 100 100">',
                '<ellipse cx="28" cy="46" rx="22" ry="26" fill="#94a3b8" stroke="#2d3748" stroke-width="3.5"/>',
                '<ellipse cx="28" cy="46" rx="14" ry="18" fill="#fbcfe8"/>',
                '<ellipse cx="72" cy="46" rx="22" ry="26" fill="#94a3b8" stroke="#2d3748" stroke-width="3.5"/>',
                '<ellipse cx="72" cy="46" rx="14" ry="18" fill="#fbcfe8"/>',
                '<circle cx="50" cy="50" r="32" fill="#cbd5e1" stroke="#2d3748" stroke-width="3.5"/>',
                '<circle cx="40" cy="44" r="4.5" fill="#2d3748"/>',
                '<circle cx="60" cy="44" r="4.5" fill="#2d3748"/>',
                '<path d="M50 56 C46 68 44 78 54 80 C60 82 62 76 56 74" fill="none" stroke="#2d3748" stroke-width="5" stroke-linecap="round"/>',
              '</svg>',
            '</div>',
          '</div>'
        ].join('');

        var fridgeEl = document.getElementById('fridgeEl');
        var closedDoor = document.getElementById('fridgeClosedDoor');
        var interior = document.getElementById('fridgeInterior');
        var elephantEl = document.getElementById('elephantEl');

        function toggleFridge() {
          Sound.tap();
          fridgeOpen = !fridgeOpen;
          if (fridgeOpen) {
            closedDoor.style.display = 'none';
            interior.style.display = 'block';
          } else {
            closedDoor.style.display = 'block';
            interior.style.display = 'none';

            if (elephantInside) {
              // Successfully trapped inside closed fridge!
              Sound.pop();
              setTimeout(function () {
                onSolve();
              }, 400);
            }
          }
        }

        fridgeEl.onclick = toggleFridge;

        makeDraggable(elephantEl, {
          onEnd: function () {
            if (fridgeOpen && isOverlapping(elephantEl, fridgeEl)) {
              elephantInside = true;
              elephantEl.style.opacity = '0.6';
              elephantEl.style.transform = 'scale(0.7)';
              Sound.pop();
            } else {
              elephantInside = false;
              elephantEl.style.opacity = '1';
              elephantEl.style.transform = 'none';
            }
          }
        });
      }
    },

    // ========================================================================
    // LEVEL 4: Which one is closest to us?
    // Moon is directly beneath the prompt word "us"!
    // ========================================================================
    {
      level: 4,
      title: "Which one is closest to us?",
      hint: "Read the question sentence carefully. Which object is closest to the word 'us'?",
      explanation: "Look at the prompt text: the word 'us' is placed right above the Moon!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div style="position:relative; width:100%; height:340px; background:#0f172a; border-radius:20px; overflow:hidden; border:3px solid #2d3748;">',
            // Stars in background
            '<div style="position:absolute; top:25px; left:40px; color:#fef08a; font-size:14px;">✦</div>',
            '<div style="position:absolute; top:80px; left:120px; color:#fef08a; font-size:18px;">✧</div>',
            '<div style="position:absolute; top:40px; right:60px; color:#fef08a; font-size:12px;">✦</div>',
            '<div style="position:absolute; bottom:60px; left:80px; color:#fef08a; font-size:16px;">✦</div>',

            // Sun (far left)
            '<div id="spaceSun" style="position:absolute; top:60px; left:25px; width:80px; height:80px; cursor:pointer;" title="Sun">',
              '<svg viewBox="0 0 80 80">',
                '<circle cx="40" cy="40" r="28" fill="#f97316" stroke="#ea580c" stroke-width="4"/>',
                '<circle cx="40" cy="40" r="22" fill="#facc15"/>',
              '</svg>',
            '</div>',

            // Earth (center bottom)
            '<div id="spaceEarth" style="position:absolute; bottom:25px; left:50%; transform:translateX(-50%); width:90px; height:90px; cursor:pointer;" title="Earth">',
              '<svg viewBox="0 0 90 90">',
                '<circle cx="45" cy="45" r="38" fill="#0284c7" stroke="#0369a1" stroke-width="4"/>',
                '<path d="M25 35 Q40 20 60 30 Q75 45 60 65 Q40 60 25 35 Z" fill="#22c55e"/>',
                '<path d="M40 70 Q55 75 65 70" stroke="#22c55e" stroke-width="5" fill="none" stroke-linecap="round"/>',
              '</svg>',
            '</div>',

            // Moon (top right - directly under the word 'us' in question above!)
            '<div id="spaceMoon" style="position:absolute; top:15px; right:40px; width:75px; height:75px; cursor:pointer;" title="Moon">',
              '<svg viewBox="0 0 75 75">',
                '<circle cx="37" cy="37" r="30" fill="#fef08a" stroke="#ca8a04" stroke-width="3.5"/>',
                '<circle cx="26" cy="30" r="5" fill="#fde047" opacity="0.6"/>',
                '<circle cx="46" cy="45" r="7" fill="#fde047" opacity="0.6"/>',
                '<circle cx="32" cy="50" r="4" fill="#fde047" opacity="0.6"/>',
              '</svg>',
            '</div>',
          '</div>'
        ].join('');

        document.getElementById('spaceMoon').onclick = function () {
          onSolve();
        };

        document.getElementById('spaceSun').onclick = function (e) {
          onFail(e.clientX, e.clientY);
        };

        document.getElementById('spaceEarth').onclick = function (e) {
          onFail(e.clientX, e.clientY);
        };
      }
    },

    // ========================================================================
    // LEVEL 5: How many pizza slices do we have?
    // Drag overlapping slices apart to count 9 in total! Enter 9 in keypad.
    // ========================================================================
    {
      level: 5,
      title: "How many pizza slices do we have?",
      hint: "Move the slices around! Some are hiding beneath others!",
      explanation: "Separating all the stacked slices revealed 9 slices in total!",
      render: function (stage, onSolve, onFail) {
        var inputVal = '';

        stage.innerHTML = [
          '<div style="width:100%; display:flex; flex-direction:column; align-items:center; gap:12px;">',
            // Cutting Board / Plate with draggable slices
            '<div id="pizzaPlate" style="position:relative; width:280px; height:180px; background:#fef3c7; border:3px solid #d97706; border-radius:24px; overflow:hidden;">',
              // 9 Slices: 5 top, 4 hidden below
              '<div class="draggable-item slice" style="position:absolute; top:20px; left:25px; width:65px; height:65px;">🍕</div>',
              '<div class="draggable-item slice" style="position:absolute; top:20px; left:80px; width:65px; height:65px;">🍕</div>',
              '<div class="draggable-item slice" style="position:absolute; top:20px; left:135px; width:65px; height:65px;">🍕</div>',
              '<div class="draggable-item slice" style="position:absolute; top:20px; left:190px; width:65px; height:65px;">🍕</div>',
              '<div class="draggable-item slice" style="position:absolute; top:80px; left:110px; width:65px; height:65px;">🍕</div>',
              // Hidden underneath
              '<div class="draggable-item slice" style="position:absolute; top:22px; left:28px; width:65px; height:65px; z-index:1;">🍕</div>',
              '<div class="draggable-item slice" style="position:absolute; top:22px; left:83px; width:65px; height:65px; z-index:1;">🍕</div>',
              '<div class="draggable-item slice" style="position:absolute; top:22px; left:138px; width:65px; height:65px; z-index:1;">🍕</div>',
              '<div class="draggable-item slice" style="position:absolute; top:82px; left:113px; width:65px; height:65px; z-index:1;">🍕</div>',
            '</div>',

            // Keypad
            '<div class="keypad-container">',
              '<div class="keypad-display" id="pizzaDisplay">?</div>',
              '<div class="keypad-grid">',
                '<button class="keypad-btn" data-key="1">1</button>',
                '<button class="keypad-btn" data-key="2">2</button>',
                '<button class="keypad-btn" data-key="3">3</button>',
                '<button class="keypad-btn" data-key="4">4</button>',
                '<button class="keypad-btn" data-key="5">5</button>',
                '<button class="keypad-btn" data-key="6">6</button>',
                '<button class="keypad-btn" data-key="7">7</button>',
                '<button class="keypad-btn" data-key="8">8</button>',
                '<button class="keypad-btn" data-key="9">9</button>',
                '<button class="keypad-btn btn-clear-key" id="btnKeyClear">C</button>',
                '<button class="keypad-btn" data-key="0">0</button>',
                '<button class="keypad-btn btn-submit-key" id="btnKeySubmit">OK</button>',
              '</div>',
            '</div>',
          '</div>'
        ].join('');

        // Make all slices draggable
        var slices = stage.querySelectorAll('.slice');
        slices.forEach(function (s) {
          s.style.fontSize = '44px';
          makeDraggable(s);
        });

        var display = document.getElementById('pizzaDisplay');
        stage.querySelectorAll('.keypad-btn[data-key]').forEach(function (btn) {
          btn.onclick = function () {
            Sound.tap();
            if (inputVal.length < 3) {
              inputVal += btn.dataset.key;
              display.textContent = inputVal;
            }
          };
        });

        document.getElementById('btnKeyClear').onclick = function () {
          Sound.tap();
          inputVal = '';
          display.textContent = '?';
        };

        document.getElementById('btnKeySubmit').onclick = function (e) {
          if (inputVal === '9') {
            onSolve();
          } else {
            onFail(e.clientX, e.clientY);
            inputVal = '';
            display.textContent = '?';
          }
        };
      }
    },

    // ========================================================================
    // LEVEL 6: I overtook the 2nd placed racer, what is my position?
    // Options: 1st, 2nd, 3rd. Tapping 2nd wins!
    // ========================================================================
    {
      level: 6,
      title: "I overtook the 2nd placed racer, what is my position?",
      hint: "If you pass the person in second place, you take their spot!",
      explanation: "Passing the 2nd placed runner puts you in 2nd place, not 1st!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div style="width:100%; display:flex; flex-direction:column; align-items:center; gap:24px;">',
            // Race Track Visual
            '<div style="position:relative; width:100%; max-width:320px; height:120px; background:#475569; border-radius:18px; border:3px solid #2d3748; overflow:hidden; display:flex; align-items:center; justify-content:space-around;">',
              '<div style="position:absolute; width:100%; height:4px; border-top:3px dashed #fff; opacity:0.6;"></div>',
              '<div style="font-size:38px; transform:scaleX(-1);">🏎️</div>',
              '<div style="font-size:38px; transform:scaleX(-1);">🚙</div>',
              '<div style="font-size:38px; transform:scaleX(-1);">🚗</div>',
            '</div>',

            // Answer Buttons
            '<div style="display:flex; gap:14px; width:100%; max-width:320px;">',
              '<button class="btn-bubble" id="pos1st" style="flex:1; height:60px; font-size:22px; background:#ffffff;">1st</button>',
              '<button class="btn-bubble" id="pos2nd" style="flex:1; height:60px; font-size:22px; background:#ffffff;">2nd</button>',
              '<button class="btn-bubble" id="pos3rd" style="flex:1; height:60px; font-size:22px; background:#ffffff;">3rd</button>',
            '</div>',
          '</div>'
        ].join('');

        document.getElementById('pos2nd').onclick = function () {
          onSolve();
        };

        document.getElementById('pos1st').onclick = function (e) {
          onFail(e.clientX, e.clientY);
        };

        document.getElementById('pos3rd').onclick = function (e) {
          onFail(e.clientX, e.clientY);
        };
      }
    },

    // ========================================================================
    // LEVEL 7: Slide left to unlock.
    // The lock knob must be dragged to the LEFT!
    // ========================================================================
    {
      level: 7,
      title: "Slide left to unlock.",
      hint: "Most phones slide right, but this prompt explicitly says slide LEFT!",
      explanation: "You actually slid to the left! Unlocked!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div style="width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; gap:20px;">',
            '<div style="font-size:68px;" id="lockIcon">🔒</div>',
            // Slider Track
            '<div id="slideTrack" style="position:relative; width:280px; height:64px; background:#e2e8f0; border:3.5px solid #2d3748; border-radius:999px; display:flex; align-items:center;">',
              '<div style="position:absolute; width:100%; text-align:center; font-weight:700; color:#64748b; font-size:15px; pointer-events:none;">&lt;&lt; SLIDE TO UNLOCK</div>',
              // Knob starting on right
              '<div id="slideKnob" class="draggable-item" style="position:absolute; right:6px; width:52px; height:52px; border-radius:50%; background:#ff6b35; border:3px solid #2d3748; display:grid; place-items:center; color:#fff; font-size:20px; box-shadow:0 3px 0 #2d3748;">',
                '◀',
              '</div>',
            '</div>',
          '</div>'
        ].join('');

        var knob = document.getElementById('slideKnob');
        var track = document.getElementById('slideTrack');

        makeDraggable(knob, {
          constrainY: true,
          minY: 3,
          maxY: 3,
          onMove: function (el, x) {
            if (x < 30) {
              // Reached left end!
              document.getElementById('lockIcon').textContent = '🔓';
              Sound.pop();
              setTimeout(function () {
                onSolve();
              }, 400);
            }
          }
        });
      }
    },

    // ========================================================================
    // LEVEL 8: Feed the cat please, he is hungry!
    // Drag fish treats box into the cat bowl!
    // ========================================================================
    {
      level: 8,
      title: "Feed the cat please, he is hungry!",
      hint: "Look at the shelf! Drag that delicious fish down to his empty food bowl!",
      explanation: "Tom enjoyed his meal! Look at those happy heart eyes!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div style="position:relative; width:100%; height:340px;">',
            // Shelf with fish treats
            '<div style="position:absolute; top:30px; right:30px; width:120px; height:12px; background:#92400e; border:2.5px solid #2d3748; border-radius:4px;"></div>',
            // Fish treat (draggable)
            '<div id="catFish" class="draggable-item" style="position:absolute; top:4px; right:60px; font-size:42px; cursor:grab;" title="Fish">🐟</div>',

            // Cat sitting on rug
            '<div id="catBody" style="position:absolute; bottom:30px; left:50px; text-align:center;">',
              '<div id="catFace" style="font-size:74px;">😾</div>',
              '<div style="width:100px; height:14px; background:#fbcfe8; border-radius:50%; border:2px solid #2d3748; margin-top:-8px;"></div>',
            '</div>',

            // Empty Bowl
            '<div id="catBowl" style="position:absolute; bottom:25px; left:165px; width:70px; height:34px; background:#38bdf8; border:3px solid #2d3748; border-radius:0 0 35px 35px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#fff;">',
              'FOOD',
            '</div>',
          '</div>'
        ].join('');

        var fish = document.getElementById('catFish');
        var bowl = document.getElementById('catBowl');
        var catFace = document.getElementById('catFace');

        makeDraggable(fish, {
          onEnd: function () {
            if (isOverlapping(fish, bowl)) {
              fish.style.display = 'none';
              catFace.textContent = '😻';
              bowl.textContent = '🐟';
              Sound.pop();
              setTimeout(function () {
                onSolve();
              }, 600);
            }
          }
        });
      }
    },

    // ========================================================================
    // LEVEL 9: Where is the green ball?
    // Drag blue ball onto yellow ball -> merges into green ball!
    // ========================================================================
    {
      level: 9,
      title: "Where is the green ball?",
      hint: "Remember your art classes: what happens when you mix Blue and Yellow?",
      explanation: "Blue + Yellow = Green! Color theory saves the day!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div style="position:relative; width:100%; height:340px; display:flex; align-items:center; justify-content:space-around;">',
            // Yellow Ball
            '<div id="ballYellow" style="position:absolute; left:60px; top:130px; width:80px; height:80px; border-radius:50%; background:#facc15; border:3.5px solid #2d3748; box-shadow:0 6px 0 #2d3748; display:grid; place-items:center;">',
              '<span style="font-size:24px;">🟡</span>',
            '</div>',
            // Blue Ball (Draggable)
            '<div id="ballBlue" class="draggable-item" style="position:absolute; right:60px; top:130px; width:80px; height:80px; border-radius:50%; background:#3b82f6; border:3.5px solid #2d3748; box-shadow:0 6px 0 #2d3748; display:grid; place-items:center;">',
              '<span style="font-size:24px;">🔵</span>',
            '</div>',
          '</div>'
        ].join('');

        var bYellow = document.getElementById('ballYellow');
        var bBlue = document.getElementById('ballBlue');

        makeDraggable(bBlue, {
          onEnd: function () {
            if (isOverlapping(bBlue, bYellow)) {
              bBlue.style.display = 'none';
              bYellow.style.background = '#22c55e';
              bYellow.innerHTML = '<span style="font-size:24px;">🟢</span>';
              bYellow.style.cursor = 'pointer';
              Sound.pop();
              bYellow.onclick = function () {
                onSolve();
              };
            }
          }
        });
      }
    },

    // ========================================================================
    // LEVEL 10: What is unusual in this picture?
    // Tap the hand with 6 fingers!
    // ========================================================================
    {
      level: 10,
      title: "What is unusual in this picture?",
      hint: "Inspect the boy's hands carefully. Count his fingers!",
      explanation: "He has 6 fingers on his right hand! Great eye!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div style="width:100%; display:flex; justify-content:center; align-items:center; height:340px;">',
            '<svg viewBox="0 0 200 240" width="200" height="240">',
              // Boy Body
              '<rect x="70" y="110" width="60" height="90" rx="12" fill="#3b82f6" stroke="#2d3748" stroke-width="4"/>',
              // Normal Left Hand (5 fingers)
              '<g id="normalHand" style="cursor:pointer;">',
                '<circle cx="35" cy="110" r="18" fill="#fde047" stroke="#2d3748" stroke-width="3.5"/>',
                '<line x1="28" y1="94" x2="28" y2="102" stroke="#2d3748" stroke-width="3"/>',
                '<line x1="34" y1="92" x2="34" y2="102" stroke="#2d3748" stroke-width="3"/>',
                '<line x1="40" y1="94" x2="40" y2="102" stroke="#2d3748" stroke-width="3"/>',
                '<line x1="46" y1="98" x2="46" y2="104" stroke="#2d3748" stroke-width="3"/>',
              '</g>',
              // Abnormal Right Hand (6 fingers!)
              '<g id="sixFingersHand" style="cursor:pointer;">',
                '<circle cx="165" cy="110" r="22" fill="#fde047" stroke="#2d3748" stroke-width="3.5"/>',
                '<line x1="150" y1="90" x2="150" y2="100" stroke="#2d3748" stroke-width="3.2"/>',
                '<line x1="156" y1="87" x2="156" y2="99" stroke="#2d3748" stroke-width="3.2"/>',
                '<line x1="162" y1="86" x2="162" y2="99" stroke="#2d3748" stroke-width="3.2"/>',
                '<line x1="168" y1="87" x2="168" y2="99" stroke="#2d3748" stroke-width="3.2"/>',
                '<line x1="174" y1="90" x2="174" y2="100" stroke="#2d3748" stroke-width="3.2"/>',
                '<line x1="180" y1="95" x2="178" y2="103" stroke="#2d3748" stroke-width="3.2"/>',
              '</g>',
              // Head
              '<circle cx="100" cy="70" r="35" fill="#fde047" stroke="#2d3748" stroke-width="4"/>',
              // Eyes & Smile
              '<circle cx="90" cy="65" r="4" fill="#2d3748"/>',
              '<circle cx="110" cy="65" r="4" fill="#2d3748"/>',
              '<path d="M92 78 Q100 88 108 78" stroke="#2d3748" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
              // Party Hat
              '<polygon points="100,10 80,45 120,45" fill="#ff6b35" stroke="#2d3748" stroke-width="3.5"/>',
            '</svg>',
          '</div>'
        ].join('');

        document.getElementById('sixFingersHand').onclick = function () {
          onSolve();
        };

        document.getElementById('normalHand').onclick = function (e) {
          onFail(e.clientX, e.clientY);
        };
      }
    },

    // ========================================================================
    // LEVEL 11: Turn it off! Too dangerous!
    // Pull the plug out of the wall outlet!
    // ========================================================================
    {
      level: 11,
      title: "Turn it off! Too dangerous!",
      hint: "Don't press the toaster! Pull the plug out from the wall socket!",
      explanation: "Pulling the plug stopped the electrical fire! Safe now!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div style="position:relative; width:100%; height:340px;">',
            // Toaster sparking
            '<div style="position:absolute; left:40px; top:120px; width:120px; height:100px;">',
              '<svg viewBox="0 0 120 100">',
                '<rect x="10" y="25" width="100" height="65" rx="14" fill="#cbd5e1" stroke="#2d3748" stroke-width="4"/>',
                '<rect x="25" y="10" width="70" height="20" rx="4" fill="#92400e" stroke="#2d3748" stroke-width="3"/>',
                '<circle cx="105" cy="55" r="5" fill="#ef4444"/>',
                '<!-- Sparks -->',
                '<text x="40" y="15" font-size="20">⚡</text>',
                '<text x="80" y="20" font-size="20">🔥</text>',
              '</svg>',
            '</div>',

            // Wall Socket on right
            '<div style="position:absolute; right:35px; top:140px; width:65px; height:85px; background:#ffffff; border:3px solid #2d3748; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;">',
              '<div style="width:12px; height:4px; background:#2d3748; border-radius:2px;"></div>',
              '<div style="width:12px; height:4px; background:#2d3748; border-radius:2px;"></div>',
            '</div>',

            // Power Cord & Plug (Draggable)
            '<div id="powerPlug" class="draggable-item" style="position:absolute; right:42px; top:152px; width:45px; height:45px; cursor:grab;" title="Drag Plug">',
              '<span style="font-size:32px;">🔌</span>',
            '</div>',
          '</div>'
        ].join('');

        var plug = document.getElementById('powerPlug');
        makeDraggable(plug, {
          onMove: function (el, x) {
            // If pulled left away from socket
            if (x < 170) {
              Sound.pop();
              onSolve();
            }
          }
        });
      }
    },

    // ========================================================================
    // LEVEL 12: Help Tom jump to the other side!
    // Drag the right cliff closer to the left cliff!
    // ========================================================================
    {
      level: 12,
      title: "Help Tom jump to the other side!",
      hint: "Can't jump that far? Drag the right cliff closer to close the gap!",
      explanation: "You brought the cliffs together so Tom could just walk across!",
      render: function (stage, onSolve, onFail) {
        stage.innerHTML = [
          '<div style="position:relative; width:100%; height:340px; overflow:hidden;">',
            // Left Cliff
            '<div style="position:absolute; left:0; bottom:0; width:110px; height:180px; background:#78350f; border:3px solid #2d3748; border-radius:0 16px 0 0;">',
              '<div style="height:25px; background:#22c55e; border-bottom:3px solid #2d3748;"></div>',
            '</div>',

            // Tom the Cat
            '<div id="cliffTom" style="position:absolute; left:35px; bottom:180px; font-size:48px; cursor:pointer;" title="Tom">',
              '🐱',
            '</div>',

            // Right Cliff (Draggable)
            '<div id="rightCliff" class="draggable-item" style="position:absolute; right:0; bottom:0; width:120px; height:180px; background:#78350f; border:3px solid #2d3748; border-radius:16px 0 0 0; cursor:grab;">',
              '<div style="height:25px; background:#22c55e; border-bottom:3px solid #2d3748;"></div>',
              '<div style="position:absolute; top:-40px; right:35px; font-size:36px;">🍗</div>',
            '</div>',
          '</div>'
        ].join('');

        var rightCliff = document.getElementById('rightCliff');
        var tom = document.getElementById('cliffTom');
        var gapClosed = false;

        makeDraggable(rightCliff, {
          constrainY: true,
          minY: 160,
          maxY: 160,
          onMove: function (el, x) {
            if (x < 140) {
              gapClosed = true;
            }
          }
        });

        tom.onclick = function (e) {
          if (gapClosed) {
            tom.style.transition = 'left 0.5s ease';
            tom.style.left = '160px';
            Sound.pop();
            setTimeout(function () {
              onSolve();
            }, 600);
          } else {
            onFail(e.clientX, e.clientY);
          }
        };
      }
    },

    // ========================================================================
    // LEVEL 13: Catch 5 falling red apples!
    // Slide the basket to catch 5 apples.
    // ========================================================================
    {
      level: 13,
      title: "Catch 5 falling red apples!",
      hint: "Tap the tree to make apples drop, then slide the basket to catch them!",
      explanation: "All 5 apples caught in the basket! Tasty apple pie incoming!",
      render: function (stage, onSolve, onFail) {
        var caught = 0;
        var gameRunning = true;

        stage.innerHTML = [
          '<div style="position:relative; width:100%; height:360px; overflow:hidden;">',
            // Tree Canopy at top
            '<div id="appleTree" style="position:absolute; top:10px; left:50%; transform:translateX(-50%); width:260px; height:100px; background:#22c55e; border:3.5px solid #2d3748; border-radius:50px; display:flex; align-items:center; justify-content:center; gap:16px; font-size:28px; cursor:pointer;">',
              '🍎 🍎 🍎 🍎 🍎',
            '</div>',

            // Basket (draggable left/right)
            '<div id="appleBasket" class="draggable-item" style="position:absolute; bottom:15px; left:120px; width:70px; height:50px; background:#d97706; border:3px solid #2d3748; border-radius:0 0 20px 20px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:13px;">',
              '🧺 <span id="catchCount">0/5</span>',
            '</div>',
          '</div>'
        ].join('');

        var basket = document.getElementById('appleBasket');
        var catchCount = document.getElementById('catchCount');

        makeDraggable(basket, {
          constrainY: true,
          minY: 295,
          maxY: 295
        });

        // Spawn falling apple loop
        function spawnApple() {
          if (!gameRunning) return;
          var apple = document.createElement('div');
          apple.textContent = '🍎';
          apple.style.position = 'absolute';
          apple.style.fontSize = '32px';
          apple.style.top = '110px';
          apple.style.left = (40 + Math.random() * 200) + 'px';
          apple.style.pointerEvents = 'none';
          stage.firstChild.appendChild(apple);

          var topY = 110;
          var fallSpeed = 3 + Math.random() * 2;
          var anim = setInterval(function () {
            if (!gameRunning) {
              clearInterval(anim);
              if (apple.parentNode) apple.parentNode.removeChild(apple);
              return;
            }
            topY += fallSpeed;
            apple.style.top = topY + 'px';

            if (isOverlapping(apple, basket)) {
              clearInterval(anim);
              if (apple.parentNode) apple.parentNode.removeChild(apple);
              caught++;
              Sound.pop();
              catchCount.textContent = caught + '/5';
              if (caught >= 5) {
                gameRunning = false;
                onSolve();
              }
            } else if (topY > 360) {
              clearInterval(anim);
              if (apple.parentNode) apple.parentNode.removeChild(apple);
            }
          }, 20);
        }

        var spawnInterval = setInterval(spawnApple, 1100);
        spawnApple();

        // Cleanup on level leave
        stage._cleanup = function () {
          gameRunning = false;
          clearInterval(spawnInterval);
        };
      }
    },

    // ========================================================================
    // LEVEL 14: 4 + 5 × 5 – 2 = ?
    // PEMDAS order: 5*5=25, 4+25=29, 29-2=27
    // ========================================================================
    {
      level: 14,
      title: "4 + 5 × 5 – 2 = ?",
      hint: "Remember the order of operations (PEMDAS): multiplication comes before addition and subtraction!",
      explanation: "5 × 5 = 25. Then 4 + 25 = 29. Finally 29 – 2 = 27!",
      render: function (stage, onSolve, onFail) {
        var inputVal = '';

        stage.innerHTML = [
          '<div style="width:100%; display:flex; flex-direction:column; align-items:center; gap:20px;">',
            // Chalkboard Equation
            '<div style="background:#1e293b; border:4px solid #78350f; border-radius:18px; padding:18px 24px; box-shadow:0 6px 0 #2d3748;">',
              '<span style="color:#ffffff; font-size:26px; font-weight:700; letter-spacing:1px;">4 + 5 × 5 – 2 = <span id="mathDisplay" style="color:#facc15;">?</span></span>',
            '</div>',

            // Keypad
            '<div class="keypad-container">',
              '<div class="keypad-grid">',
                '<button class="keypad-btn" data-key="1">1</button>',
                '<button class="keypad-btn" data-key="2">2</button>',
                '<button class="keypad-btn" data-key="3">3</button>',
                '<button class="keypad-btn" data-key="4">4</button>',
                '<button class="keypad-btn" data-key="5">5</button>',
                '<button class="keypad-btn" data-key="6">6</button>',
                '<button class="keypad-btn" data-key="7">7</button>',
                '<button class="keypad-btn" data-key="8">8</button>',
                '<button class="keypad-btn" data-key="9">9</button>',
                '<button class="keypad-btn btn-clear-key" id="btnMathClear">C</button>',
                '<button class="keypad-btn" data-key="0">0</button>',
                '<button class="keypad-btn btn-submit-key" id="btnMathSubmit">OK</button>',
              '</div>',
            '</div>',
          '</div>'
        ].join('');

        var display = document.getElementById('mathDisplay');
        stage.querySelectorAll('.keypad-btn[data-key]').forEach(function (btn) {
          btn.onclick = function () {
            Sound.tap();
            if (inputVal.length < 3) {
              inputVal += btn.dataset.key;
              display.textContent = inputVal;
            }
          };
        });

        document.getElementById('btnMathClear').onclick = function () {
          Sound.tap();
          inputVal = '';
          display.textContent = '?';
        };

        document.getElementById('btnMathSubmit').onclick = function (e) {
          if (inputVal === '27') {
            onSolve();
          } else {
            onFail(e.clientX, e.clientY);
            inputVal = '';
            display.textContent = '?';
          }
        };
      }
    },

    // ========================================================================
    // LEVEL 15: Don't tap the red button!
    // Resist touching for 3 seconds to win!
    // ========================================================================
    {
      level: 15,
      title: "DO NOT tap the red button!",
      hint: "It literally says: do NOT tap the button! Just wait!",
      explanation: "You had the patience to resist! True master of self control!",
      render: function (stage, onSolve, onFail) {
        var timerSeconds = 3;
        var interval = null;

        stage.innerHTML = [
          '<div style="width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; height:340px; gap:20px;">',
            '<div style="font-size:18px; font-weight:700; color:#64748b;" id="resistTimer">Waiting... 3s</div>',
            // Big tempting red button
            '<button id="bigRedBtn" class="btn-bubble" style="width:130px; height:130px; border-radius:50%; background:#ef4444; border:5px solid #2d3748; font-size:42px; box-shadow:0 8px 0 #b91c1c, 0 12px 28px rgba(239, 68, 68, 0.4); color:#fff;">',
              '🔴',
            '</button>',
            '<div style="font-size:14px; font-weight:700; color:#ef4444;">⚠️ DO NOT PRESS ⚠️</div>',
          '</div>'
        ].join('');

        var btn = document.getElementById('bigRedBtn');
        var timerDisplay = document.getElementById('resistTimer');

        btn.onclick = function (e) {
          Sound.wrong();
          onFail(e.clientX, e.clientY);
          timerSeconds = 3;
          timerDisplay.textContent = 'Oops! Resetting to 3s...';
        };

        interval = setInterval(function () {
          timerSeconds--;
          if (timerSeconds > 0) {
            timerDisplay.textContent = 'Waiting... ' + timerSeconds + 's';
          } else {
            clearInterval(interval);
            timerDisplay.textContent = 'Good job! 🎉';
            onSolve();
          }
        }, 1000);

        stage._cleanup = function () {
          clearInterval(interval);
        };
      }
    }

  ];

  // ==========================================================================
  // GAME STATE & MANAGER
  // ==========================================================================
  var STORAGE_KEY = 'ciel_braintest_save_v1';
  var state = {
    unlockedLevels: 1,
    levelStars: {}
  };

  function loadState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = JSON.parse(saved);
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  loadState();

  var currentLevelIdx = 0;
  var currentPuzzle = null;

  // DOM Elements
  var screenMenu = document.getElementById('screenMenu');
  var screenLevels = document.getElementById('screenLevels');
  var screenGame = document.getElementById('screenGame');

  var levelTitle = document.getElementById('levelTitle');
  var questionBox = document.getElementById('questionBox');
  var puzzleStage = document.getElementById('puzzleStage');
  var wrongBadge = document.getElementById('wrongBadge');

  var modalHint = document.getElementById('modalHint');
  var hintText = document.getElementById('hintText');
  var btnCloseHint = document.getElementById('btnCloseHint');

  var modalWin = document.getElementById('modalWin');
  var winExplanation = document.getElementById('winExplanation');
  var btnNextLevel = document.getElementById('btnNextLevel');
  var btnReplay = document.getElementById('btnReplay');

  var modalHelp = document.getElementById('modalHelp');
  var btnCloseHelp = document.getElementById('btnCloseHelp');

  var levelGrid = document.getElementById('levelGrid');
  var menuProgressText = document.getElementById('menuProgressText');
  var menuProgFill = document.getElementById('menuProgFill');

  // Navigation
  function showScreen(screen) {
    [screenMenu, screenLevels, screenGame].forEach(function (s) {
      s.classList.remove('active');
    });
    screen.classList.add('active');
  }

  function updateMenuProgress() {
    var maxLvl = PUZZLES.length;
    var unlocked = Math.min(state.unlockedLevels, maxLvl);
    menuProgressText.textContent = 'Level ' + unlocked + ' of ' + maxLvl;
    menuProgFill.style.width = ((unlocked / maxLvl) * 100) + '%';
  }

  function renderLevelGrid() {
    levelGrid.innerHTML = '';
    PUZZLES.forEach(function (p, i) {
      var card = document.createElement('button');
      var isCompleted = i + 1 < state.unlockedLevels;
      var isCurrent = i + 1 === state.unlockedLevels;
      var isLocked = i + 1 > state.unlockedLevels;

      card.className = 'lvl-card' + (isCompleted ? ' completed' : isCurrent ? ' current' : ' locked');

      if (isLocked) {
        card.innerHTML = '🔒';
        card.disabled = true;
      } else {
        var stars = state.levelStars[p.level] || 3;
        card.innerHTML = [
          '<span>' + p.level + '</span>',
          isCompleted ? '<span class="lvl-stars">' + '⭐'.repeat(stars) + '</span>' : ''
        ].join('');

        card.onclick = function () {
          Sound.tap();
          loadLevel(i);
          showScreen(screenGame);
        };
      }
      levelGrid.appendChild(card);
    });
  }

  // Wrong Tap Feedback animation
  function showWrongFeedback(clientX, clientY) {
    Sound.wrong();
    if (!clientX || !clientY) return;

    var frame = document.getElementById('gameFrame').getBoundingClientRect();
    var x = clientX - frame.left;
    var y = clientY - frame.top;

    wrongBadge.style.left = x + 'px';
    wrongBadge.style.top = y + 'px';
    wrongBadge.classList.remove('hidden');

    // Retrigger animation
    wrongBadge.style.animation = 'none';
    void wrongBadge.offsetWidth;
    wrongBadge.style.animation = 'wrongPop 0.45s ease-out forwards';

    setTimeout(function () {
      wrongBadge.classList.add('hidden');
    }, 450);
  }

  // Load a Puzzle Level
  function loadLevel(idx) {
    if (idx < 0) idx = 0;
    if (idx >= PUZZLES.length) idx = 0;

    currentLevelIdx = idx;
    currentPuzzle = PUZZLES[idx];

    // Cleanup previous level if needed
    if (puzzleStage._cleanup) {
      puzzleStage._cleanup();
      puzzleStage._cleanup = null;
    }

    // Hide modals
    modalHint.classList.add('hidden');
    modalWin.classList.add('hidden');

    // Update Header & Prompt
    levelTitle.textContent = 'Level ' + currentPuzzle.level;
    questionBox.textContent = currentPuzzle.title;

    // Render Stage
    puzzleStage.innerHTML = '';
    currentPuzzle.render(puzzleStage, handleLevelSolved, showWrongFeedback);
  }

  // Win Level Handler
  function handleLevelSolved() {
    Sound.correct();
    Confetti.launch(70);

    // Update save state
    if (currentPuzzle.level >= state.unlockedLevels) {
      state.unlockedLevels = currentPuzzle.level + 1;
    }
    state.levelStars[currentPuzzle.level] = 3;
    saveState();
    updateMenuProgress();

    // Show Win Modal
    winExplanation.textContent = currentPuzzle.explanation;
    modalWin.classList.remove('hidden');
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  // Menu Buttons
  document.getElementById('btnPlay').onclick = function () {
    Sound.tap();
    loadLevel(state.unlockedLevels - 1);
    showScreen(screenGame);
  };

  document.getElementById('btnLevelSelect').onclick = function () {
    Sound.tap();
    renderLevelGrid();
    showScreen(screenLevels);
  };

  document.getElementById('btnMenuHelp').onclick = function () {
    Sound.tap();
    modalHelp.classList.remove('hidden');
  };

  document.getElementById('btnCloseHelp').onclick = function () {
    Sound.tap();
    modalHelp.classList.add('hidden');
  };

  document.getElementById('btnMenuExit').onclick = function () {
    Sound.tap();
    if (confirm('Exit Brain Test? Your progress is saved!')) {
      try { window.parent.postMessage({ action: 'exit_game' }, '*'); } catch (e) {}
      try { window.history.back(); } catch (e) {}
      setTimeout(function () { window.close(); }, 300);
    }
  };

  // Levels Back Button
  document.getElementById('btnLevelsBack').onclick = function () {
    Sound.tap();
    showScreen(screenMenu);
    updateMenuProgress();
  };

  // Gameplay Header Buttons
  document.getElementById('btnGameBack').onclick = function () {
    Sound.tap();
    if (puzzleStage._cleanup) {
      puzzleStage._cleanup();
      puzzleStage._cleanup = null;
    }
    showScreen(screenMenu);
    updateMenuProgress();
  };

  document.getElementById('btnResetLevel').onclick = function () {
    Sound.tap();
    loadLevel(currentLevelIdx);
  };

  document.getElementById('btnSoundToggle').onclick = function () {
    var on = Sound.toggle();
    document.getElementById('soundIcon').textContent = on ? '🔊' : '🔇';
    Sound.tap();
  };

  document.getElementById('btnHint').onclick = function () {
    Sound.tap();
    if (currentPuzzle) {
      hintText.textContent = currentPuzzle.hint;
      modalHint.classList.remove('hidden');
    }
  };

  document.getElementById('btnCloseHint').onclick = function () {
    Sound.tap();
    modalHint.classList.add('hidden');
  };

  // Win Modal Actions
  btnNextLevel.onclick = function () {
    Sound.tap();
    if (currentLevelIdx + 1 < PUZZLES.length) {
      loadLevel(currentLevelIdx + 1);
    } else {
      // Completed all levels!
      modalWin.classList.add('hidden');
      renderLevelGrid();
      showScreen(screenLevels);
    }
  };

  btnReplay.onclick = function () {
    Sound.tap();
    loadLevel(currentLevelIdx);
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  updateMenuProgress();
  showScreen(screenMenu);

})();
