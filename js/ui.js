/* Parting Notes — HUD + shop + adventure map + dictionary */
(function (global) {
  function showScreen(name) {
    ['title', 'adventure', 'play', 'congrats', 'transition', 'dictionary'].forEach((id) => {
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
      if (id === 'andy' && PNSprites.drawAndyClark) {
        PNSprites.drawAndyClark(ctx, cv.width / 2, cv.height / 2 + 2, {
          scale: 0.7,
          flash: false,
        });
      } else {
        PNSprites.drawPart(ctx, id, cv.width / 2, cv.height / 2 + 4, false, 0.85);
      }
    });
    iconsPainted = true;
  }

  function resetShopIcons() {
    iconsPainted = false;
  }

  function pipString(tier, max) {
    let s = '';
    for (let i = 0; i < max; i++) s += i < tier ? '●' : '○';
    return s;
  }

  function syncUpgradePath(state, path) {
    const t = state.selectedTower;
    const btn = document.querySelector('[data-upgrade="' + path + '"]');
    const nameEl = document.querySelector('[data-upgrade-name="' + path + '"]');
    const costEl = document.querySelector('[data-upgrade-cost="' + path + '"]');
    const pipsEl = document.querySelector('[data-upgrade-pips="' + path + '"]');
    if (!btn) return;

    if (!t || !PNTowers.upgradeInfo) {
      btn.disabled = true;
      btn.classList.remove('cant-afford', 'locked');
      if (nameEl) nameEl.textContent = '—';
      if (costEl) costEl.textContent = '';
      if (pipsEl) pipsEl.textContent = '○○○';
      return;
    }

    const info = PNTowers.upgradeInfo(t, path);
    if (pipsEl) pipsEl.textContent = pipString(info.tier, info.max);
    if (info.maxed) {
      if (nameEl) nameEl.textContent = 'Maxed';
      if (costEl) costEl.textContent = '';
      btn.disabled = true;
      btn.classList.remove('cant-afford', 'locked');
      btn.title = 'Path maxed';
      return;
    }

    if (nameEl) nameEl.textContent = info.name;
    if (costEl) costEl.textContent = info.cost + 'g';

    const check = PNTowers.canBuyUpgrade(t, path, state.gold);
    btn.disabled = !check.ok;
    btn.classList.toggle('cant-afford', check.reason === 'gold');
    btn.classList.toggle('locked', check.reason === 'crosspath');
    if (check.reason === 'crosspath') {
      btn.title = 'Crosspath locked (max 3/2)';
    } else if (check.reason === 'gold') {
      btn.title = 'Need ' + info.cost + 'g';
    } else {
      btn.title = info.name + ' — ' + info.cost + 'g';
    }
  }

  function syncShop(state) {
    paintShopIcons();
    document.querySelectorAll('[data-tower]').forEach((btn) => {
      const id = btn.getAttribute('data-tower');
      const def = PNTowers.DEFS[id];
      const unlocked =
        !def || !def.unlockId ||
        (PNLevels.isTowerUnlocked ? PNLevels.isTowerUnlocked(id) : true);
      if (id === 'andy' || def && def.unlockId) {
        btn.hidden = !unlocked;
        btn.classList.toggle('shop-locked', !unlocked);
      }
      btn.classList.toggle('active', state.selectedType === id);
      btn.disabled = !def || !unlocked;
      const cost = btn.querySelector('[data-cost]');
      if (cost && def) {
        cost.setAttribute('data-cost', String(def.cost));
        cost.textContent = def.cost + 'g';
      }
      if (def && unlocked && state.gold < def.cost) btn.classList.add('cant-afford');
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

    const upPanel = document.getElementById('upgrade-panel');
    if (upPanel) {
      const t = state.selectedTower;
      upPanel.hidden = !t;
      document.querySelectorAll('[data-upgrade-path-label]').forEach((el) => {
        const path = el.getAttribute('data-upgrade-path-label');
        if (t && PNTowers.pathLabel) el.textContent = PNTowers.pathLabel(t, path);
        else el.textContent = path === 'range' ? 'Range' : 'Damage';
      });
      syncUpgradePath(state, 'range');
      syncUpgradePath(state, 'damage');
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

  // —— Adventure node map (outside → in, left → right) ——
  // Pages: 1–4 lawn→elevator, 5–7 stage→green room, 8–10 dock→closing
  const MAP_PAGES = [
    { label: 'Outside → Lobby', indices: [0, 1, 2, 3] },
    { label: 'Hall → Encore', indices: [4, 5, 6] },
    { label: 'Backstage → Closing Night', indices: [7, 8, 9] },
  ];

  let adventureMapPage = 0;
  let adventureFocusId = null;
  let adventureOnPick = null;

  function setAdventurePage(page) {
    adventureMapPage = Math.max(0, Math.min(MAP_PAGES.length - 1, page));
  }

  function getAdventurePage() {
    return adventureMapPage;
  }

  function updateAdventureDetail(level, unlocked, cleared) {
    const nameEl = document.getElementById('adv-detail-name');
    const blurbEl = document.getElementById('adv-detail-blurb');
    const metaEl = document.getElementById('adv-detail-meta');
    if (!level) {
      if (nameEl) nameEl.textContent = 'Choose a stage';
      if (blurbEl) {
        blurbEl.textContent = 'Nodes read left to right — deeper into the building toward closing night.';
      }
      if (metaEl) metaEl.textContent = '';
      return;
    }
    if (nameEl) nameEl.textContent = level.name;
    if (blurbEl) blurbEl.textContent = level.blurb || '';
    if (metaEl) {
      metaEl.textContent = !unlocked ? 'Locked' : cleared ? 'Cleared' : 'Ready';
    }
  }

  function renderAdventure(onPick) {
    adventureOnPick = onPick;
    const mapEl = document.getElementById('adv-map');
    const pageLabel = document.getElementById('adv-page-label');
    const prevBtn = document.getElementById('btn-map-prev');
    const nextBtn = document.getElementById('btn-map-next');
    if (!mapEl) return;

    const progress = PNLevels.loadProgress();
    const page = MAP_PAGES[adventureMapPage] || MAP_PAGES[0];
    if (pageLabel) {
      pageLabel.textContent =
        page.label + ' · ' + (adventureMapPage + 1) + ' / ' + MAP_PAGES.length;
    }
    if (prevBtn) prevBtn.disabled = adventureMapPage <= 0;
    if (nextBtn) nextBtn.disabled = adventureMapPage >= MAP_PAGES.length - 1;

    const levels = page.indices
      .map((i) => PNLevels.LEVELS[i])
      .filter(Boolean);

    mapEl.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'adv-map-svg');
    svg.setAttribute('viewBox', '0 0 100 40');
    svg.setAttribute('preserveAspectRatio', 'none');
    const path = document.createElementNS(svgNS, 'path');
    const n = levels.length;
    let d = '';
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 50 : 12 + (i / (n - 1)) * 76;
      const y = 20 + (i % 2 === 0 ? -4 : 4);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    path.setAttribute('d', d.trim());
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#8b2942');
    path.setAttribute('stroke-width', '1.4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('opacity', '0.55');
    svg.appendChild(path);
    mapEl.appendChild(svg);

    const row = document.createElement('div');
    row.className = 'adv-map-nodes';

    let focusLevel = null;
    let focusUnlocked = false;
    let focusCleared = false;

    levels.forEach((level) => {
      const unlocked = level.index < progress.unlocked;
      const cleared = progress.cleared.includes(level.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'adv-node' +
        (cleared ? ' cleared' : '') +
        (!unlocked ? ' locked' : '');
      btn.disabled = !unlocked;
      btn.setAttribute('role', 'listitem');
      btn.dataset.levelId = level.id;
      btn.innerHTML =
        '<span class="adv-node-orb">' +
        (level.index + 1) +
        '</span><span class="adv-node-name">' +
        level.name +
        '</span><span class="adv-node-state">' +
        (!unlocked ? 'Locked' : cleared ? 'Cleared' : 'Open') +
        '</span>';

      const focusThis = () => {
        adventureFocusId = level.id;
        row.querySelectorAll('.adv-node').forEach((n) => n.classList.remove('is-focused'));
        btn.classList.add('is-focused');
        updateAdventureDetail(level, unlocked, cleared);
      };

      btn.addEventListener('mouseenter', focusThis);
      btn.addEventListener('focus', focusThis);
      if (unlocked) {
        btn.addEventListener('click', () => {
          if (typeof adventureOnPick === 'function') adventureOnPick(level.id);
        });
      }

      if (adventureFocusId === level.id || (!focusLevel && unlocked)) {
        focusLevel = level;
        focusUnlocked = unlocked;
        focusCleared = cleared;
      }
      row.appendChild(btn);
    });

    mapEl.appendChild(row);

    if (!focusLevel && levels[0]) {
      focusLevel = levels[0];
      focusUnlocked = focusLevel.index < progress.unlocked;
      focusCleared = progress.cleared.includes(focusLevel.id);
    }
    if (focusLevel) {
      adventureFocusId = focusLevel.id;
      const node = row.querySelector('[data-level-id="' + focusLevel.id + '"]');
      if (node) node.classList.add('is-focused');
      updateAdventureDetail(focusLevel, focusUnlocked, focusCleared);
    } else {
      updateAdventureDetail(null, false, false);
    }
  }

  // Pick the map page with the first stage that has not been cleared (Closing Night when all are
  // cleared) and highlight that node. Does not render or move keyboard focus.
  function selectNextUnclearedPage() {
    const progress = PNLevels.loadProgress();
    const all = PNLevels.LEVELS;
    const target = all.find((lv) => !progress.cleared.includes(lv.id)) || all[all.length - 1];
    if (!target) return null;
    for (let p = 0; p < MAP_PAGES.length; p++) {
      if (MAP_PAGES[p].indices.includes(target.index)) {
        setAdventurePage(p);
        break;
      }
    }
    adventureFocusId = target.id;
    return target;
  }

  // Debug helper: same page choice, then render and focus the node.
  function jumpToNextUncleared() {
    const target = selectNextUnclearedPage();
    if (!target) return null;
    renderAdventure(adventureOnPick || function () {});
    const mapEl = document.getElementById('adv-map');
    const node = mapEl && mapEl.querySelector('[data-level-id="' + target.id + '"]');
    if (node && typeof node.focus === 'function') node.focus();
    return target;
  }

  function adventurePageDelta(delta) {
    setAdventurePage(adventureMapPage + delta);
    if (typeof adventureOnPick === 'function') {
      renderAdventure(adventureOnPick);
    } else {
      renderAdventure(() => {});
    }
  }

  // —— Dictionary / Codex ——
  let dictTab = 'singers';

  const SINGER_BLURBS = {
    soprano: {
      role: 'Solo lead',
      ability:
        'Single-target lead. Tone path unlocks chain: Echo → Cascade → Vibrato. Melody prefers a different note type when chaining.',
      paths:
        'Breath: Breath Control → Passing Tone → Melody. Tone: Echo → Cascade → Vibrato.',
    },
    alto: {
      role: 'Chip · buff aura',
      ability:
        'Soft chip plus a nearby aura. Articulate raises gold-per-kill; Harmony assists Jazz/Folk allies in aura.',
      paths:
        'Support: Breath Support → Blend → Harmony. Edge: Articulate → Pierce → Morale Boost.',
    },
    tenor: {
      role: 'Splash AoE',
      ability:
        'Splash crowd control. Project slows splash hits; Countermelody rewards clusters; Crescendo builds a powered shot.',
      paths:
        'Vowels: Tall Vowels → Open Vowels → Project. Line: Clear Cut → Countermelody → Crescendo.',
    },
    bass: {
      role: 'Sniper · infinite range',
      ability:
        'Always in range. Tempo path accelerates fire (pierce at Steady Tempo). Fermata slows and punishes heavy notes.',
      paths:
        'Tempo: On Beat → Precise Rhythm → Steady Tempo. Weight: Downbeat → Drone → Fermata.',
    },
    andy: {
      role: 'Cue · support sniper',
      ability:
        'Expensive long-range support. Modest single-target damage; each hit pulses a cue that stuns nearby notes. Weak vs packs on purpose.',
      paths:
        'Cue: Cue Reach → Wider Cue → Full House. Baton: Baton Tap → Downbeat → Curtain Call.',
    },
  };

  function singerCardsHtml() {
    const order =
      (PNTowers && (PNTowers.SHOP_ORDER || PNTowers.ORDER_ALL || PNTowers.ORDER)) ||
      ['soprano', 'alto', 'tenor', 'bass'];
    return order
      .map((id) => {
        const def = PNTowers.DEFS[id];
        if (!def) return '';
        const unlocked =
          !def.unlockId ||
          (PNLevels.isTowerUnlocked ? PNLevels.isTowerUnlocked(id) : false);
        const blurb = SINGER_BLURBS[id] || { role: '', ability: '', paths: '' };
        if (!unlocked) {
          return (
            '<article class="dict-card dict-locked" data-dict-singer="' +
            id +
            '">' +
            '<div class="dict-card-top">' +
            '<canvas class="dict-icon" data-dict-part="' +
            id +
            '" width="64" height="64" aria-hidden="true"></canvas>' +
            '<div>' +
            '<h3>' +
            def.name +
            '</h3>' +
            '<p class="dict-role">Locked</p>' +
            '<p class="dict-cost">Unlock: clear Closing Night</p>' +
            '</div></div>' +
            '<p class="dict-body">Choir Andy — cue-stun support sniper. Clear Closing Night to hire him from the shop.</p>' +
            '</article>'
          );
        }
        return (
          '<article class="dict-card" data-dict-singer="' +
          id +
          '">' +
          '<div class="dict-card-top">' +
          '<canvas class="dict-icon" data-dict-part="' +
          id +
          '" width="64" height="64" aria-hidden="true"></canvas>' +
          '<div>' +
          '<h3>' +
          def.name +
          '</h3>' +
          '<p class="dict-role">' +
          blurb.role +
          '</p>' +
          '<p class="dict-cost">' +
          def.cost +
          'g</p>' +
          '</div></div>' +
          '<p class="dict-body">' +
          blurb.ability +
          '</p>' +
          '<p class="dict-paths">' +
          blurb.paths +
          '</p>' +
          '</article>'
        );
      })
      .join('');
  }

  function noteCardsHtml() {
    const types = (PNEnemies && PNEnemies.TYPES) || {};
    const order = ['eighth', 'quarter', 'half', 'whole'];
    const jazzCap = (PNEnemies && PNEnemies.JAZZ_CAP) || 10;
    const folkMin = (PNEnemies && PNEnemies.FOLK_MIN) || 20;
    const noteBlurbs = {
      eighth: 'Fast, frail runner — packs of eighths rush the path.',
      quarter: 'Standard note. Balanced HP and speed.',
      half: 'Sturdy mid-tempo note. Needs sustained fire.',
      whole: 'Slow tank. Soak damage and threaten lives if they leak.',
    };

    let html = order
      .map((id) => {
        const def = types[id];
        if (!def) return '';
        return (
          '<article class="dict-card">' +
          '<div class="dict-card-top">' +
          '<canvas class="dict-icon" data-dict-note="' +
          id +
          '" data-dict-style="normal" width="64" height="64" aria-hidden="true"></canvas>' +
          '<div>' +
          '<h3>' +
          def.name +
          '</h3>' +
          '<p class="dict-role">HP ' +
          def.hp +
          ' · ' +
          def.gold +
          'g</p>' +
          '</div></div>' +
          '<p class="dict-body">' +
          (noteBlurbs[id] || '') +
          '</p>' +
          '</article>'
        );
      })
      .join('');

    html +=
      '<article class="dict-card">' +
      '<div class="dict-card-top">' +
      '<canvas class="dict-icon" data-dict-note="quarter" data-dict-style="jazz" width="64" height="64" aria-hidden="true"></canvas>' +
      '<div>' +
      '<h3>Jazz</h3>' +
      '<p class="dict-role">Style</p>' +
      '</div></div>' +
      '<p class="dict-body">Glittery notes shrug heavy hits — each hit\'s damage is capped at <strong>JAZZ_CAP (' +
      jazzCap +
      ')</strong>. Prefer steady chip DPS over huge single strikes.</p>' +
      '</article>';

    html +=
      '<article class="dict-card">' +
      '<div class="dict-card-top">' +
      '<canvas class="dict-icon" data-dict-note="quarter" data-dict-style="folk" width="64" height="64" aria-hidden="true"></canvas>' +
      '<div>' +
      '<h3>Folk</h3>' +
      '<p class="dict-role">Style</p>' +
      '</div></div>' +
      '<p class="dict-body">Earthy notes ignore light hits — damage below <strong>FOLK_MIN (' +
      folkMin +
      ')</strong> deals 0. Bring Bass, Tenor splash, or upgraded Damage paths.</p>' +
      '</article>';

    const andy = types.andy;
    if (andy) {
      html +=
        '<article class="dict-card wide">' +
        '<div class="dict-card-top">' +
        '<canvas class="dict-icon" data-dict-note="andy" data-dict-style="normal" width="64" height="64" aria-hidden="true"></canvas>' +
        '<div>' +
        '<h3>' +
        andy.name +
        '</h3>' +
        '<p class="dict-role">Boss · Closing Night</p>' +
        '<p class="dict-cost">HP ' +
        andy.hp +
        ' · leaks 5 lives</p>' +
        '</div></div>' +
        '<p class="dict-body">Conductor boss. His cue periodically <strong>stuns the choir</strong>. If he reaches the end he leaks <strong>5 lives</strong> — stop him before the house empties.</p>' +
        '</article>';
    }
    return html;
  }

  function paintDictionaryIcons() {
    if (!global.PNSprites) return;
    document.querySelectorAll('canvas[data-dict-part]').forEach((cv) => {
      const id = cv.getAttribute('data-dict-part');
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (id === 'andy' && PNSprites.drawAndyClark) {
        PNSprites.drawAndyClark(ctx, cv.width / 2, cv.height / 2 + 2, {
          scale: 0.7,
          flash: false,
        });
      } else {
        PNSprites.drawPart(ctx, id, cv.width / 2, cv.height / 2 + 4, false, 0.9);
      }
    });
    document.querySelectorAll('canvas[data-dict-note]').forEach((cv) => {
      const id = cv.getAttribute('data-dict-note');
      const style = cv.getAttribute('data-dict-style') || 'normal';
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (id === 'andy' && PNSprites.drawAndyClark) {
        PNSprites.drawAndyClark(ctx, cv.width / 2, cv.height / 2 + 2, {
          scale: 0.95,
          flash: false,
        });
      } else {
        PNSprites.drawNote(ctx, id, cv.width / 2, cv.height / 2 + 2, style);
      }
    });
  }

  function setDictionaryTab(tab) {
    dictTab = tab === 'notes' ? 'notes' : 'singers';
    document.querySelectorAll('[data-dict-tab]').forEach((btn) => {
      const on = btn.getAttribute('data-dict-tab') === dictTab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-dict-panel]').forEach((panel) => {
      panel.hidden = panel.getAttribute('data-dict-panel') !== dictTab;
    });
  }

  function renderDictionary(opts) {
    const tab = (opts && opts.tab) || dictTab || 'singers';
    const singers = document.getElementById('dict-panel-singers');
    const notes = document.getElementById('dict-panel-notes');
    if (singers) singers.innerHTML = singerCardsHtml();
    if (notes) notes.innerHTML = noteCardsHtml();
    setDictionaryTab(tab);
    // Paint after the screen is visible (caller shows screen first).
    requestAnimationFrame(() => paintDictionaryIcons());
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
    adventurePageDelta,
    setAdventurePage,
    getAdventurePage,
    selectNextUnclearedPage,
    jumpToNextUncleared,
    renderDictionary,
    setDictionaryTab,
    paintDictionaryIcons,
    MAP_PAGES,
  };
})(typeof window !== 'undefined' ? window : globalThis);
