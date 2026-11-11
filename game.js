// =============================================
// BRAIN TEST — TRICKY PUZZLES  |  game.js
// =============================================

'use strict';

// ---- STATE ----
const TOTAL = 25;
const SAVE_KEY = 'braintest_v1';
let state = { progress: 0, stars: {} };
let currentLevel = 0;
let hintUsed = false;

function loadState() {
  try { state = JSON.parse(localStorage.getItem(SAVE_KEY)) || { progress: 0, stars: {} }; }
  catch(e) { state = { progress: 0, stars: {} }; }
}
function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {}
}

// ---- DOM ----
const $ = id => document.getElementById(id);
const dom = {
  screenMenu: $('screenMenu'), screenLevels: $('screenLevels'), screenGame: $('screenGame'),
  menuProgressText: $('menuProgressText'), menuProgFill: $('menuProgFill'),
  levelGrid: $('levelGrid'), levelBadge: $('levelBadge'),
  questionBox: $('questionBox'), puzzleArea: $('puzzleArea'),
  hintBubble: $('hintBubble'),
  winOverlay: $('winOverlay'), winEmoji: $('winEmoji'), winTitle: $('winTitle'), starsRow: $('starsRow'),
  btnPlay: $('btnPlay'), btnLevelSelect: $('btnLevelSelect'), btnMenuHelp: $('btnMenuHelp'), btnMenuExit: $('btnMenuExit'),
  btnLevelsBack: $('btnLevelsBack'), btnGameBack: $('btnGameBack'),
  btnHint: $('btnHint'), btnNext: $('btnNext'), btnReplay: $('btnReplay'),
  modalHelp: $('modalHelp'), btnHelpClose: $('btnHelpClose'),
  confettiLayer: $('confettiLayer'),
};

// ---- SCREENS ----
function showScreen(name) {
  ['screenMenu','screenLevels','screenGame'].forEach(id => {
    $(id).classList.toggle('active', id === name);
  });
}

// ---- MENU ----
function updateMenuProgress() {
  const p = state.progress;
  dom.menuProgressText.textContent = `${p} / ${TOTAL} Solved`;
  dom.menuProgFill.style.width = `${(p / TOTAL) * 100}%`;
}

// ---- LEVEL GRID ----
function buildLevelGrid() {
  dom.levelGrid.innerHTML = '';
  for (let i = 0; i < TOTAL; i++) {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    const solved = i < state.progress;
    const current = i === state.progress;
    const locked = i > state.progress;
    btn.classList.add(solved ? 'solved' : current ? 'current' : 'locked');
    const stars = state.stars[i] || 0;
    btn.innerHTML = `<span>${i + 1}</span><span class="level-stars">${'⭐'.repeat(stars)}</span>`;
    btn.disabled = locked;
    btn.onclick = () => { startLevel(i); showScreen('screenGame'); };
    dom.levelGrid.appendChild(btn);
  }
}

// ---- CONFETTI ----
const CONFETTI_COLORS = ['#ff6b35','#4ecdc4','#ffe66d','#a855f7','#22c55e','#f43f5e','#38bdf8'];
function fireConfetti(count = 60) {
  dom.confettiLayer.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `
      left:${Math.random()*100}%;
      background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};
      --dur:${1.5 + Math.random()*1.5}s;
      --delay:${Math.random()*0.6}s;
      transform: rotate(${Math.random()*360}deg);
      width:${8 + Math.random()*8}px; height:${10 + Math.random()*10}px;
    `;
    dom.confettiLayer.appendChild(p);
  }
  setTimeout(() => dom.confettiLayer.innerHTML = '', 3500);
}

// ---- WIN ----
const WIN_MSGS = ['Brilliant!','Amazing!','Genius!','Outstanding!','Impressive!','Mind-Blowing!'];
function triggerWin(starCount = 3) {
  if (currentLevel >= state.progress) {
    state.progress = currentLevel + 1;
    state.stars[currentLevel] = Math.max(state.stars[currentLevel] || 0, starCount);
    saveState();
  }
  fireConfetti(80);
  dom.winEmoji.textContent = starCount === 3 ? '🎉' : starCount === 2 ? '🥳' : '😊';
  dom.winTitle.textContent = WIN_MSGS[Math.floor(Math.random() * WIN_MSGS.length)];
  dom.starsRow.textContent = '⭐'.repeat(starCount) + '☆'.repeat(3 - starCount);
  dom.winOverlay.classList.remove('hidden');
  dom.btnNext.style.display = currentLevel < TOTAL - 1 ? '' : 'none';
  updateMenuProgress();
}

// ---- HINT ----
function showHint(text) {
  dom.hintBubble.textContent = text;
  dom.hintBubble.classList.remove('hidden');
  clearTimeout(dom.hintBubble._t);
  dom.hintBubble._t = setTimeout(() => dom.hintBubble.classList.add('hidden'), 3500);
}

// ---- DRAG HELPER ----
function makeDraggable(el, onMove, onDrop) {
  let sx, sy, ox, oy, dragging = false;
  function start(e) {
    e.preventDefault();
    dragging = true;
    const pt = e.touches ? e.touches[0] : e;
    sx = pt.clientX; sy = pt.clientY;
    ox = el.offsetLeft; oy = el.offsetTop;
    el.style.zIndex = 100;
    el.style.transition = 'none';
  }
  function move(e) {
    if (!dragging) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - sx, dy = pt.clientY - sy;
    el.style.left = (ox + dx) + 'px';
    el.style.top = (oy + dy) + 'px';
    if (onMove) onMove(pt.clientX, pt.clientY);
  }
  function end(e) {
    if (!dragging) return;
    dragging = false;
    el.style.zIndex = '';
    el.style.transition = '';
    const pt = e.changedTouches ? e.changedTouches[0] : e;
    if (onDrop) onDrop(pt.clientX, pt.clientY);
  }
  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart', start, { passive: false });
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('mouseup', end);
  window.addEventListener('touchend', end);
}

function hits(el, x, y) {
  const r = el.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

// =============================================
// PUZZLE DEFINITIONS
// =============================================

const PUZZLES = [

  // ---- 1: 1+2+3 ----
  {
    question: 'What is 1+2+3?',
    hint: 'Look at the question itself... the answer is there!',
    render(area) {
      area.innerHTML = `
        <div class="answer-grid">
          <button class="answer-btn" data-v="5">5</button>
          <button class="answer-btn" data-v="7">7</button>
          <button class="answer-btn" data-v="9">9</button>
          <button class="answer-btn" data-v="6wrong">6</button>
        </div>
        <p style="font-size:12px;color:#9ca3af;margin-top:8px;text-align:center;">Select the answer</p>
      `;
      // The real answer is to drag "6" from the question text
      // But for simplicity the question text has a "6" that is clickable
      dom.questionBox.innerHTML = `What is 1+2+<span id="q6" style="color:#ff6b35;font-size:28px;font-weight:900;cursor:pointer;text-decoration:underline wavy var(--primary);">6</span>-1?`;
      $('q6').onclick = () => triggerWin(3);

      area.querySelectorAll('.answer-btn').forEach(btn => {
        btn.onclick = () => {
          btn.classList.add('wrong');
          setTimeout(() => btn.classList.remove('wrong'), 500);
        };
      });
    }
  },

  // ---- 2: Find the cat ----
  {
    question: 'Find the cat! 🐱',
    hint: 'The cat might be hiding somewhere unexpected... try behind the bush!',
    render(area) {
      area.innerHTML = `
        <div style="position:relative;width:280px;height:220px;">
          <svg width="280" height="220" viewBox="0 0 280 220">
            <!-- Sky -->
            <rect width="280" height="220" fill="#c8f4fc" rx="16"/>
            <!-- Ground -->
            <rect y="160" width="280" height="60" fill="#86efac" rx="0"/>
            <!-- Sun -->
            <circle cx="240" cy="40" r="28" fill="#ffe66d"/>
            <!-- Tree -->
            <rect x="60" y="90" width="14" height="70" fill="#92400e"/>
            <ellipse cx="67" cy="80" rx="30" ry="30" fill="#22c55e"/>
            <!-- House -->
            <rect x="160" y="120" width="80" height="60" fill="#fca5a5"/>
            <polygon points="160,120 240,120 200,85" fill="#ef4444"/>
            <rect x="188" y="148" width="24" height="32" fill="#92400e"/>
            <!-- Bush (hiding cat) -->
            <ellipse cx="130" cy="165" rx="45" ry="30" fill="#16a34a"/>
            <ellipse cx="110" cy="168" rx="30" ry="22" fill="#15803d"/>
            <ellipse cx="150" cy="168" rx="32" ry="22" fill="#15803d"/>
            <!-- Cat (hidden, clickable) -->
          </svg>
          <!-- Cat behind bush -->
          <div id="hiddenCat" style="position:absolute;bottom:28px;left:95px;font-size:30px;cursor:pointer;opacity:0;transition:opacity 0.3s" title="🐱">🐱</div>
          <!-- Bush overlay -->
          <div id="bushOverlay" style="position:absolute;bottom:14px;left:68px;width:120px;height:60px;cursor:pointer;border-radius:50%;background:transparent"></div>
        </div>
      `;
      let tapCount = 0;
      $('bushOverlay').onclick = () => {
        tapCount++;
        if (tapCount === 1) {
          $('hiddenCat').style.opacity = '0.3';
          dom.hintBubble.textContent = 'Something is there! Tap again!';
          dom.hintBubble.classList.remove('hidden');
        }
        if (tapCount >= 3) {
          $('hiddenCat').style.opacity = '1';
          setTimeout(() => triggerWin(3), 400);
        }
      };
    }
  },

  // ---- 3: Which is biggest? ----
  {
    question: 'Which one is the biggest?',
    hint: 'Read the labels — not just what you see!',
    render(area) {
      area.innerHTML = `
        <div style="display:flex;gap:16px;align-items:flex-end;justify-content:center;flex-wrap:wrap">
          <div id="optSmall" style="text-align:center;cursor:pointer">
            <div style="width:40px;height:40px;background:#fca5a5;border-radius:50%;margin:0 auto 6px;"></div>
            <span style="font-size:14px;font-weight:800">small</span>
          </div>
          <div id="optBig" style="text-align:center;cursor:pointer">
            <div style="width:80px;height:80px;background:#93c5fd;border-radius:50%;margin:0 auto 6px;"></div>
            <span style="font-size:14px;font-weight:800">medium</span>
          </div>
          <div id="optBiggest" style="text-align:center;cursor:pointer">
            <div style="width:60px;height:60px;background:#86efac;border-radius:50%;margin:0 auto 6px;"></div>
            <span id="biggestLabel" style="font-size:28px;font-weight:900;color:#ff6b35">BIGGEST</span>
          </div>
        </div>
      `;
      $('optBiggest').onclick = () => triggerWin(3);
      $('optSmall').onclick = $('optBig').onclick = () => {
        area.style.animation = 'shake 0.4s';
        setTimeout(() => area.style.animation = '', 400);
      };
    }
  },

  // ---- 4: Hatch the chick ----
  {
    question: 'Help the chick hatch! 🐣',
    hint: 'Tap the egg... many times!',
    render(area) {
      let taps = 0;
      area.innerHTML = `
        <div id="eggWrap" style="text-align:center;cursor:pointer;user-select:none">
          <div id="eggEmoji" style="font-size:90px;display:block;transition:transform 0.1s">🥚</div>
          <div id="eggProgress" style="margin-top:12px;font-size:14px;font-weight:800;color:#9ca3af">Tap the egg!</div>
          <div style="margin-top:8px;width:200px;height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-inline:auto">
            <div id="eggBar" style="height:100%;width:0%;background:linear-gradient(90deg,#ffe66d,#ff6b35);border-radius:999px;transition:width 0.2s"></div>
          </div>
        </div>
      `;
      const emojis = ['🥚','🥚','🥚','🐣','🐣','🐥'];
      $('eggWrap').onclick = () => {
        taps++;
        $('eggEmoji').style.transform = 'scale(0.85) rotate(-5deg)';
        setTimeout(() => $('eggEmoji').style.transform = '', 100);
        $('eggBar').style.width = `${Math.min(taps * 10, 100)}%`;
        $('eggProgress').textContent = taps < 5 ? `Tap more! (${taps}/10)` : taps < 8 ? 'Almost there...' : 'Keep going!';
        if (taps >= 3) $('eggEmoji').textContent = '🐣';
        if (taps >= 10) { $('eggEmoji').textContent = '🐥'; setTimeout(() => triggerWin(3), 500); }
      };
    }
  },

  // ---- 5: Put numbers in order ----
  {
    question: 'Put the numbers in order: smallest first!',
    hint: 'Tap the numbers from smallest to largest.',
    render(area) {
      const nums = [3, 1, 5, 2, 4];
      let next = 1;
      area.innerHTML = `<div class="number-slots" id="numRow"></div>
        <p style="font-size:13px;color:#9ca3af;margin-top:10px">Tap them in order!</p>`;
      nums.forEach(n => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.style.cssText = 'width:52px;height:52px;font-size:22px;padding:0;border-radius:14px';
        btn.textContent = n;
        btn.onclick = () => {
          if (n === next) {
            btn.classList.add('correct');
            btn.style.background = '#f0fdf4';
            btn.disabled = true;
            next++;
            if (next > 5) setTimeout(() => triggerWin(3), 400);
          } else {
            btn.classList.add('wrong');
            setTimeout(() => btn.classList.remove('wrong'), 400);
          }
        };
        $('numRow').appendChild(btn);
      });
    }
  },

  // ---- 6: What comes after 999? ----
  {
    question: 'What number comes after 999?',
    hint: 'Count one more from 999...',
    render(area) {
      area.innerHTML = `
        <input class="puzzle-input" id="numInput" type="number" placeholder="Your answer" inputmode="numeric">
        <button class="puzzle-submit" id="numSubmit">Check ✓</button>
      `;
      $('numSubmit').onclick = () => {
        if ($('numInput').value.trim() === '1000') {
          triggerWin(3);
        } else {
          $('numInput').style.borderColor = '#ef4444';
          setTimeout(() => $('numInput').style.borderColor = '', 500);
        }
      };
      $('numInput').onkeydown = e => { if (e.key === 'Enter') $('numSubmit').click(); };
    }
  },

  // ---- 7: Find the mistake ----
  {
    question: 'Find the mistake in this sentence:',
    hint: 'Look at the question itself, not the numbers below!',
    render(area) {
      dom.questionBox.innerHTML = `Find the mistake in <span id="mistakeWord" style="color:#ff6b35;cursor:pointer;text-decoration:underline wavy orange">this</span> sentence:`;
      area.innerHTML = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<div style="width:40px;height:40px;background:#f3f4f6;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;cursor:pointer" onclick="this.style.background='#fef2f2';this.style.color='#ef4444'">${n}</div>`).join('')}
        </div>
        <p style="font-size:13px;color:#9ca3af;margin-top:12px">The numbers look fine... look elsewhere!</p>
      `;
      $('mistakeWord').onclick = () => triggerWin(3);
    }
  },

  // ---- 8: Turn off the lights ----
  {
    question: 'Turn OFF all the lights! 💡',
    hint: 'Clicking a switch also toggles its neighbors!',
    render(area) {
      let lights = [true, false, true]; // on/off/on
      function render() {
        area.innerHTML = `<div class="light-grid" id="lightGrid"></div>`;
        lights.forEach((on, i) => {
          const sw = document.createElement('div');
          sw.className = 'light-switch';
          sw.innerHTML = `
            <span class="bulb ${on?'on':'off'}">${on?'💡':'🔌'}</span>
            <div class="switch-lever ${on?'on':''}"></div>
          `;
          sw.onclick = () => {
            lights[i] = !lights[i];
            if (i > 0) lights[i-1] = !lights[i-1];
            if (i < lights.length-1) lights[i+1] = !lights[i+1];
            render();
            if (lights.every(l => !l)) setTimeout(() => triggerWin(3), 300);
          };
          $('lightGrid').appendChild(sw);
        });
      }
      render();
    }
  },

  // ---- 9: Save the man from shark ----
  {
    question: 'Save the man from the shark! 🦈',
    hint: 'Drag the man UP — out of the water!',
    render(area) {
      area.innerHTML = `
        <div style="position:relative;width:280px;height:220px;background:linear-gradient(180deg,#c8f4fc 50%,#0ea5e9 50%);border-radius:16px;overflow:visible">
          <svg width="280" height="220" style="position:absolute;top:0;left:0">
            <!-- Waves -->
            <path d="M0,110 Q35,95 70,110 Q105,125 140,110 Q175,95 210,110 Q245,125 280,110 L280,220 L0,220 Z" fill="#0ea5e9"/>
            <!-- Shark fin -->
            <polygon id="sharkFin" points="180,100 200,130 160,130" fill="#374151"/>
          </svg>
          <!-- Man (draggable) -->
          <div id="manEmoji" class="draggable" style="position:absolute;top:70px;left:110px;font-size:40px;cursor:grab;user-select:none">🧑</div>
        </div>
      `;
      const man = $('manEmoji');
      let startY;
      makeDraggable(man, null, (cx, cy) => {
        const area = dom.puzzleArea.getBoundingClientRect();
        const relY = cy - area.top;
        if (relY < area.height * 0.4) triggerWin(3);
      });
    }
  },

  // ---- 10: Which cup fills first? ----
  {
    question: 'Which cup will fill up first? 🥤',
    hint: 'Follow the water path — some pipes are blocked!',
    render(area) {
      area.innerHTML = `
        <svg width="280" height="200" viewBox="0 0 280 200">
          <!-- Source -->
          <rect x="120" y="10" width="40" height="20" fill="#93c5fd" rx="4"/>
          <rect x="138" y="30" width="4" height="30" fill="#93c5fd"/>
          <!-- Split -->
          <rect x="80" y="60" width="122" height="4" fill="#93c5fd"/>
          <!-- Left pipe -->
          <rect x="80" y="60" width="4" height="50" fill="#93c5fd"/>
          <!-- RIGHT pipe BLOCKED -->
          <rect x="198" y="60" width="4" height="30" fill="#93c5fd"/>
          <rect x="188" y="82" width="24" height="8" fill="#ef4444" rx="3"/>
          <text x="182" y="78" font-size="10" fill="#ef4444" font-weight="bold">BLOCKED</text>
          <!-- Cups -->
          <path d="M55,120 L50,180 L110,180 L105,120 Z" fill="none" stroke="#6b7280" stroke-width="3"/>
          <text x="75" y="200" font-size="12" text-anchor="middle" fill="#374151" font-weight="bold">A</text>
          <path d="M170,120 L165,180 L225,180 L220,120 Z" fill="none" stroke="#6b7280" stroke-width="3"/>
          <text x="195" y="200" font-size="12" text-anchor="middle" fill="#374151" font-weight="bold">B</text>
        </svg>
        <div class="answer-grid" style="max-width:220px">
          <button class="answer-btn" id="cupA">Cup A</button>
          <button class="answer-btn" id="cupB">Cup B</button>
        </div>
      `;
      $('cupA').onclick = () => triggerWin(3);
      $('cupB').onclick = () => {
        $('cupB').classList.add('wrong');
        setTimeout(() => $('cupB').classList.remove('wrong'), 500);
      };
    }
  },

  // ---- 11: How many holes in the shirt? ----
  {
    question: 'How many holes does this shirt have? 👕',
    hint: 'Don\'t forget the neck, waist, and arm holes!',
    render(area) {
      area.innerHTML = `
        <svg width="200" height="200" viewBox="0 0 200 200">
          <path d="M60,20 L30,60 L60,70 L60,180 L140,180 L140,70 L170,60 L140,20 Q110,35 100,35 Q90,35 60,20 Z" fill="#93c5fd" stroke="#3b82f6" stroke-width="3"/>
          <!-- Hole in body -->
          <ellipse cx="100" cy="120" rx="18" ry="12" fill="#fff" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4"/>
        </svg>
        <div class="answer-grid" style="max-width:280px">
          ${[2,4,6,8].map(n=>`<button class="answer-btn" data-n="${n}">${n} holes</button>`).join('')}
        </div>
      `;
      area.querySelectorAll('.answer-btn').forEach(btn => {
        btn.onclick = () => {
          if (btn.dataset.n === '8') { // neck(1)+waist(1)+2arms(2)+2 body holes = actually easier: collar, waist, 2 sleeves, 1 visible hole = 5... but answer is 8 (front+back of each = 8)
            triggerWin(3);
          } else {
            btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 400);
          }
        };
      });
    }
  },

  // ---- 12: What's heavier? ----
  {
    question: 'What\'s heavier: 1 kg of iron or 1 kg of feathers?',
    hint: 'They both weigh exactly the same amount!',
    render(area) {
      area.innerHTML = `
        <div style="display:flex;gap:60px;justify-content:center;align-items:center;font-size:50px">
          <span>⚙️</span>
          <span>🪶</span>
        </div>
        <div class="answer-grid" style="max-width:280px;margin-top:16px">
          <button class="answer-btn">Iron ⚙️</button>
          <button class="answer-btn">Feathers 🪶</button>
          <button class="answer-btn" id="btnEqual" style="grid-column:span 2">They're Equal! ⚖️</button>
        </div>
      `;
      $('btnEqual').onclick = () => triggerWin(3);
      area.querySelectorAll('.answer-btn:not(#btnEqual)').forEach(btn => {
        btn.onclick = () => { btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 400); };
      });
    }
  },

  // ---- 13: Move the cloud to water the flower ----
  {
    question: 'Water the flower! 🌸',
    hint: 'Drag the cloud over the flower!',
    render(area) {
      area.innerHTML = `
        <div id="gardenArea" style="position:relative;width:280px;height:220px;background:linear-gradient(180deg,#bfdbfe 60%,#86efac 60%);border-radius:16px;overflow:hidden">
          <div id="cloudDrag" class="draggable" style="position:absolute;top:20px;left:10px;font-size:52px;cursor:grab;user-select:none">☁️</div>
          <div id="flowerEl" style="position:absolute;bottom:8px;left:120px;font-size:48px">🥀</div>
          <div id="rainEl" style="position:absolute;display:none;font-size:20px">🌧️</div>
        </div>
      `;
      const cloud = $('cloudDrag');
      makeDraggable(cloud, null, (cx, cy) => {
        const flower = $('flowerEl').getBoundingClientRect();
        if (hits($('flowerEl'), cx, cy + 60) || Math.abs(cx - (flower.left + flower.width/2)) < 60) {
          $('flowerEl').textContent = '🌸';
          setTimeout(() => triggerWin(3), 500);
        }
      });
    }
  },

  // ---- 14: Park the car ----
  {
    question: 'Park the car in the empty space! 🚗',
    hint: 'Drag the car to the marked parking spot!',
    render(area) {
      area.innerHTML = `
        <div id="parkArea" style="position:relative;width:280px;height:200px;background:#9ca3af;border-radius:16px;overflow:hidden">
          <!-- Road markings -->
          <div style="position:absolute;bottom:0;width:100%;height:60px;background:#374151"></div>
          <div style="position:absolute;bottom:14px;left:0;right:0;border-top:3px dashed #fff;opacity:0.5"></div>
          <!-- Parking spots -->
          <div id="spot1" style="position:absolute;top:10px;left:20px;width:70px;height:110px;border:3px solid #fff;border-radius:8px;display:flex;align-items:center;justify-content:center">🚙</div>
          <div id="spot2" style="position:absolute;top:10px;left:105px;width:70px;height:110px;border:3px solid #ffe66d;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#ffe66d;font-weight:800">P</div>
          <div id="spot3" style="position:absolute;top:10px;left:190px;width:70px;height:110px;border:3px solid #fff;border-radius:8px;display:flex;align-items:center;justify-content:center">🚕</div>
          <!-- Player car -->
          <div id="playerCar" class="draggable" style="position:absolute;bottom:8px;left:100px;font-size:40px;cursor:grab;user-select:none">🚗</div>
        </div>
      `;
      const car = $('playerCar');
      makeDraggable(car, null, (cx, cy) => {
        if (hits($('spot2'), cx, cy)) {
          car.style.cursor = 'default';
          setTimeout(() => triggerWin(3), 300);
        }
      });
    }
  },

  // ---- 15: Rock paper scissors ----
  {
    question: 'Beat the opponent! They showed: ✌️ Scissors',
    hint: 'What beats scissors? Rock beats scissors!',
    render(area) {
      area.innerHTML = `
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:14px;font-weight:800;color:#9ca3af;margin-bottom:4px">Opponent plays:</div>
          <div style="font-size:72px">✌️</div>
        </div>
        <div class="rps-grid">
          <button class="rps-btn" id="rock">🪨</button>
          <button class="rps-btn" id="paper">📄</button>
          <button class="rps-btn" id="scissors2">✂️</button>
        </div>
      `;
      $('rock').onclick = () => triggerWin(3);
      $('paper').onclick = $('scissors2').onclick = function() {
        this.style.borderColor = '#ef4444';
        this.style.background = '#fef2f2';
        setTimeout(() => { this.style.borderColor = ''; this.style.background = ''; }, 500);
      };
    }
  },

  // ---- 16: Spell SHOP ----
  {
    question: 'Spell the word "SHOP" using the buttons below:',
    hint: 'Tap: S → H → O → P in that order!',
    render(area) {
      let typed = '';
      area.innerHTML = `
        <div id="typedDisplay" style="font-size:36px;font-weight:900;letter-spacing:8px;color:var(--text);min-height:50px;text-align:center"></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px">
          ${['S','H','O','P','A','T','E','L'].map(c => `<button class="answer-btn" style="font-size:22px;padding:12px 0" data-c="${c}">${c}</button>`).join('')}
        </div>
      `;
      area.querySelectorAll('.answer-btn').forEach(btn => {
        btn.onclick = () => {
          const c = btn.dataset.c;
          const target = 'SHOP';
          if (c === target[typed.length]) {
            typed += c;
            $('typedDisplay').textContent = typed;
            if (typed === 'SHOP') setTimeout(() => triggerWin(3), 400);
          } else {
            typed = '';
            $('typedDisplay').textContent = '';
            area.style.animation = 'shake 0.3s';
            setTimeout(() => area.style.animation = '', 300);
          }
        };
      });
    }
  },

  // ---- 17: What time is it now? ----
  {
    question: 'What time is it right now? ⏰',
    hint: 'Look at your device\'s actual clock!',
    render(area) {
      const now = new Date();
      const h = now.getHours() % 12 || 12;
      const m = now.getMinutes();
      const hStr = String(h).padStart(2,'0');
      const mStr = String(m).padStart(2,'0');
      const correct = `${hStr}:${mStr}`;
      const fakeM1 = String((m + 15) % 60).padStart(2,'0');
      const fakeM2 = String((m + 30) % 60).padStart(2,'0');
      const fakeH = String((h + 3) % 12 || 12).padStart(2,'0');
      area.innerHTML = `
        <div style="font-size:14px;font-weight:800;color:#9ca3af;margin-bottom:8px">Select the correct time:</div>
        <div class="answer-grid" style="max-width:280px">
          <button class="answer-btn" data-t="${correct}">${hStr}:${mStr}</button>
          <button class="answer-btn" data-t="wrong1">${hStr}:${fakeM1}</button>
          <button class="answer-btn" data-t="wrong2">${fakeH}:${mStr}</button>
          <button class="answer-btn" data-t="wrong3">${fakeH}:${fakeM2}</button>
        </div>
      `;
      area.querySelectorAll('.answer-btn').forEach(btn => {
        btn.onclick = () => {
          if (btn.dataset.t === correct) { triggerWin(3); }
          else { btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 400); }
        };
      });
    }
  },

  // ---- 18: Make the cat happy ----
  {
    question: 'Make the cat happy! 😺',
    hint: 'Pets love to be scratched! Rub the cat!',
    render(area) {
      let rubs = 0;
      area.innerHTML = `
        <div id="catArea" style="text-align:center;cursor:pointer">
          <div id="catFace" style="font-size:90px;user-select:none;display:inline-block">😿</div>
          <div id="catMsg" style="font-size:14px;font-weight:800;color:#9ca3af;margin-top:8px">Pet the cat!</div>
          <div style="margin-top:8px;width:200px;height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-inline:auto">
            <div id="happyBar" style="height:100%;width:0%;background:linear-gradient(90deg,#ffe66d,#ff6b35);border-radius:999px;transition:width 0.2s"></div>
          </div>
        </div>
      `;
      $('catArea').addEventListener('mousemove', rub);
      $('catArea').addEventListener('touchmove', rub, {passive:true});
      $('catArea').onclick = rub;
      function rub() {
        rubs = Math.min(rubs + 1, 20);
        $('happyBar').style.width = `${rubs * 5}%`;
        $('catFace').textContent = rubs < 5 ? '😿' : rubs < 10 ? '😾' : rubs < 15 ? '😺' : '😸';
        $('catMsg').textContent = rubs < 5 ? 'Pet the cat!' : rubs < 10 ? 'More!' : rubs < 15 ? '😺 Getting happy!' : '😸 So happy!';
        if (rubs >= 20) { $('catArea').removeEventListener('mousemove', rub); setTimeout(() => triggerWin(3), 300); }
      }
    }
  },

  // ---- 19: Pop all the balloons ----
  {
    question: 'Pop ALL the balloons! 🎈',
    hint: 'There might be a hidden balloon somewhere on screen!',
    render(area) {
      let popped = 0;
      const total = 6;
      const colors = ['🔴','🟠','🟡','🟢','🔵','🟣'];
      area.style.position = 'relative';
      area.innerHTML = `<div id="balloonContainer" style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center"></div>`;
      colors.forEach((c, i) => {
        const b = document.createElement('div');
        b.style.cssText = `font-size:52px;cursor:pointer;user-select:none;animation:balloonFloat ${2+i*0.3}s ease-in-out infinite;--float-dur:${2+i*0.3}s;--rot:${(i-3)*5}deg`;
        b.textContent = c;
        b.onclick = () => {
          b.style.animation = 'none'; b.style.opacity = '0'; b.style.transform = 'scale(1.5)';
          b.style.transition = 'all 0.2s'; b.style.pointerEvents = 'none';
          popped++;
          if (popped >= total) setTimeout(() => triggerWin(3), 400);
        };
        $('balloonContainer').appendChild(b);
      });
    }
  },

  // ---- 20: Count the stars ----
  {
    question: 'How many stars do you see? ⭐',
    hint: 'Count very carefully — some are hiding in corners!',
    render(area) {
      area.innerHTML = `
        <div style="position:relative;width:280px;height:160px;background:#1e1b4b;border-radius:16px;overflow:hidden">
          <span style="position:absolute;top:20px;left:30px;font-size:28px">⭐</span>
          <span style="position:absolute;top:50px;left:100px;font-size:20px">⭐</span>
          <span style="position:absolute;top:10px;left:180px;font-size:32px">⭐</span>
          <span style="position:absolute;top:80px;left:50px;font-size:24px">⭐</span>
          <span style="position:absolute;top:70px;left:200px;font-size:18px">⭐</span>
          <span style="position:absolute;top:120px;left:130px;font-size:14px;opacity:0.4">⭐</span>
        </div>
        <div class="answer-grid" style="max-width:280px;margin-top:12px">
          ${[4,5,6,7].map(n=>`<button class="answer-btn" data-n="${n}">${n}</button>`).join('')}
        </div>
      `;
      area.querySelectorAll('.answer-btn').forEach(btn => {
        btn.onclick = () => {
          if (btn.dataset.n === '6') triggerWin(3);
          else { btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 400); }
        };
      });
    }
  },

  // ---- 21: Which path leads to the treasure? ----
  {
    question: 'Which path leads to the treasure? 💎',
    hint: 'Trace the lines carefully!',
    render(area) {
      area.innerHTML = `
        <svg width="280" height="200" viewBox="0 0 280 200">
          <text x="40" y="22" font-size="18" text-anchor="middle">A</text>
          <text x="140" y="22" font-size="18" text-anchor="middle">B</text>
          <text x="240" y="22" font-size="18" text-anchor="middle">C</text>
          <!-- Path A — goes to X -->
          <path d="M40,25 C40,80 180,80 180,140 C180,165 140,170 120,180" stroke="#6b7280" stroke-width="3" fill="none"/>
          <!-- Path B — goes to treasure -->
          <path d="M140,25 C140,60 60,100 60,160 C60,175 90,180 100,180" stroke="#6b7280" stroke-width="3" fill="none"/>
          <!-- Path C — loops back -->
          <path d="M240,25 C240,80 200,100 200,160 C200,175 180,180 180,180" stroke="#6b7280" stroke-width="3" fill="none"/>
          <!-- Endpoints -->
          <text x="100" y="198" font-size="20" text-anchor="middle">💎</text>
          <text x="120" y="198" font-size="20" text-anchor="middle">💀</text>
          <text x="180" y="198" font-size="20" text-anchor="middle">💀</text>
        </svg>
        <div class="answer-grid" style="max-width:220px">
          <button class="answer-btn" data-p="A">Path A</button>
          <button class="answer-btn" data-p="B">Path B</button>
          <button class="answer-btn" data-p="C">Path C</button>
        </div>
      `;
      area.querySelectorAll('.answer-btn').forEach(btn => {
        btn.onclick = () => {
          if (btn.dataset.p === 'B') triggerWin(3);
          else { btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 400); }
        };
      });
    }
  },

  // ---- 22: Don't tap the red button ----
  {
    question: 'DO NOT tap the red button! 🔴',
    hint: 'The question says DON\'T tap the red one...',
    render(area) {
      area.innerHTML = `
        <div style="display:flex;gap:24px;justify-content:center;align-items:center">
          <button id="redBtn" style="width:90px;height:90px;border-radius:50%;background:#ef4444;border:5px solid #b91c1c;font-size:28px;cursor:pointer;box-shadow:0 6px 0 #991b1b;transition:all 0.15s;color:#fff;font-weight:900">🔴</button>
          <button id="greenBtn" style="width:70px;height:70px;border-radius:50%;background:#22c55e;border:5px solid #15803d;font-size:22px;cursor:pointer;box-shadow:0 5px 0 #166534;color:#fff">🟢</button>
        </div>
        <p style="font-size:13px;color:#9ca3af;margin-top:16px;text-align:center">What will you do?</p>
      `;
      $('greenBtn').onclick = () => triggerWin(3);
      $('redBtn').onclick = () => {
        $('redBtn').style.transform = 'translateY(5px)';
        $('redBtn').style.boxShadow = '0 1px 0 #991b1b';
        setTimeout(() => { $('redBtn').style.transform = ''; $('redBtn').style.boxShadow = ''; }, 200);
        area.querySelector('p').textContent = '😈 You were warned! Try the green one...';
      };
    }
  },

  // ---- 23: Make the equation correct ----
  {
    question: 'Make the equation correct by moving ONE number!',
    hint: 'Try dragging the 5 somewhere... or look at the numbers differently!',
    render(area) {
      // 5 + 3 = 6 → move 5 → become 2+3=5? No. Answer: tap the 5 and drag it → 2+3=5 no
      // Actual answer: drag the top of "5" to become "9" ... or tap "5" twice to become a "2"
      // Simplify: show 5+3=6, user must tap "5" to cycle it → when it shows "3" then 3+3=6 ✓
      let val = 5;
      function update() {
        $('eqLeft').textContent = val;
        $('eqResult').style.color = (val + 3 === 6) ? '#22c55e' : '#ef4444';
        if (val + 3 === 6) setTimeout(() => triggerWin(hintUsed ? 2 : 3), 400);
      }
      area.innerHTML = `
        <div class="equation-area">
          <div class="eq-token draggable" id="eqLeft" title="Tap to change" style="cursor:pointer;background:#fef9c3;border-color:#ca8a04">5</div>
          <div class="eq-token">+</div>
          <div class="eq-token">3</div>
          <div class="eq-token">=</div>
          <div class="eq-token" id="eqResult" style="color:#ef4444">6</div>
        </div>
        <p style="font-size:13px;color:#9ca3af;margin-top:12px;text-align:center">Tap the yellow number to change it!</p>
      `;
      $('eqLeft').onclick = () => { val = val > 1 ? val - 1 : 9; update(); };
    }
  },

  // ---- 24: Feed the monster ----
  {
    question: 'Feed the hungry monster! 👾',
    hint: 'Drag the food into the monster\'s mouth!',
    render(area) {
      area.innerHTML = `
        <div id="feedArea" style="position:relative;width:280px;height:220px;background:#f0fdf4;border-radius:16px;overflow:visible">
          <!-- Monster -->
          <div style="position:absolute;top:10px;left:70px;text-align:center">
            <div style="font-size:72px" id="monsterFace">👾</div>
            <div id="monsterMouth" style="width:80px;height:30px;background:#1a0030;border-radius:0 0 40px 40px;margin:0 auto;position:relative;top:-10px"></div>
          </div>
          <!-- Food (draggable) -->
          <div id="food1" class="draggable" style="position:absolute;bottom:20px;left:30px;font-size:44px;cursor:grab">🍕</div>
          <div id="food2" class="draggable" style="position:absolute;bottom:20px;left:120px;font-size:44px;cursor:grab">🍔</div>
          <div id="food3" class="draggable" style="position:absolute;bottom:20px;left:210px;font-size:44px;cursor:grab">🍟</div>
        </div>
      `;
      let fed = 0;
      ['food1','food2','food3'].forEach(id => {
        const el = $(id);
        makeDraggable(el, null, (cx, cy) => {
          const mouth = $('monsterMouth').getBoundingClientRect();
          const face = $('monsterFace').getBoundingClientRect();
          if (cy < face.bottom + 20 && Math.abs(cx - (face.left + face.width/2)) < 60) {
            el.style.opacity = '0'; el.style.pointerEvents = 'none';
            fed++;
            const faces = ['😮','😋','🤤'];
            $('monsterFace').textContent = fed <= 3 ? faces[fed-1] || '🤤' : '😍';
            if (fed >= 2) setTimeout(() => triggerWin(3), 400);
          }
        });
      });
    }
  },

  // ---- 25: Final — What's missing? ----
  {
    question: 'What letter is missing from the alphabet?',
    hint: 'It\'s the one letter NOT shown below!',
    render(area) {
      const alpha = 'ABCDEFGHIJKLMNOPRSTUVWXYZ'; // Q missing!
      area.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:280px;font-size:16px;font-weight:800;color:var(--text)">
          ${alpha.split('').map(c=>`<span style="width:24px;text-align:center">${c}</span>`).join('')}
        </div>
        <input class="puzzle-input" id="missingInput" type="text" placeholder="?" maxlength="1" style="max-width:120px;font-size:36px;margin-top:16px">
        <button class="puzzle-submit" id="missingSubmit">Check!</button>
      `;
      $('missingSubmit').onclick = () => {
        if ($('missingInput').value.toUpperCase() === 'Q') triggerWin(3);
        else { $('missingInput').style.borderColor = '#ef4444'; setTimeout(() => $('missingInput').style.borderColor = '', 500); }
      };
    }
  },

]; // end PUZZLES

// =============================================
// LEVEL MANAGEMENT
// =============================================

function startLevel(idx) {
  currentLevel = idx;
  hintUsed = false;
  dom.winOverlay.classList.add('hidden');
  dom.hintBubble.classList.add('hidden');
  dom.levelBadge.textContent = `Level ${idx + 1}`;

  // Reset question box to default
  dom.questionBox.textContent = PUZZLES[idx].question;

  // Clear puzzle area
  dom.puzzleArea.innerHTML = '';

  // Render puzzle
  PUZZLES[idx].render(dom.puzzleArea);
}

// =============================================
// EVENT BINDINGS
// =============================================

dom.btnPlay.onclick = () => {
  buildLevelGrid();
  startLevel(state.progress < TOTAL ? state.progress : 0);
  showScreen('screenGame');
};

dom.btnLevelSelect.onclick = () => { buildLevelGrid(); showScreen('screenLevels'); };
dom.btnLevelsBack.onclick = () => showScreen('screenMenu');
dom.btnGameBack.onclick = () => { showScreen('screenMenu'); updateMenuProgress(); };

dom.btnMenuHelp.onclick = () => dom.modalHelp.classList.remove('hidden');
dom.btnHelpClose.onclick = () => dom.modalHelp.classList.add('hidden');

dom.btnMenuExit.onclick = () => {
  if (confirm('Exit Brain Test?\nYour progress is saved!')) {
    try { window.parent.postMessage({ action: 'exit_game' }, '*'); } catch(e) {}
    try { window.history.back(); } catch(e) {}
    setTimeout(() => window.close(), 300);
  }
};

dom.btnHint.onclick = () => {
  hintUsed = true;
  showHint(PUZZLES[currentLevel].hint);
};

dom.btnNext.onclick = () => {
  if (currentLevel < TOTAL - 1) startLevel(currentLevel + 1);
  else { dom.winOverlay.classList.add('hidden'); showScreen('screenMenu'); }
};
dom.btnReplay.onclick = () => startLevel(currentLevel);

// =============================================
// BOOT
// =============================================

loadState();
updateMenuProgress();
showScreen('screenMenu');
