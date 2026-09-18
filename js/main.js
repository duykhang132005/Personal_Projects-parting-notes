/* Parting Notes — title / adventure / play loop */
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  let map = null;
  let director = null;
  let currentLevel = null;
  let pendingNextLevelId = null;
  const effects = [];
  const TIPS_KEY = 'parting-notes-seen-tips';

  function audio() {
    return typeof PNAudio !== 'undefined' ? PNAudio : null;
  }

  function spawnFloat(x, y, text, color, life) {
    effects.push({
      kind: 'float',
      x: x,
      y: y,
      text: text,
      color: color || '#f3efe4',
      life: life != null ? life : 0.7,
      maxLife: life != null ? life : 0.7,
      vy: -28,
    });
  }

  function tipsSeen() {
    try {
      return localStorage.getItem(TIPS_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function markTipsSeen() {
    try {
      localStorage.setItem(TIPS_KEY, '1');
    } catch (_) {}
  }

  function isPlayHelpOpen() {
    const ov = document.getElementById('play-help-overlay');
    return !!(ov && !ov.hidden);
  }

  function openPlayHelp() {
    const ov = document.getElementById('play-help-overlay');
    if (!ov) return;
    ov.hidden = false;
  }

  function closePlayHelp() {
    const ov = document.getElementById('play-help-overlay');
    if (!ov) return;
    ov.hidden = true;
  }

  function hideOnboarding() {
    const ov = document.getElementById('onboard-overlay');
    if (ov) {
      ov.hidden = true;
      ov.classList.remove('visible');
    }
  }

  function showOnboardingIfNeeded(level) {
    if (!level || level.id !== 'approach') return;
    if (tipsSeen()) return;
    const ov = document.getElementById('onboard-overlay');
    if (!ov) return;
    ov.hidden = false;
    ov.classList.add('visible');
    // Reset to first step
    ov.querySelectorAll('[data-tip-step]').forEach(function (el, i) {
      el.hidden = i !== 0;
    });
    ov.dataset.step = '0';
    const nextBtn = document.getElementById('btn-tip-next');
    if (nextBtn) nextBtn.textContent = 'Next';
  }


  const state = {
    screen: 'title',
    lives: 20,
    gold: 100,
    enemies: [],
    towers: [],
    projectiles: [],
    occupied: Object.create(null),
    selectedType: null,
    hoverCell: null,
    selectedTower: null,
    paused: false,
    speed: 1,
    status: 'playing',
    message: '',
  };

  let last = performance.now();
  let raf = 0;

  function livingEnemies() {
    return state.enemies.filter((e) => e.alive);
  }

  function hideEnd() {
    const ov = document.getElementById('end-overlay');
    if (ov) {
      ov.hidden = true;
      ov.classList.remove('visible');
    }
  }

  function showEnd(kind, text) {
    const ov = document.getElementById('end-overlay');
    const title = document.getElementById('end-title');
    const msg = document.getElementById('end-msg');
    if (title) title.textContent = kind;
    if (msg) msg.textContent = text;
    if (ov) {
      ov.hidden = false;
      ov.classList.add('visible');
    }
    const a = audio();
    if (a) {
      if (kind === 'Victory') a.win();
      else if (kind === 'Defeat') a.lose();
    }
  }

  function goTitle() {
    closePlayHelp();
    state.screen = 'title';
    state.paused = true;
    hideOnboarding();
    PNUI.showScreen('title');
    requestAnimationFrame(() => PNUI.paintTitleArt());
  }

  function goAdventure() {
    closePlayHelp();
    state.screen = 'adventure';
    state.paused = true;
    hideOnboarding();
    PNUI.showScreen('adventure');
    PNUI.renderAdventure(startLevel);
  }

  let dictReturn = 'title';

  function goDictionary(from) {
    dictReturn = from === 'adventure' ? 'adventure' : 'title';
    state.screen = 'dictionary';
    state.paused = true;
    hideOnboarding();
    PNUI.showScreen('dictionary');
    PNUI.renderDictionary({ tab: 'singers' });
  }

  function leaveDictionary() {
    if (dictReturn === 'adventure') goAdventure();
    else goTitle();
  }

  function showLevelTransition(cleared, next) {
    pendingNextLevelId = next ? next.id : null;
    hideEnd();
    state.screen = 'transition';
    state.paused = true;
    const ax = audio();
    if (ax) {
      ax.win();
    }
    const kicker = document.getElementById('transition-kicker');
    const title = document.getElementById('transition-title');
    const fromEl = document.getElementById('transition-from');
    const toName = document.getElementById('transition-to-name');
    const body = document.getElementById('transition-body');
    const cont = document.getElementById('btn-transition-continue');
    if (kicker) kicker.textContent = 'Movement ' + ((cleared && cleared.index) + 1) + ' → ' + ((next && next.index) + 1);
    if (title) title.textContent = 'Stage cleared';
    if (fromEl) fromEl.textContent = cleared ? cleared.name + ' — done' : '';
    if (toName) toName.textContent = next ? next.name : '';
    if (body) body.textContent = next ? (next.blurb || 'The path continues.') : '';
    if (cont) {
      cont.hidden = !next;
      cont.textContent = next ? 'Enter ' + next.name : 'Continue';
    }
    PNUI.showScreen('transition');
  }

  function goCongrats() {
    state.screen = 'congrats';
    state.paused = true;
    hideEnd();
    // Closing Night victory unlocks Choir Andy for the shop.
    if (PNLevels.unlockTower) PNLevels.unlockTower('andy');
    const body = document.querySelector('.congrats-body');
    if (body) {
      body.textContent =
        'You walked the choir from the lawn to Closing Night and held the stage ' +
        'against jazz, folk, and conductor Andy Clark. Andy joins the choir — ' +
        'hire him from the shop on your next run. The house is on its feet.';
    }
    PNUI.showScreen('congrats');
    const a = audio();
    if (a) {
      a.win();
    }
  }

  function startLevel(levelId) {
    const level = PNLevels.getLevel(levelId);
    if (!level) return;
    currentLevel = level;
    map = PNMap.createMap(level);
    canvas.width = map.width;
    canvas.height = map.height;
    director = PNWaves.createDirector(level.waves, {
      betweenDelay: level.betweenDelay || 5,
    });

    state.screen = 'play';
    state.lives = level.lives;
    state.gold = level.gold;
    state.enemies = [];
    state.towers = [];
    state.projectiles = [];
    state.occupied = Object.create(null);
    state.selectedTower = null;
    state.selectedType = null;
    state.paused = false;
    state.speed = 1;
    state.status = 'playing';
    state.message = '';
    effects.length = 0;
    hideEnd();

    const title = document.getElementById('level-title');
    if (title) title.textContent = level.name;

    PNUI.resetShopIcons();
    PNUI.showScreen('play');
    PNUI.renderHud(state, director);
    PNUI.syncShop(state);
    PNUI.syncControls(state, director);
    const a = audio();
    if (a) {
      a.syncMuteButtons();
    }
    showOnboardingIfNeeded(level);
  }

  function restartLevel() {
    if (!currentLevel) return;
    startLevel(currentLevel.id);
  }

  function spawnNote(spawn) {
    let typeId = 'quarter';
    let style = 'normal';
    if (typeof spawn === 'string') {
      typeId = spawn;
    } else if (spawn && typeof spawn === 'object') {
      typeId = spawn.type || 'quarter';
      style = spawn.style || 'normal';
    }
    state.enemies.push(PNEnemies.createEnemy(typeId, map.waypoints, style));
  }

  /** Gold bonus from living Altos (Articulate raises goldPerKill). */
  function altoGoldBonus() {
    let n = 0;
    for (const t of state.towers) {
      if (!t || t.type !== 'alto') continue;
      const s = PNTowers.combatStats ? PNTowers.combatStats(t) : null;
      n += s && s.goldPerKill != null ? s.goldPerKill : 1;
    }
    return n;
  }

  function applyDamage(enemy, amount, meta) {
    if (!enemy || !enemy.alive) return false;
    const raw = amount;
    let assist = { jazzCapBonus: 0, folkAssist: 0 };
    if (meta && meta.fromTower && PNTowers.harmonyAssists) {
      assist = PNTowers.harmonyAssists(meta.fromTower, state.towers);
    }
    const filterOpts = {
      jazzCapBonus: assist.jazzCapBonus || 0,
      folkAssist: assist.folkAssist || 0,
    };
    const filtered = PNEnemies.filterDamage
      ? PNEnemies.filterDamage(enemy, amount, filterOpts)
      : amount;
    const part = (meta && (meta.kind || (meta.fromTower && meta.fromTower.kind))) || null;
    const a = audio();
    const fxX = enemy.x + (Math.random() * 10 - 5);
    const fxY = enemy.y - 12;

    // Jazz cap / folk block feedback
    const jazzCap = (PNEnemies.JAZZ_CAP || 10) + (filterOpts.jazzCapBonus || 0);
    let specialSfx = false;
    if (!enemy.isBoss && enemy.style === 'jazz' && raw > jazzCap) {
      spawnFloat(fxX, fxY - 8, 'CAP', '#e8c547', 0.75);
      if (a) a.jazzCapped();
      specialSfx = true;
    } else if (!enemy.isBoss && enemy.style === 'folk' && filtered <= 0 && raw > 0) {
      spawnFloat(fxX, fxY - 8, 'BLOCK', '#a67c52', 0.75);
      if (a) a.folkBlocked();
      return false;
    }

    if (filtered <= 0) return false;

    if (a && !specialSfx) a.hit(part);
    // Light optional damage number (skip when CAP floater already up)
    if (!specialSfx && filtered >= 8) {
      spawnFloat(fxX + 6, fxY + 4, String(Math.round(filtered)), '#f3efe4', 0.55);
    }

    enemy.hp -= filtered;
    if (enemy.hp <= 0) {
      enemy.alive = false;
      state.gold += (enemy.gold || 0) + altoGoldBonus();
      if (a) a.kill();
    }
    return true; // damage applied
  }

  function nearestOther(fromEnemy, excludeSet, range, preferDifferent) {
    let best = null;
    let bestD = range + 1;
    let bestDiff = null;
    let bestDiffD = range + 1;
    for (const e of livingEnemies()) {
      if (excludeSet.has(e)) continue;
      const d = Math.hypot(e.x - fromEnemy.x, e.y - fromEnemy.y);
      if (d > range) continue;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
      if (preferDifferent && e.type !== fromEnemy.type && d < bestDiffD) {
        bestDiffD = d;
        bestDiff = e;
      }
    }
    if (preferDifferent && bestDiff) return bestDiff;
    return best;
  }

  function isHeavyTarget(enemy) {
    return !!(enemy && (enemy.isBoss || enemy.type === 'andy' || enemy.type === 'whole'));
  }

  function hitDamageFor(p, enemy) {
    let dmg = p.damage;
    if ((p.heavyBonusMult || 1) > 1 && isHeavyTarget(enemy)) {
      dmg *= p.heavyBonusMult;
    }
    return dmg;
  }

  function onProjectileHit(p) {
    const hit = p.target && p.target.alive ? p.target : null;
    const splashR = p.splash || 0;
    const meta = { kind: p.kind, fromTower: p.fromTower };
    let damagedCount = 0;

    if (splashR > 0) {
      effects.push({ x: p.x, y: p.y, r: splashR, life: 0.25, color: p.color });
      const inSplash = [];
      for (const e of livingEnemies()) {
        if (Math.hypot(e.x - p.x, e.y - p.y) <= splashR) inSplash.push(e);
      }
      let splashDmgMult = 1;
      if (p.clusterMin > 0 && inSplash.length >= p.clusterMin) {
        splashDmgMult = p.clusterMult || 1.25;
      }
      for (const e of inSplash) {
        if (applyDamage(e, hitDamageFor(p, e) * splashDmgMult, meta)) damagedCount += 1;
        if (p.splashSlowDuration > 0 && PNEnemies.applySlow) {
          PNEnemies.applySlow(e, p.splashSlowDuration, p.splashSlowMult || 0.65);
        }
      }
    } else if (hit) {
      if (applyDamage(hit, hitDamageFor(p, hit), meta)) damagedCount += 1;
      if (p.hitSlowDuration > 0 && PNEnemies.applySlow) {
        PNEnemies.applySlow(hit, p.hitSlowDuration, p.hitSlowMult || 0.7);
      }
    }

    // Choir Andy cue pulse: stun notes near impact (not towers).
    if ((p.kind === 'andy' || (p.fromTower && p.fromTower.kind === 'andy')) &&
        (p.cueRadius > 0) && PNEnemies.applyStun) {
      const cueR = p.cueRadius || 80;
      const cueD = p.cueStunDuration || 0.6;
      const ix = hit ? hit.x : p.x;
      const iy = hit ? hit.y : p.y;
      effects.push({ x: ix, y: iy, r: cueR, life: 0.28, color: 'rgba(232,197,71,0.55)' });
      for (const e of livingEnemies()) {
        if (Math.hypot(e.x - ix, e.y - iy) <= cueR) {
          PNEnemies.applyStun(e, cueD);
        }
      }
    }

    // Crescendo: splash that damages ≥1 builds streak; empty splash / no target resets.
    if (p.crescendo && p.fromTower) {
      if (splashR > 0 && damagedCount >= 1) {
        p.fromTower.crescendoStreak = (p.fromTower.crescendoStreak || 0) + 1;
      } else {
        p.fromTower.crescendoStreak = 0;
      }
    }

    if (p.chainLeft > 0 && hit) {
      const seen = new Set([hit]);
      let cursor = hit;
      let dmg = p.damage * (p.chainDamageScale || 0.7);
      let left = p.chainLeft;
      const preferDiff = !!p.chainPreferDifferent;
      while (left > 0) {
        const next = nearestOther(cursor, seen, p.chainRange || 100, preferDiff);
        if (!next) break;
        seen.add(next);
        state.projectiles.push(
          PNProjectiles.createProjectile({
            x: cursor.x,
            y: cursor.y,
            tx: next.x,
            ty: next.y,
            target: next,
            speed: (p.speed || 380) * 1.1,
            damage: dmg,
            color: p.color,
            chainLeft: 0,
            chainPreferDifferent: preferDiff,
            fromTower: p.fromTower,
            kind: 'soprano',
          })
        );
        cursor = next;
        dmg *= p.chainDamageScale || 0.7;
        left -= 1;
      }
    }
  }

  function tryPlace(c, r) {
    if (state.status !== 'playing' || !map) return;
    const type = state.selectedType;
    const def = PNTowers.DEFS[type];
    if (!def) return;
    if (PNLevels.isTowerUnlocked && !PNLevels.isTowerUnlocked(type)) return;
    if (!map.canBuild(c, r)) return;
    const key = PNTowers.cellKey(c, r);
    if (state.occupied[key]) return;
    if (state.gold < def.cost) return;

    const tower = PNTowers.createTower(type, c, r, map.TILE);
    if (!tower) return;
    state.gold -= def.cost;
    state.towers.push(tower);
    state.occupied[key] = tower;
    state.selectedTower = tower;
    state.selectedType = null;
    const a = audio();
    if (a) a.place();
  }

  function sellSelected() {
    const t = state.selectedTower;
    if (!t || state.status !== 'playing') return;
    const key = PNTowers.cellKey(t.c, t.r);
    state.gold += PNTowers.sellValue(t);
    state.towers = state.towers.filter((x) => x !== t);
    delete state.occupied[key];
    state.selectedTower = null;
    const a = audio();
    if (a) a.sell();
  }

  function buySelectedUpgrade(path) {
    const t = state.selectedTower;
    if (!t || state.status !== 'playing') return false;
    if (!PNTowers.buyUpgrade) return false;
    const result = PNTowers.buyUpgrade(t, path, state.gold);
    if (!result.ok) return false;
    state.gold = result.gold;
    const a = audio();
    if (a) a.uiClick();
    return true;
  }

  function cellFromEvent(ev) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (ev.clientX - rect.left) * scaleX;
    const y = (ev.clientY - rect.top) * scaleY;
    return {
      c: Math.floor(x / map.TILE),
      r: Math.floor(y / map.TILE),
    };
  }

  canvas.addEventListener('mousemove', (ev) => {
    if (!map || state.screen !== 'play') return;
    const { c, r } = cellFromEvent(ev);
    state.hoverCell =
      c >= 0 && c < map.COLS && r >= 0 && r < map.ROWS ? { c, r } : null;
  });
  canvas.addEventListener('mouseleave', () => {
    state.hoverCell = null;
  });
  canvas.addEventListener('click', (ev) => {
    if (state.screen !== 'play' || state.status !== 'playing' || !map) return;
    const { c, r } = cellFromEvent(ev);
    const key = PNTowers.cellKey(c, r);
    if (state.occupied[key]) {
      state.selectedTower = state.occupied[key];
      state.selectedType = null;
      PNUI.syncShop(state);
      return;
    }
    if (state.selectedType) tryPlace(c, r);
    else state.selectedTower = null;
    PNUI.syncShop(state);
  });

  function startWaveIfReady() {
    if (state.status !== 'playing' || !director) return false;
    let started = false;
    if (director.phase === 'between') {
      director.skipBetween();
      started = true;
    } else if (director.phase === 'ready') {
      director.begin();
      started = true;
    }
    if (started) {
      const a = audio();
      if (a) a.startWave();
    }
    PNUI.syncControls(state, director);
    return started;
  }

  function togglePause() {
    if (state.status !== 'playing') return;
    state.paused = !state.paused;
    PNUI.syncControls(state, director);
  }

  function toggleSpeed() {
    state.speed = state.speed === 1 ? 2 : 1;
    PNUI.syncControls(state, director);
  }

  function bindControls() {
    document.getElementById('btn-adventure')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      goAdventure();
    });
    document.getElementById('btn-title-dictionary')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      goDictionary('title');
    });
    document.getElementById('btn-adv-dictionary')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      goDictionary('adventure');
    });
    document.getElementById('btn-dict-back')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      leaveDictionary();
    });
    document.querySelectorAll('[data-dict-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = audio();
        if (a) a.uiClick();
        const tab = btn.getAttribute('data-dict-tab');
        PNUI.setDictionaryTab(tab);
        requestAnimationFrame(() => PNUI.paintDictionaryIcons());
      });
    });
    document.getElementById('btn-map-prev')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      PNUI.adventurePageDelta(-1);
    });
    document.getElementById('btn-map-next')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      PNUI.adventurePageDelta(1);
    });
    document.getElementById('btn-adv-back')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      goTitle();
    });
    document.getElementById('btn-play-back')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      goAdventure();
    });
    document.getElementById('btn-play-help')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      openPlayHelp();
    });
    document.getElementById('btn-play-help-close')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      closePlayHelp();
    });
    document.getElementById('play-help-overlay')?.addEventListener('click', (ev) => {
      if (ev.target && ev.target.id === 'play-help-overlay') closePlayHelp();
    });

    document.getElementById('btn-to-adventure')?.addEventListener('click', goAdventure);
    document.getElementById('btn-congrats-adventure')?.addEventListener('click', goAdventure);
    document.getElementById('btn-congrats-title')?.addEventListener('click', goTitle);
    document.getElementById('btn-transition-continue')?.addEventListener('click', () => {
      if (pendingNextLevelId) startLevel(pendingNextLevelId);
      else goAdventure();
    });
    document.getElementById('btn-transition-adventure')?.addEventListener('click', goAdventure);
    document.getElementById('btn-restart')?.addEventListener('click', restartLevel);

    document.querySelectorAll('[data-mute-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = audio();
        if (!a) return;
        a.toggleMute();
      });
    });

    document.getElementById('btn-tip-next')?.addEventListener('click', () => {
      const a = audio();
      if (a) a.uiClick();
      const ov = document.getElementById('onboard-overlay');
      if (!ov) return;
      const steps = Array.from(ov.querySelectorAll('[data-tip-step]'));
      let i = parseInt(ov.dataset.step || '0', 10);
      if (i < steps.length - 1) {
        steps[i].hidden = true;
        i += 1;
        steps[i].hidden = false;
        ov.dataset.step = String(i);
        const nextBtn = document.getElementById('btn-tip-next');
        if (nextBtn && i === steps.length - 1) nextBtn.textContent = 'Got it';
      } else {
        hideOnboarding();
      }
    });
    document.getElementById('btn-tip-dismiss')?.addEventListener('click', () => {
      hideOnboarding();
    });
    document.getElementById('btn-tip-never')?.addEventListener('click', () => {
      markTipsSeen();
      hideOnboarding();
    });

    document.querySelectorAll('[data-tower]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-tower');
        if (!PNTowers.DEFS[id]) return;
        if (PNLevels.isTowerUnlocked && !PNLevels.isTowerUnlocked(id)) return;
        const a = audio();
        if (a) a.uiClick();
        state.selectedType = state.selectedType === id ? null : id;
        if (state.selectedType) state.selectedTower = null;
        PNUI.syncShop(state);
      });
    });

    document.querySelectorAll('[data-target-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-target-mode');
        if (!state.selectedTower || !mode) return;
        const a = audio();
        if (a) a.uiClick();
        state.selectedTower.targetMode = mode;
        PNUI.syncShop(state);
      });
    });

    document.querySelectorAll('[data-upgrade]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const path = btn.getAttribute('data-upgrade');
        if (!path) return;
        buySelectedUpgrade(path);
        PNUI.syncShop(state);
        PNUI.renderHud(state, director);
      });
    });

    document.getElementById('btn-start')?.addEventListener('click', startWaveIfReady);

    document.getElementById('btn-pause')?.addEventListener('click', togglePause);

    document.getElementById('btn-speed')?.addEventListener('click', toggleSpeed);

    document.getElementById('btn-sell')?.addEventListener('click', () => {
      sellSelected();
      PNUI.syncShop(state);
    });

    document.addEventListener('keydown', (ev) => {
      if (state.screen !== 'play') return;
      if (ev.key === 'Escape') {
        if (isPlayHelpOpen()) {
          closePlayHelp();
          return;
        }
        togglePause();
      }
      const hotkeys = { '1': 'soprano', '2': 'alto', '3': 'tenor', '4': 'bass', '5': 'andy' };
      if (hotkeys[ev.key]) {
        const id = hotkeys[ev.key];
        if (PNLevels.isTowerUnlocked && !PNLevels.isTowerUnlocked(id)) {
          /* locked */
        } else {
          state.selectedType = state.selectedType === id ? null : id;
          if (state.selectedType) state.selectedTower = null;
        }
      }
      if (ev.key === ' ') {
        ev.preventDefault();
        if (isPlayHelpOpen()) return;
        const started = startWaveIfReady();
        if (!started && state.status === 'playing') toggleSpeed();
      }
      if (ev.key === 's' || ev.key === 'S') sellSelected();
      PNUI.syncShop(state);
      if (director) PNUI.syncControls(state, director);
    });
  }

  function update(dt) {
    if (state.screen !== 'play' || !map || !director) return;
    if (state.status !== 'playing' || state.paused) {
      PNUI.renderHud(state, director);
      PNUI.syncControls(state, director);
      return;
    }

    const scaled = dt * state.speed;
    const dir = director.update(scaled, livingEnemies().length);
    if (dir.spawned) spawnNote(dir.spawned);
    if (dir.victory) {
      state.status = 'won';
      state.message = currentLevel
        ? currentLevel.name + ' cleared!'
        : 'The phrase is broken.';
      if (currentLevel) PNLevels.markCleared(currentLevel.id);
      // Final stage → full congratulations screen
      if (currentLevel && (currentLevel.id === 'closing' || currentLevel.index === 9)) {
        goCongrats();
      } else {
        const next = PNLevels.getNextLevel(currentLevel.id);
        if (next) showLevelTransition(currentLevel, next);
        else showEnd('Victory', state.message);
      }
    }

    for (const e of state.enemies) {
      if (!e.alive) continue;
      const beforeEnd = e.reachedEnd;
      PNEnemies.updateEnemy(e, map.waypoints, scaled);
      if (e.reachedEnd && !beforeEnd) {
        // Boss leaking costs more lives
        const leak = e.isBoss ? 5 : 1;
        state.lives = Math.max(0, state.lives - leak);
        const a = audio();
        if (a) a.lifeLeak();
        if (state.lives <= 0) {
          state.status = 'lost';
          state.message = e.isBoss
            ? 'Andy Clark took the podium.'
            : 'The notes reached the stage.';
          showEnd('Defeat', state.message);
        }
      }
      // Conductor cue: stronger 0.4s wind-up flash + stun
      if (PNEnemies.tickBossSing && PNEnemies.tickBossSing(e, scaled)) {
        e.singFlash = Math.max(e.singFlash || 0, 0.4);
        PNTowers.stunAll(state.towers, e.stunDuration || 0.5);
        effects.push({
          kind: 'baton',
          x: e.x,
          y: e.y - 20,
          life: 0.4,
          maxLife: 0.4,
          color: '#e8c547',
        });
        const a = audio();
        if (a) a.andyCue();
      }
    }

    for (const t of state.towers) {
      PNTowers.updateTower(
        t,
        scaled,
        livingEnemies(),
        state.towers,
        state.projectiles,
        map.waypoints
      );
    }

    for (const p of state.projectiles) {
      if (!p.alive) continue;
      PNProjectiles.updateProjectile(p, scaled, livingEnemies(), onProjectileHit);
    }
    state.projectiles = state.projectiles.filter((p) => p.alive);
    state.enemies = state.enemies.filter((e) => e.alive);

    for (let i = effects.length - 1; i >= 0; i--) {
      const fx = effects[i];
      fx.life -= scaled;
      if (fx.kind === 'float') {
        fx.y += (fx.vy || -28) * scaled;
      }
      if (fx.life <= 0) effects.splice(i, 1);
    }

    PNUI.renderHud(state, director);
    PNUI.syncShop(state);
    PNUI.syncControls(state, director);
  }

  function draw() {
    if (state.screen !== 'play' || !map) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    map.draw(ctx);

    for (const t of state.towers) {
      PNTowers.drawTower(ctx, t, t === state.selectedTower);
    }

    if (state.hoverCell && state.status === 'playing') {
      const { c, r } = state.hoverCell;
      if (state.selectedType) {
        const key = PNTowers.cellKey(c, r);
        const def = PNTowers.DEFS[state.selectedType];
        const valid =
          map.canBuild(c, r) && !state.occupied[key] && def && state.gold >= def.cost;
        map.drawPlacementHint(ctx, c, r, valid);
        PNTowers.drawGhost(ctx, state.selectedType, c, r, map.TILE, valid);
      }
    }

    for (const e of state.enemies) PNEnemies.drawNote(ctx, e);
    for (const p of state.projectiles) PNProjectiles.drawProjectile(ctx, p);

    for (const fx of effects) {
      if (fx.kind === 'float') {
        const maxL = fx.maxLife || 0.7;
        const a = Math.max(0, fx.life / maxL);
        ctx.save();
        ctx.globalAlpha = Math.min(1, a * 1.2);
        ctx.font = 'bold 13px Georgia, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(20,10,8,0.85)';
        ctx.strokeText(fx.text, fx.x, fx.y);
        ctx.fillStyle = fx.color || '#f3efe4';
        ctx.fillText(fx.text, fx.x, fx.y);
        ctx.restore();
        continue;
      }
      if (fx.kind === 'baton') {
        const maxL = fx.maxLife || 0.4;
        const a = Math.max(0, fx.life / maxL);
        const pulse = 70 + (1 - a) * 30;
        const g = ctx.createRadialGradient(fx.x, fx.y, 2, fx.x, fx.y, pulse);
        g.addColorStop(0, 'rgba(255,240,180,' + (0.7 * a) + ')');
        g.addColorStop(0.45, 'rgba(232,197,71,' + (0.35 * a) + ')');
        g.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(232,197,71,' + (0.85 * a) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 28 + (1 - a) * 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.45 * a) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 18 + (1 - a) * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = 'bold 17px Georgia, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(243,239,228,' + a + ')';
        ctx.fillText('♪ Cue!', fx.x, fx.y - 40);
        continue;
      }
      const a = Math.max(0, fx.life / 0.25);
      ctx.strokeStyle = fx.color;
      ctx.globalAlpha = 0.35 + 0.4 * a;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, (fx.r || 40) * (1.15 - 0.15 * a), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (state.paused && state.status === 'playing') {
      ctx.fillStyle = 'rgba(26, 31, 22, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 32px Georgia, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(26, 16, 8, 0.9)';
      ctx.strokeText('Paused', canvas.width / 2, canvas.height / 2);
      ctx.fillStyle = '#f3efe4';
      ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  bindControls();
  goTitle();
  raf = requestAnimationFrame(frame);
})();
