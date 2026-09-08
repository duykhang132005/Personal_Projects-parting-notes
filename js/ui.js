/* Parting Notes — HUD + shop + adventure list */
(function (global) {
  function showScreen(name) {
    ['title', 'adventure', 'play', 'congrats', 'transition'].forEach((id) => {
      const el = document.getElementById('screen-' + id);
      if (el) el.hidden = id !== name;
    });
  }

  function renderHud(state, director) {
    const lives = document.querySelector('[data-hud="lives"]');
    const gold = document.querySelector('[data-hud="gold"]');
    const wave = document.querySelector('[data-hud="wave"]');
    const phase = document.querySelector('[data-hud="phase"]');
    if (lives) lives.textContent = 'Lives: ' + state.lives;
    if (gold) gold.textContent = 'Gold: ' + state.gold;
    if (wave && director) {
      const total = director.totalWaves();
      const cur = director.currentDisplay();
      if (!director.started) wave.textContent = 'Wave: — / ' + total;
      else wave.textContent = 'Wave: ' + cur + ' / ' + total;
    }
    if (phase && director) {
      if (state.status === 'won') phase.textContent = 'Victory';
      else if (state.status === 'lost') phase.textContent = 'Defeat';
      else if (director.phase === 'ready') phase.textContent = 'Build · press Start';
      else if (director.phase === 'between') {
        phase.textContent =
          'Break · next in ' + Math.max(0, Math.ceil(director.betweenTimer)) + 's';
      } else if (director.phase === 'spawning') phase.textContent = 'Fight';
      else phase.textContent = 'Parting Notes';
    }
  }

  let iconsPainted = false;
  function paintShopIcons() {
    if (iconsPainted || !global.PNSprites) return;
    document.querySelectorAll('canvas[data-icon]').forEach((cv) => {
      const id = cv.getAttribute('data-icon');
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      PNSprites.drawPart(ctx, id, cv.width / 2, cv.height / 2 + 4, false, 0.85);
    });
    iconsPainted = true;
  }

  function resetShopIcons() {
    iconsPainted = false;
  }

  function syncShop(state) {
    paintShopIcons();
    document.querySelectorAll('[data-tower]').forEach((btn) => {
      const id = btn.getAttribute('data-tower');
      const def = PNTowers.DEFS[id];
      btn.classList.toggle('active', state.selectedType === id);
      btn.disabled = !def;
      const cost = btn.querySelector('[data-cost]');
      if (cost && def) {
        cost.setAttribute('data-cost', String(def.cost));
        cost.textContent = def.cost + 'g';
      }
      if (def && state.gold < def.cost) btn.classList.add('cant-afford');
      else btn.classList.remove('cant-afford');
    });

    const sell = document.getElementById('btn-sell');
    if (sell) {
      const t = state.selectedTower;
      sell.disabled = !t;
      sell.textContent = t
        ? 'Sell (+' + PNTowers.sellValue(t) + 'g)'
        : 'Sell (50%)';
    }

    const panel = document.getElementById('target-panel');
    const label = document.getElementById('target-label');
    if (panel) {
      const t = state.selectedTower;
      panel.hidden = !t;
      if (t && label) label.textContent = t.name + ' targets';
      document.querySelectorAll('[data-target-mode]').forEach((btn) => {
        const mode = btn.getAttribute('data-target-mode');
        btn.classList.toggle('active', !!(t && t.targetMode === mode));
        btn.disabled = !t;
      });
    }
  }

  function syncControls(state, director) {
    const start = document.getElementById('btn-start');
    const pause = document.getElementById('btn-pause');
    const speed = document.getElementById('btn-speed');
    if (start && director) {
      if (director.phase === 'between') start.textContent = 'Next wave';
      else if (director.phase === 'ready') start.textContent = 'Start wave';
      else start.textContent = 'In progress';
      start.disabled =
        state.status !== 'playing' ||
        director.phase === 'spawning' ||
        director.phase === 'won';
    }
    if (pause) {
      pause.textContent = state.paused ? 'Resume' : 'Pause';
      pause.disabled = state.status !== 'playing';
    }
    if (speed) {
      speed.textContent = 'Speed ×' + state.speed;
      speed.disabled = state.status !== 'playing';
    }
  }

  function renderAdventure(onPick) {
    const list = document.getElementById('level-list');
    if (!list) return;
    const progress = PNLevels.loadProgress();
    list.innerHTML = '';
    PNLevels.LEVELS.forEach((level) => {
      const unlocked = level.index < progress.unlocked;
      const cleared = progress.cleared.includes(level.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-card' + (cleared ? ' cleared' : '');
      btn.disabled = !unlocked;
      btn.innerHTML =
        '<span class="level-num">' +
        (level.index + 1) +
        '</span><span class="level-text"><h3>' +
        level.name +
        '</h3><p>' +
        level.blurb +
        '</p></span><span class="level-meta">' +
        (unlocked ? (cleared ? 'Cleared' : 'Play') : 'Locked') +
        '</span>';
      if (unlocked) {
        btn.addEventListener('click', () => onPick(level.id));
      }
      list.appendChild(btn);
    });
  }


  function paintTitleArt() {
    /* splash uses assets/title-splash.png */
  }

  global.PNUI = {
    showScreen,
    paintTitleArt,
    renderHud,
    syncShop,
    syncControls,
    paintShopIcons,
    resetShopIcons,
    renderAdventure,
  };
})(typeof window !== 'undefined' ? window : globalThis);
