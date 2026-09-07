/* Parting Notes — title / adventure / play loop */
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  let map = null;
  let director = null;
  let currentLevel = null;
  const effects = [];

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
  }

  function goTitle() {
    state.screen = 'title';
    state.paused = true;
    PNUI.showScreen('title');
    requestAnimationFrame(() => PNUI.paintTitleArt());
  }

  function goAdventure() {
    state.screen = 'adventure';
    state.paused = true;
    PNUI.showScreen('adventure');
    PNUI.renderAdventure(startLevel);
  }

  function goCongrats() {
    state.screen = 'congrats';
    state.paused = true;
    hideEnd();
    PNUI.showScreen('congrats');
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

  /** +1 gold per living Alto on the map when a note dies. */
  function altoGoldBonus() {
    let n = 0;
    for (const t of state.towers) {
      if (t && t.type === 'alto') n += 1;
    }
    return n * 1;
  }

  function applyDamage(enemy, amount) {
    if (!enemy || !enemy.alive) return false;
    const filtered = PNEnemies.filterDamage
      ? PNEnemies.filterDamage(enemy, amount)
      : amount;
    if (filtered <= 0) return false;
    enemy.hp -= filtered;
    if (enemy.hp <= 0) {
      enemy.alive = false;
      state.gold += (enemy.gold || 0) + altoGoldBonus();
      return true;
    }
    return false;
  }

  function nearestOther(fromEnemy, excludeSet, range) {
    let best = null;
    let bestD = range + 1;
    for (const e of livingEnemies()) {
      if (excludeSet.has(e)) continue;
      const d = Math.hypot(e.x - fromEnemy.x, e.y - fromEnemy.y);
      if (d <= range && d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function onProjectileHit(p) {
    const hit = p.target && p.target.alive ? p.target : null;
    const splashR = p.splash || 0;

    if (splashR > 0) {
      effects.push({ x: p.x, y: p.y, r: splashR, life: 0.25, color: p.color });
      for (const e of livingEnemies()) {
        if (Math.hypot(e.x - p.x, e.y - p.y) <= splashR) {
          applyDamage(e, p.damage);
        }
      }
    } else if (hit) {
      applyDamage(hit, p.damage);
    }

    if (p.chainLeft > 0 && hit) {
      const seen = new Set([hit]);
      let cursor = hit;
      let dmg = p.damage * (p.chainDamageScale || 0.7);
      let left = p.chainLeft;
      while (left > 0) {
        const next = nearestOther(cursor, seen, p.chainRange || 100);
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
  }

  function sellSelected() {
    const t = state.selectedTower;
    if (!t || state.status !== 'playing') return;
    const key = PNTowers.cellKey(t.c, t.r);
    state.gold += PNTowers.sellValue(t);
    state.towers = state.towers.filter((x) => x !== t);
    delete state.occupied[key];
    state.selectedTower = null;
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

  function bindControls() {
    document.getElementById('btn-adventure')?.addEventListener('click', goAdventure);
    document.getElementById('btn-adv-back')?.addEventListener('click', goTitle);
    document.getElementById('btn-play-back')?.addEventListener('click', goAdventure);
    document.getElementById('btn-to-adventure')?.addEventListener('click', goAdventure);
    document.getElementById('btn-congrats-adventure')?.addEventListener('click', goAdventure);
    document.getElementById('btn-congrats-title')?.addEventListener('click', goTitle);
    document.getElementById('btn-restart')?.addEventListener('click', restartLevel);

    document.querySelectorAll('[data-tower]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-tower');
        if (!PNTowers.DEFS[id]) return;
        state.selectedType = state.selectedType === id ? null : id;
        if (state.selectedType) state.selectedTower = null;
        PNUI.syncShop(state);
      });
    });

    document.querySelectorAll('[data-target-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-target-mode');
        if (!state.selectedTower || !mode) return;
        state.selectedTower.targetMode = mode;
        PNUI.syncShop(state);
      });
    });

    document.getElementById('btn-start')?.addEventListener('click', () => {
      if (state.status !== 'playing' || !director) return;
      if (director.phase === 'between') director.skipBetween();
      else if (director.phase === 'ready') director.begin();
      PNUI.syncControls(state, director);
    });

    document.getElementById('btn-pause')?.addEventListener('click', () => {
      if (state.status !== 'playing') return;
      state.paused = !state.paused;
      PNUI.syncControls(state, director);
    });

    document.getElementById('btn-speed')?.addEventListener('click', () => {
      state.speed = state.speed === 1 ? 2 : 1;
      PNUI.syncControls(state, director);
    });

    document.getElementById('btn-sell')?.addEventListener('click', () => {
      sellSelected();
      PNUI.syncShop(state);
    });

    document.addEventListener('keydown', (ev) => {
      if (state.screen !== 'play') return;
      if (ev.key === 'Escape') {
        state.selectedTower = null;
        state.selectedType = null;
      }
      const hotkeys = { '1': 'soprano', '2': 'alto', '3': 'tenor', '4': 'bass' };
      if (hotkeys[ev.key]) {
        const id = hotkeys[ev.key];
        state.selectedType = state.selectedType === id ? null : id;
        if (state.selectedType) state.selectedTower = null;
      }
      if (ev.key === ' ') {
        ev.preventDefault();
        if (state.status === 'playing') state.paused = !state.paused;
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
        showEnd('Victory', state.message);
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
        if (state.lives <= 0) {
          state.status = 'lost';
          state.message = e.isBoss
            ? 'Andy Clark took the podium.'
            : 'The notes reached the stage.';
          showEnd('Defeat', state.message);
        }
      }
      // Conductor cue: stun every tower briefly
      if (PNEnemies.tickBossSing && PNEnemies.tickBossSing(e, scaled)) {
        PNTowers.stunAll(state.towers, e.stunDuration || 0.5);
        effects.push({
          kind: 'baton',
          x: e.x,
          y: e.y - 20,
          life: 0.4,
          color: '#e8c547',
        });
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
      effects[i].life -= scaled;
      if (effects[i].life <= 0) effects.splice(i, 1);
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
      if (fx.kind === 'baton') {
        const a = Math.max(0, fx.life / 0.4);
        const g = ctx.createRadialGradient(fx.x, fx.y, 2, fx.x, fx.y, 60);
        g.addColorStop(0, 'rgba(255,240,180,' + (0.55 * a) + ')');
        g.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(232,197,71,' + (0.7 * a) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 28 + (1 - a) * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = 'bold 16px Georgia, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(243,239,228,' + a + ')';
        ctx.fillText('♪ Cue!', fx.x, fx.y - 36);
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
