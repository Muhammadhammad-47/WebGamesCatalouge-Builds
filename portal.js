document.addEventListener('DOMContentLoaded', () => {
  let allGames = [];

  // DOM Elements
  const gamesGrid = document.getElementById('gamesGrid');
  const searchInput = document.getElementById('searchInput');
  const filterPills = document.querySelectorAll('.pill-btn');
  const heroCard = document.getElementById('heroCard');
  const headerTotalGames = document.getElementById('headerTotalGames');
  const gamesCountBadge = document.getElementById('gamesCountBadge');
  const sortSelect = document.getElementById('sortSelect');
  
  // Modal Elements
  const gameModal = document.getElementById('gameModal');
  const modalIframe = document.getElementById('modalIframe');
  const modalTitle = document.getElementById('modalTitle');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalFullscreenBtn = document.getElementById('modalFullscreenBtn');
  const modalExternalBtn = document.getElementById('modalExternalBtn');

  // Game Module Info / Download Modal Elements
  const gameInfoModal = document.getElementById('gameInfoModal');
  const infoModalCloseBtn = document.getElementById('infoModalCloseBtn');
  const infoModalTitle = document.getElementById('infoModalTitle');
  const infoModalThumb = document.getElementById('infoModalThumb');
  const infoModalCategory = document.getElementById('infoModalCategory');
  const infoModalOrient = document.getElementById('infoModalOrient');
  const infoModalRating = document.getElementById('infoModalRating');
  const infoModalDesc = document.getElementById('infoModalDesc');
  const infoModalLinkInput = document.getElementById('infoModalLinkInput');
  const infoCopyLinkBtn = document.getElementById('infoCopyLinkBtn');
  const infoOpenLinkBtn = document.getElementById('infoOpenLinkBtn');
  const infoViewJsonBtn = document.getElementById('infoViewJsonBtn');
  const infoViewThumbBtn = document.getElementById('infoViewThumbBtn');
  const assetPreviewModal = document.getElementById('assetPreviewModal');
  const previewTitle = document.getElementById('previewTitle');
  const previewBody = document.getElementById('previewBody');
  const previewCopyBtn = document.getElementById('previewCopyBtn');
  const previewDownloadBtn = document.getElementById('previewDownloadBtn');
  const previewCloseBtn = document.getElementById('previewCloseBtn');
  let previewKind = null;
  const infoPlayPortalBtn = document.getElementById('infoPlayPortalBtn');

  let currentActiveCategory = 'all';
  let currentSort = 'recent';
  let activeInfoGame = null;

  // Fetch games configuration (with cache-busting so new games show immediately)
  fetch('./games.json?t=' + Date.now())
    .then(res => res.json())
    .then(data => {
      allGames = data.map((g, idx) => ({ ...g, _origIdx: idx }));
      if (headerTotalGames) headerTotalGames.textContent = `${allGames.length} Games`;
      renderHero(allGames.find(g => g.featured) || allGames[0]);
      applyFilters();
    })
    .catch(err => {
      console.error('Error loading games.json:', err);
    });

  // Render Hero Featured Game
  function renderHero(game) {
    if (!game || !heroCard) return;

    heroCard.innerHTML = `
      <div class="hero-content">
        <div class="hero-tag">🔥 Featured Game</div>
        <h1 class="hero-title">${game.title}</h1>
        <p class="hero-desc">${game.description}</p>
        <div class="hero-actions">
          <a href="${game.path}" class="btn-play-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            PLAY NOW
          </a>
          <button class="btn-play-secondary" data-popup>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            Play in Portal
          </button>
        </div>
      </div>
      <div class="hero-visual">
        <img src="${game.thumbnail}" alt="${game.title}">
      </div>
    `;
    const heroBtn = heroCard.querySelector('[data-popup]');
    if (heroBtn) heroBtn.addEventListener('click', () => openModal(game.title, game.path, game.orientation || 'portrait'));
  }

  // Render Games Grid
  function renderGames(games) {
    if (!gamesGrid) return;
    gamesGrid.innerHTML = '';
    if (gamesCountBadge) {
      gamesCountBadge.textContent = `${games.length} / ${allGames.length}`;
    }

    if (games.length === 0) {
      gamesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <h3>No games found</h3>
          <p>Try searching for a different keyword or category.</p>
        </div>
      `;
      return;
    }

    games.forEach(game => {
      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `
        <div class="card-media">
          <img src="${game.thumbnail}" alt="${game.title}" loading="lazy">
          ${game.rating ? `<div class="card-badge-rating">★ ${game.rating}</div>` : '<div class="card-badge-rating card-badge-new">NEW</div>'}
          <div class="card-badge-cat">${game.category}</div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${game.title}</h3>
          <p class="card-desc">${game.description}</p>
          <div class="card-actions">
            <a href="${game.path}" class="btn-card-launch">Play Game</a>
            <button class="btn-card-info" title="Game Link, JSON & Thumbnail" data-info>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
            <button class="btn-card-popup" title="Play in popup modal" data-popup>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
          </div>
        </div>
      `;
      card.querySelector('[data-popup]').addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(game.title, game.path, game.orientation || 'portrait');
      });
      card.querySelector('[data-info]').addEventListener('click', (e) => {
        e.stopPropagation();
        openInfoModal(game);
      });
      card.querySelector('.btn-card-launch').addEventListener('click', (e) => {
        e.stopPropagation();
      });
      // Clicking the game card/module itself opens the module details (link + JSON + Thumbnail downloads)
      card.addEventListener('click', () => openInfoModal(game));
      gamesGrid.appendChild(card);
    });
  }

  // Filter, Sort & Search Logic
  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filtered = allGames.filter(game => {
      const matchesCategory = currentActiveCategory === 'all' || game.category.toLowerCase() === currentActiveCategory;
      const matchesSearch = game.title.toLowerCase().includes(query) || game.description.toLowerCase().includes(query) || game.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    if (currentSort === 'recent') {
      filtered.sort((a, b) => {
        const da = a.addedDate || '';
        const db = b.addedDate || '';
        if (da !== db) return db.localeCompare(da);
        return (a._origIdx ?? 0) - (b._origIdx ?? 0);
      });
    } else if (currentSort === 'rating') {
      filtered.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
    } else if (currentSort === 'az') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    renderGames(filtered);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      applyFilters();
    });
  }

  function getGameFullUrl(game) {
    try {
      return new URL(game.path, window.location.href).href;
    } catch (e) {
      return game.path;
    }
  }

  function openInfoModal(game) {
    if (!gameInfoModal || !game) return;
    activeInfoGame = game;
    const fullUrl = getGameFullUrl(game);
    if (infoModalTitle) infoModalTitle.textContent = game.title;
    if (infoModalThumb) infoModalThumb.src = game.thumbnail;
    if (infoModalCategory) infoModalCategory.textContent = game.category;
    if (infoModalOrient) infoModalOrient.textContent = (game.orientation || 'landscape').toUpperCase();
    if (infoModalRating) infoModalRating.textContent = game.rating ? `★ ${game.rating}` : 'NEW';
    if (infoModalDesc) infoModalDesc.textContent = game.description;
    if (infoModalLinkInput) infoModalLinkInput.value = fullUrl;
    if (infoOpenLinkBtn) infoOpenLinkBtn.href = fullUrl;
    if (infoCopyLinkBtn) infoCopyLinkBtn.textContent = '📋 Copy';

    gameInfoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeInfoModal() {
    if (!gameInfoModal) return;
    closePreview();
    gameInfoModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  if (infoModalCloseBtn) infoModalCloseBtn.addEventListener('click', closeInfoModal);
  if (gameInfoModal) {
    gameInfoModal.addEventListener('click', (e) => {
      if (e.target === gameInfoModal) closeInfoModal();
    });
  }

  if (infoCopyLinkBtn) {
    infoCopyLinkBtn.addEventListener('click', async () => {
      if (!infoModalLinkInput) return;
      try {
        await navigator.clipboard.writeText(infoModalLinkInput.value);
      } catch (e) {
        infoModalLinkInput.select();
        document.execCommand('copy');
      }
      infoCopyLinkBtn.textContent = '✓ Copied!';
      setTimeout(() => { infoCopyLinkBtn.textContent = '📋 Copy'; }, 1800);
    });
  }

  function gameJsonText(game) {
    const cleanObj = { ...game };
    delete cleanObj._origIdx;
    cleanObj.liveUrl = getGameFullUrl(game);
    return JSON.stringify(cleanObj, null, 2);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Colour keys, strings, numbers and booleans in the JSON preview
  function highlightJson(text) {
    return escapeHtml(text).replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g, (m, str, colon, lit) => {
      if (str) return colon ? `<span class="j-key">${str}</span>${colon}` : `<span class="j-str">${str}</span>`;
      if (lit) return `<span class="j-lit">${m}</span>`;
      return `<span class="j-num">${m}</span>`;
    });
  }

  function openPreview(kind) {
    if (!assetPreviewModal || !activeInfoGame) return;
    previewKind = kind;
    const g = activeInfoGame;
    previewBody.innerHTML = '';
    if (kind === 'thumb') {
      previewTitle.textContent = `${g.title} — Thumbnail`;
      const img = document.createElement('img');
      img.className = 'preview-image';
      img.src = g.thumbnail;
      img.alt = `${g.title} thumbnail`;
      previewBody.appendChild(img);
      previewDownloadBtn.innerHTML = '⬇ Download Thumbnail';
      previewCopyBtn.style.display = 'none';
    } else {
      previewTitle.textContent = `${g.title} — JSON`;
      const pre = document.createElement('pre');
      pre.className = 'preview-json';
      pre.innerHTML = highlightJson(gameJsonText(g));
      previewBody.appendChild(pre);
      previewDownloadBtn.innerHTML = '⬇ Download JSON';
      previewCopyBtn.style.display = '';
      previewCopyBtn.textContent = '📋 Copy JSON';
    }
    assetPreviewModal.classList.add('active');
  }

  function closePreview() {
    if (assetPreviewModal) assetPreviewModal.classList.remove('active');
  }

  if (infoViewThumbBtn) infoViewThumbBtn.addEventListener('click', () => openPreview('thumb'));
  if (infoViewJsonBtn) infoViewJsonBtn.addEventListener('click', () => openPreview('json'));
  if (previewCloseBtn) previewCloseBtn.addEventListener('click', closePreview);
  if (assetPreviewModal) {
    assetPreviewModal.addEventListener('click', (e) => { if (e.target === assetPreviewModal) closePreview(); });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && assetPreviewModal && assetPreviewModal.classList.contains('active')) {
      e.stopImmediatePropagation();
      closePreview();
    }
  }, true);
  if (previewCopyBtn) {
    previewCopyBtn.addEventListener('click', async () => {
      if (!activeInfoGame) return;
      const text = gameJsonText(activeInfoGame);
      try { await navigator.clipboard.writeText(text); } catch (e) { /* clipboard blocked */ }
      previewCopyBtn.textContent = '✓ Copied!';
      setTimeout(() => { previewCopyBtn.textContent = '📋 Copy JSON'; }, 1800);
    });
  }
  if (previewDownloadBtn) {
    previewDownloadBtn.addEventListener('click', () => {
      if (previewKind === 'thumb') downloadThumbnail(); else downloadJson();
    });
  }

  function downloadJson() {
      if (!activeInfoGame) return;
      const blob = new Blob([gameJsonText(activeInfoGame)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeInfoGame.id || activeInfoGame.branch || 'game'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
  }

  async function downloadThumbnail() {
      if (!activeInfoGame) return;
      const thumbPath = activeInfoGame.thumbnail;
      const extMatch = thumbPath.match(/\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const filename = `${activeInfoGame.branch || activeInfoGame.id || 'thumbnail'}.${ext}`;
      try {
        const res = await fetch(thumbPath);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        const a = document.createElement('a');
        a.href = thumbPath;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
  }

  if (infoPlayPortalBtn) {
    infoPlayPortalBtn.addEventListener('click', () => {
      if (!activeInfoGame) return;
      const g = activeInfoGame;
      closeInfoModal();
      openModal(g.title, g.path, g.orientation || 'portrait');
    });
  }

  // Search Listener
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // Category Pills Listener
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentActiveCategory = pill.dataset.category.toLowerCase();
      applyFilters();
    });
  });

  // Modal Handling
  window.openModal = function(title, path, orientation = 'portrait') {
    if (!gameModal || !modalIframe) return;
    modalTitle.textContent = title;
    modalIframe.src = path;
    if (modalExternalBtn) modalExternalBtn.href = path;

    const modalContainer = gameModal.querySelector('.modal-container');
    if (modalContainer) {
      modalContainer.classList.remove('portrait-mode', 'landscape-mode');
      if (orientation === 'portrait') {
        modalContainer.classList.add('portrait-mode');
      } else {
        modalContainer.classList.add('landscape-mode');
      }
    }

    gameModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    if (!gameModal || !modalIframe) return;
    gameModal.classList.remove('active');
    modalIframe.src = '';
    document.body.style.overflow = 'auto';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  // Listen for close/exit events from game iframes
  window.addEventListener('message', (e) => {
    if (e.data === 'closeModal' || (e.data && e.data.action === 'closeModal')) {
      closeModal();
    }
  });

  if (gameModal) {
    gameModal.addEventListener('click', (e) => {
      if (e.target === gameModal) closeModal();
    });
  }

  if (modalFullscreenBtn) {
    modalFullscreenBtn.addEventListener('click', () => {
      if (modalIframe.requestFullscreen) {
        modalIframe.requestFullscreen();
      } else if (modalIframe.webkitRequestFullscreen) {
        modalIframe.webkitRequestFullscreen();
      }
    });
  }
});
