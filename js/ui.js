/* Parting Notes: HUD + shop + adventure map + dictionary */
(function (global) {
  function showScreen(name) {
    ['title', 'adventure', 'play', 'congrats', 'transition', 'dictionary'].forEach((id) => {
      const el = document.getElementById('screen-' + id);
      if (el) el.hidden = id !== name;
    });
  }

  // Write DOM text/attributes only when they change (renderHud and syncControls run every frame).
  function setText(el, s) {
    if (el && el.textContent !== s) el.textContent = s;
  }
  function setAttr(el, name, v) {
    if (el && el.getAttribute(name) !== v) el.setAttribute(name, v);
  }
  function setDisabled(el, v) {
    if (el && el.disabled !== v) el.disabled = v;
  }
  function setHidden(el, v) {
    if (el && el.hidden !== v) el.hidden = v;
  }

  // Encore best wave, read from storage once per run and when it changes (not every frame).
  let encoreBest = null;
  function refreshEncoreBest() {
    encoreBest = global.PNStats ? PNStats.getEncoreBest() : 0;
    return encoreBest;
  }

  function renderHud(state, director) {
    const lives = document.querySelector('[data-hud="lives"]');
    const gold = document.querySelector('[data-hud="gold"]');
    const wave = document.querySelector('[data-hud="wave"]');
    const phase = document.querySelector('[data-hud="phase"]');
    setText(lives, 'Lives: ' + state.lives);
    setText(gold, 'Gold: ' + state.gold);
    if (wave && director && director.endless) {
      const best = encoreBest === null ? refreshEncoreBest() : encoreBest;
      setText(wave,
        'Encore wave ' + (director.started ? director.currentDisplay() : 0) +
        (best > 0 ? ' (best ' + best + ')' : ''));
    } else if (wave && director) {
      const total = director.totalWaves();
      const cur = director.currentDisplay();
      if (!director.started) setText(wave, 'Wave: 0 / ' + total);
      else setText(wave, 'Wave: ' + cur + ' / ' + total);
    }
    if (phase && director) {
      if (state.status === 'won') setText(phase, 'Victory');
      else if (state.status === 'lost') setText(phase, 'Defeat');
      else if (director.phase === 'ready') setText(phase, 'Build · press Start');
      else if (director.phase === 'between') {
        setText(phase,
          'Break · next in ' + Math.max(0, Math.ceil(director.betweenTimer)) + 's');
      } else if (director.phase === 'spawning') setText(phase, 'Fight');
      else setText(phase, 'Parting Notes');
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
      setDisabled(btn, true);
      btn.classList.toggle('cant-afford', false);
      btn.classList.toggle('locked', false);
      setText(nameEl, '');
      setText(costEl, '');
      setText(pipsEl, '○○○');
      return;
    }

    const info = PNTowers.upgradeInfo(t, path);
    setText(pipsEl, pipString(info.tier, info.max));
    if (info.maxed) {
      setText(nameEl, 'Maxed');
      setText(costEl, '');
      setDisabled(btn, true);
      btn.classList.toggle('cant-afford', false);
      btn.classList.toggle('locked', false);
      setAttr(btn, 'title', 'Path maxed');
      return;
    }

    setText(nameEl, info.name);
    setText(costEl, info.cost + 'g');

    const check = PNTowers.canBuyUpgrade(t, path, state.gold);
    setDisabled(btn, !check.ok);
    btn.classList.toggle('cant-afford', check.reason === 'gold');
    btn.classList.toggle('locked', check.reason === 'crosspath');
    if (check.reason === 'crosspath') {
      setAttr(btn, 'title', 'Crosspath locked (max 3/2)');
    } else if (check.reason === 'gold') {
      setAttr(btn, 'title', 'Need ' + info.cost + 'g');
    } else {
      setAttr(btn, 'title', info.name + ', ' + info.cost + 'g');
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
        setHidden(btn, !unlocked);
        btn.classList.toggle('shop-locked', !unlocked);
      }
      btn.classList.toggle('active', state.selectedType === id);
      setDisabled(btn, !def || !unlocked);
      const cost = btn.querySelector('[data-cost]');
      if (cost && def) {
        setAttr(cost, 'data-cost', String(def.cost));
        setText(cost, def.cost + 'g');
      }
      btn.classList.toggle('cant-afford', !!(def && unlocked && state.gold < def.cost));
    });

    const sell = document.getElementById('btn-sell');
    if (sell) {
      const t = state.selectedTower;
      setDisabled(sell, !t || state.status !== 'playing');
      setText(sell, t ? 'Sell (+' + PNTowers.sellValue(t) + 'g)' : 'Sell (50%)');
    }

    const panel = document.getElementById('target-panel');
    const label = document.getElementById('target-label');
    if (panel) {
      const t = state.selectedTower;
      setHidden(panel, !t);
      if (t) setText(label, t.name + ' targets');
      document.querySelectorAll('[data-target-mode]').forEach((btn) => {
        const mode = btn.getAttribute('data-target-mode');
        btn.classList.toggle('active', !!(t && t.targetMode === mode));
        setDisabled(btn, !t);
      });
    }

    const upPanel = document.getElementById('upgrade-panel');
    if (upPanel) {
      const t = state.selectedTower;
      setHidden(upPanel, !t);
      document.querySelectorAll('[data-upgrade-path-label]').forEach((el) => {
        const path = el.getAttribute('data-upgrade-path-label');
        setText(el, t && PNTowers.pathLabel ? PNTowers.pathLabel(t, path) : path === 'range' ? 'Range' : 'Damage');
      });
      syncUpgradePath(state, 'range');
      syncUpgradePath(state, 'damage');
    }
  }

  // Effects in range: a plain list for the selected singer, rebuilt only when it changes.
  let statusKey = '';
  function syncStatusPanel(selected, lines) {
    const panel = document.getElementById('status-panel');
    const list = document.getElementById('status-list');
    if (!panel || !list) return;
    if (!selected) {
      if (!panel.hidden) panel.hidden = true;
      statusKey = '';
      return;
    }
    if (panel.hidden) panel.hidden = false;
    const key = selected.name + '|' + lines.map((l) => l.id + ':' + l.text).join('|');
    if (key === statusKey) return;
    statusKey = key;
    const icons = (global.PNRules && PNRules.STATUS_ICONS) || {};
    if (!lines.length) {
      list.innerHTML = '<li class="status-item status-empty">No auras or effects on this ' + escapeHtml(selected.name) + ' right now.</li>';
      return;
    }
    list.innerHTML = lines
      .map((l) => {
        const def = icons[l.id];
        const svg = def
          ? '<svg class="status-icon" data-status="' + l.id + '" viewBox="-4 -4 24 24" width="22" height="22" aria-hidden="true" focusable="false">' +
            '<circle cx="8" cy="8" r="10.5"/><path d="' + def.shape + '"/></svg>'
          : '';
        return '<li class="status-item">' + svg + '<span>' + escapeHtml(l.text) + '</span></li>';
      })
      .join('');
  }

  function syncControls(state, director) {
    const start = document.getElementById('btn-start');
    const pause = document.getElementById('btn-pause');
    const speed = document.getElementById('btn-speed');
    if (start && director) {
      if (director.phase === 'between') setText(start, 'Next wave');
      else if (director.phase === 'ready') setText(start, 'Start wave');
      else setText(start, 'In progress');
      setDisabled(start,
        state.status !== 'playing' ||
        director.phase === 'spawning' ||
        director.phase === 'won');
    }
    if (pause) {
      setText(pause, state.paused ? 'Resume' : 'Pause');
      setDisabled(pause, state.status !== 'playing');
    }
    if (speed) {
      setText(speed, 'Speed ×' + state.speed);
      setAttr(speed, 'aria-pressed', state.speed !== 1 ? 'true' : 'false');
      setDisabled(speed, state.status !== 'playing');
    }
  }

  // == Adventure node map (outside → in, left → right) ==
  // Pages: 1–4 lawn→elevator, 5–7 stage→green room, 8–10 dock→closing
  const MAP_PAGES = [
    { label: 'Outside → Lobby', indices: [0, 1, 2, 3] },
    { label: 'Hall → Encore', indices: [4, 5, 6] },
    { label: 'Backstage → Closing Night', indices: [7, 8, 9] },
    // A Christmas Carol act: five staves, opened by clearing Closing Night.
    { label: 'A Christmas Carol', indices: [10, 11, 12, 13, 14], act: 'carol' },
  ];
  // Encore (endless) sits after Closing Night on this page.
  const ENCORE_PAGE = MAP_PAGES.findIndex((pg) => pg.indices.includes(9));

  function levelUnlocked(level, progress) {
    if (PNLevels.isLevelUnlocked) return PNLevels.isLevelUnlocked(level, progress);
    return level.index < progress.unlocked;
  }

  let adventureMapPage = 0;
  let adventureFocusId = null;
  let adventureOnPick = null;

  function setAdventurePage(page) {
    adventureMapPage = Math.max(0, Math.min(MAP_PAGES.length - 1, page));
  }

  function getAdventurePage() {
    return adventureMapPage;
  }

  // Stats line under the blurb in the detail panel.
  function stageStatsText(level, unlocked) {
    if (!level || !global.PNStats) return '';
    if (level.endless) {
      if (!unlocked) return 'Clear Closing Night to unlock endless waves.';
      const best = PNStats.getEncoreBest();
      return best > 0 ? 'Best run: ' + best + (best === 1 ? ' wave survived.' : ' waves survived.') : 'No Encore runs recorded yet.';
    }
    if (level.act && !unlocked) {
      const prev = level.actIndex > 0 ? PNLevels.CAROL_LEVELS[level.actIndex - 1] : null;
      return prev ? 'Clear ' + prev.name + ' to open this stave.' : 'Clear Closing Night to open A Christmas Carol.';
    }
    return PNStats.detailText(PNStats.get(level.id));
  }

  // Short readout on a map node (part of the node's accessible name).
  function stageNodeSummary(level, unlocked) {
    if (!level || !global.PNStats) return '';
    if (level.endless) {
      // Locked: no readout. Unlocked: best wave from pn_encore_best_v1, or a placeholder.
      if (!unlocked) return '';
      const best = PNStats.getEncoreBest();
      return best > 0 ? 'Best: wave ' + best : 'No best yet';
    }
    return PNStats.nodeSummary(PNStats.get(level.id));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  /** Fills the Records dialog: every stage plus Encore, read fresh from PNStats and progress. */
  function renderRecords() {
    const body = document.getElementById('records-body');
    if (!body || !global.PNStats) return;
    const progress = PNLevels.loadProgress();
    const recordRow = (level) => {
      const unlocked = levelUnlocked(level, progress);
      const s = PNStats.get(level.id);
      const played = s.clears > 0 || s.losses > 0;
      let best;
      if (!unlocked) best = 'Locked';
      else if (s.clears > 0 && s.bestLives !== null) best = s.bestLives + (s.bestLives === 1 ? ' life left' : ' lives left');
      else best = 'Not cleared';
      const time = unlocked && s.bestTime !== null ? PNStats.formatTime(s.bestTime) : '-';
      return { name: level.name, best, time, clears: played ? String(s.clears) : '-', losses: played ? String(s.losses) : '-', cls: unlocked ? '' : 'locked', id: level.id };
    };
    const rows = PNLevels.LEVELS.map(recordRow);
    const encUnlocked = !!(PNLevels.isEndlessUnlocked && PNLevels.isEndlessUnlocked());
    const eb = PNStats.getEncoreBest();
    rows.push({
      name: PNLevels.ENDLESS_LEVEL.name,
      best: !encUnlocked ? 'Locked' : eb > 0 ? 'Best: wave ' + eb : 'No best yet',
      time: '-',
      clears: '-',
      losses: '-',
      cls: 'endless' + (encUnlocked ? '' : ' locked'),
      id: 'endless',
    });
    (PNLevels.CAROL_LEVELS || []).forEach((level) => rows.push(recordRow(level)));
    body.innerHTML = rows.map((r) =>
      '<tr class="' + r.cls + '" data-record="' + r.id + '"><th scope="row">' + escapeHtml(r.name) + '</th><td>' +
      escapeHtml(r.best) + '</td><td>' + r.time + '</td><td>' + r.clears + '</td><td>' + r.losses + '</td></tr>').join('');
  }

  function updateAdventureDetail(level, unlocked, cleared) {
    const nameEl = document.getElementById('adv-detail-name');
    const blurbEl = document.getElementById('adv-detail-blurb');
    const metaEl = document.getElementById('adv-detail-meta');
    const statsEl = document.getElementById('adv-detail-stats');
    if (statsEl) {
      const st = stageStatsText(level, unlocked);
      statsEl.textContent = st;
      statsEl.hidden = !st;
    }
    if (!level) {
      if (nameEl) nameEl.textContent = 'Choose a stage';
      if (blurbEl) {
        blurbEl.textContent = 'Nodes read left to right, deeper into the building toward closing night.';
      }
      if (metaEl) metaEl.textContent = '';
      return;
    }
    if (nameEl) nameEl.textContent = level.name;
    if (blurbEl) blurbEl.textContent = level.blurb || '';
    if (metaEl) {
      metaEl.textContent = !unlocked ? 'Locked' : level.endless ? 'Endless' : cleared ? 'Cleared' : 'Ready';
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
    const panel = mapEl.closest('.adv-map-panel');
    if (panel) panel.classList.toggle('is-carol', page.act === 'carol');

    const levels = page.indices
      .map((i) => PNLevels.getLevel(i))
      .filter(Boolean);
    // Encore (endless) sits after Closing Night, teased until unlocked.
    if (adventureMapPage === ENCORE_PAGE && PNLevels.ENDLESS_LEVEL) {
      levels.push(PNLevels.ENDLESS_LEVEL);
    }

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
      const unlocked = level.endless
        ? !!(PNLevels.isEndlessUnlocked && PNLevels.isEndlessUnlocked())
        : levelUnlocked(level, progress);
      const cleared = !level.endless && progress.cleared.includes(level.id);
      const summary = stageNodeSummary(level, unlocked);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'adv-node' +
        (level.endless ? ' endless' : '') +
        (level.act ? ' carol' : '') +
        (cleared ? ' cleared' : '') +
        (!unlocked ? ' locked' : '');
      btn.disabled = !unlocked;
      btn.setAttribute('role', 'listitem');
      btn.dataset.levelId = level.id;
      btn.innerHTML =
        '<span class="adv-node-orb">' +
        (level.endless ? '<span aria-hidden="true">∞</span>' : level.act ? level.actIndex + 1 : level.index + 1) +
        '</span><span class="adv-node-name">' +
        level.name +
        '</span><span class="adv-node-state">' +
        (!unlocked ? 'Locked' : level.endless ? 'Endless' : cleared ? 'Cleared' : 'Open') +
        '</span>' +
        (summary ? '<span class="adv-node-stat">' + summary + '</span>' : '');

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

      if (adventureFocusId === level.id || (!focusLevel && unlocked && !level.endless)) {
        focusLevel = level;
        focusUnlocked = unlocked;
        focusCleared = cleared;
      }
      row.appendChild(btn);
    });

    mapEl.appendChild(row);

    if (!focusLevel && levels[0]) {
      focusLevel = levels[0];
      focusUnlocked = levelUnlocked(focusLevel, progress);
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

  // Pick the map page with the first stage that has not been cleared and highlight that node.
  // After Closing Night that is the next open Carol stave (Christmas Morning once the act is
  // done too). Does not render or move keyboard focus.
  function selectNextUnclearedPage() {
    const progress = PNLevels.loadProgress();
    const all = PNLevels.LEVELS;
    const carol = (PNLevels.CAROL_LEVELS || []).filter((lv) => levelUnlocked(lv, progress));
    const target =
      all.find((lv) => !progress.cleared.includes(lv.id)) ||
      carol.find((lv) => !progress.cleared.includes(lv.id)) ||
      carol[carol.length - 1] ||
      all[all.length - 1];
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

  // == Dictionary / Codex ==
  let dictTab = 'singers';

  // Short role tag per singer. The body, base stats and every upgrade line come from PNSkills,
  // which reads js/towers.js, so the numbers always match the game.
  const SINGER_ROLES = {
    soprano: 'Solo lead',
    alto: 'Chip · buff aura',
    tenor: 'Splash AoE',
    bass: 'Sniper · infinite range',
    andy: 'Cue · support sniper',
  };

  function skillPathsHtml(id) {
    if (!global.PNSkills) return '';
    const info = PNSkills.forTower(id);
    return (
      '<p class="dict-body">' + escapeHtml(info.role) + '</p>' +
      '<p class="dict-stats">' + info.base.map(escapeHtml).join(' · ') + '</p>' +
      '<div class="dict-skill-paths">' +
      info.paths
        .map((p) =>
          '<section class="dict-skill-path" aria-label="' + escapeHtml(p.label) + ' path">' +
          '<h4 class="dict-skill-path-title">' + escapeHtml(p.label) + ' path</h4>' +
          '<ol class="dict-skills">' +
          p.tiers
            .map((t) =>
              '<li class="dict-skill">' +
              '<p class="dict-skill-head"><span class="dict-skill-tier">Tier ' + t.tier + '</span>' +
              '<strong class="dict-skill-name">' + escapeHtml(t.name) + '</strong>' +
              '<span class="dict-skill-cost">' + t.cost + 'g</span></p>' +
              '<p class="dict-skill-what">' + escapeHtml(t.what) + '</p>' +
              (t.nums.length ? '<p class="dict-skill-nums">' + t.nums.map(escapeHtml).join('; ') + '</p>' : '') +
              (t.note ? '<p class="dict-skill-note">' + escapeHtml(t.note) + '</p>' : '') +
              '</li>')
            .join('') +
          '</ol></section>')
        .join('') +
      '</div>'
    );
  }

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
            '<p class="dict-body">Choir Andy, a cue-stun support sniper. Clear Closing Night to hire him from the shop and see his upgrades.</p>' +
            '</article>'
          );
        }
        return (
          '<article class="dict-card wide dict-singer" data-dict-singer="' +
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
          (SINGER_ROLES[id] || '') +
          '</p>' +
          '<p class="dict-cost">' +
          def.cost +
          'g</p>' +
          '</div></div>' +
          skillPathsHtml(id) +
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
      eighth: 'Fast, frail runner: packs of eighths rush the path.',
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
      '<p class="dict-body">Glittery notes shrug heavy hits: each hit\'s damage is capped at <strong>JAZZ_CAP (' +
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
      '<p class="dict-body">Earthy notes ignore light hits: damage below <strong>FOLK_MIN (' +
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
        '<p class="dict-body">Conductor boss. His cue periodically <strong>stuns the choir</strong>. If he reaches the end he leaks <strong>5 lives</strong>, so stop him before the house empties. Beat Closing Night to open <strong>Encore (endless)</strong>, where he returns every 10th wave.</p>' +
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
      // Roving tabindex: only the selected tab sits in the Tab order; arrows move between tabs.
      btn.tabIndex = on ? 0 : -1;
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
    /* splash: assets/title-splash.webp with the PNG as fallback (index.html, styles.css) */
  }

  global.PNUI = {
    showScreen,
    paintTitleArt,
    renderHud,
    renderRecords,
    syncShop,
    syncControls,
    syncStatusPanel,
    refreshEncoreBest,
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
