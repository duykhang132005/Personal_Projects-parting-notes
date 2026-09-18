/* Parting Notes — voice-part towers */
(function (global) {
  const TARGET_MODES = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'closest', label: 'Closest' },
    { id: 'strongest', label: 'Highest HP' },
  ];

  const DEFS = {
    soprano: {
      id: 'soprano',
      name: 'Soprano',
      cost: 50,
      range: 140,
      fireRate: 0.7,
      damage: 16,
      color: '#a51c30',
      // Chain unlocked via Damage path upgrades (base is single-target).
      chainJumps: 0,
      chainRange: 0,
      chainDamageScale: 0.65,
      projectileSpeed: 380,
      kind: 'soprano',
      defaultTarget: 'front',
    },
    alto: {
      id: 'alto',
      name: 'Alto',
      cost: 85,
      range: 110,
      fireRate: 1.0,
      damage: 6,
      color: '#7a1424',
      auraRange: 200,
      auraDamageBonus: 0.25,
      projectileSpeed: 300,
      kind: 'alto',
      defaultTarget: 'front',
    },
    tenor: {
      id: 'tenor',
      name: 'Tenor',
      cost: 75,
      range: 125,
      fireRate: 1.25,
      damage: 20,
      splash: 58,
      color: '#c41e3a',
      projectileSpeed: 340,
      kind: 'tenor',
      defaultTarget: 'closest',
    },
    bass: {
      id: 'bass',
      name: 'Bass',
      cost: 100,
      range: Infinity,
      fireRate: 1.6,
      damage: 48,
      color: '#1a1a1e',
      chainJumps: 0,
      projectileSpeed: 520,
      kind: 'bass',
      defaultTarget: 'strongest',
    },
  };

  const ORDER = ['soprano', 'alto', 'tenor', 'bass'];

  // Crosspath rule (classic 2-path feel): each path max 3 tiers; after any upgrade
  // Math.min(rangeTier, damageTier) <= 2 — i.e. max deep/cross is 3/2 or 2/3.
  const UPGRADE_MAX = 3;
  const UPGRADE_CROSS_CAP = 2;

  const UPGRADE_COSTS = {
    range: [30, 65, 120],
    damage: [35, 75, 135],
  };

  const UPGRADE_NAMES = {
    range: ['Longer Breath', 'Open Hall', 'Far Gallery'],
    damage: ['Sharper Attack', 'Full Voice', 'Fortissimo'],
  };

  // Bass has infinite range — Range path buys attack speed (+ pierce at T3).
  const BASS_RANGE_NAMES = ['Quicker Cue', 'Steady Tempo', 'Echo Pierce'];

  // Soprano Damage path unlocks and deepens chain (base attack is single-target).
  const SOPRANO_DAMAGE_NAMES = ['First Echo', 'Harmony Chain', 'Cascade'];

  function cellKey(c, r) {
    return c + ',' + r;
  }

  function createTower(typeId, c, r, tileSize) {
    const def = DEFS[typeId];
    if (!def) return null;
    return {
      type: def.id,
      name: def.name,
      c,
      r,
      x: c * tileSize + tileSize / 2,
      y: r * tileSize + tileSize / 2,
      range: def.range,
      fireRate: def.fireRate,
      damage: def.damage,
      color: def.color,
      cost: def.cost,
      cooldown: 0,
      chainJumps: def.chainJumps || 0,
      chainRange: def.chainRange || 0,
      chainDamageScale: def.chainDamageScale || 0.7,
      splash: def.splash || 0,
      projectileSpeed: def.projectileSpeed || 320,
      kind: def.kind || def.id,
      auraRange: def.auraRange || 0,
      auraDamageBonus: def.auraDamageBonus || 0,
      targetMode: def.defaultTarget || 'front',
      stunTimer: 0,
      upgRange: 0,
      upgDamage: 0,
      upgradeSpent: 0,
    };
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /** Combat stats for a tower instance, including Range/Damage path bonuses. */
  function combatStats(tower) {
    const def = DEFS[tower.type] || DEFS[tower.kind];
    const ur = tower.upgRange || 0;
    const ud = tower.upgDamage || 0;
    const s = {
      range: def.range,
      fireRate: def.fireRate,
      damage: def.damage,
      splash: def.splash || 0,
      chainJumps: def.chainJumps || 0,
      chainRange: def.chainRange || 0,
      chainDamageScale: def.chainDamageScale || 0.7,
      auraRange: def.auraRange || 0,
      auraDamageBonus: def.auraDamageBonus || 0,
      projectileSpeed: def.projectileSpeed || 320,
    };

    const type = def.id;

    // --- Range path ---
    if (type === 'bass') {
      // Infinite range: faster singing + pierce at T3
      if (ur >= 1) s.fireRate *= 0.88;
      if (ur >= 2) s.fireRate *= 0.85;
      if (ur >= 3) {
        s.fireRate *= 0.82;
        s.chainJumps = Math.max(s.chainJumps, 1);
        s.chainRange = Math.max(s.chainRange, 90);
        s.chainDamageScale = Math.min(s.chainDamageScale, 0.55);
      }
    } else {
      if (type === 'soprano') {
        if (ur >= 1) s.range += 25;
        if (ur >= 2) s.range += 30;
        if (ur >= 3) s.range += 40;
        // Chain reach only matters after Damage path unlocks chaining.
        if (ud >= 1) {
          if (ur >= 1) s.chainRange += 10;
          if (ur >= 2) s.chainRange += 20;
          if (ur >= 3) s.chainRange += 25;
        }
      } else if (type === 'alto') {
        if (ur >= 1) {
          s.range += 20;
          s.auraRange += 25;
        }
        if (ur >= 2) {
          s.range += 25;
          s.auraRange += 30;
        }
        if (ur >= 3) {
          s.range += 30;
          s.auraRange += 35;
        }
      } else if (type === 'tenor') {
        if (ur >= 1) s.range += 22;
        if (ur >= 2) s.range += 28;
        if (ur >= 3) s.range += 35;
      }
    }

    // --- Damage path ---
    if (type === 'soprano') {
      // T1 unlocks chain (1 jump); deeper tiers add jumps + scale.
      if (ud >= 1) {
        s.damage += 4;
        s.chainJumps = Math.max(s.chainJumps, 1);
        s.chainRange = Math.max(s.chainRange, 100);
        s.chainDamageScale = 0.65;
      }
      if (ud >= 2) {
        s.damage += 6;
        s.chainJumps = Math.max(s.chainJumps, 2);
        s.chainRange = Math.max(s.chainRange, 110);
        s.chainDamageScale = 0.7;
      }
      if (ud >= 3) {
        s.damage += 10;
        s.chainJumps = Math.max(s.chainJumps, 3);
        s.chainRange = Math.max(s.chainRange, 125);
        s.chainDamageScale = 0.75;
      }
    } else if (type === 'alto') {
      if (ud >= 1) {
        s.damage += 3;
        s.auraDamageBonus += 0.05;
      }
      if (ud >= 2) {
        s.damage += 4;
        s.auraDamageBonus += 0.07;
      }
      if (ud >= 3) {
        s.damage += 7;
        s.auraDamageBonus += 0.1;
      }
    } else if (type === 'tenor') {
      if (ud >= 1) {
        s.damage += 5;
        s.splash += 8;
      }
      if (ud >= 2) {
        s.damage += 7;
        s.splash += 10;
      }
      if (ud >= 3) {
        s.damage += 12;
        s.splash += 14;
      }
    } else if (type === 'bass') {
      if (ud >= 1) s.damage += 12;
      if (ud >= 2) s.damage += 16;
      if (ud >= 3) s.damage += 27;
    }

    return s;
  }

  function pathProgress(e, waypoints) {
    if (!waypoints || !waypoints.length) return e.wpIndex || 0;
    const i = Math.max(0, e.wpIndex || 0);
    if (i >= waypoints.length - 1) return waypoints.length;
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const seg = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const along = Math.hypot(e.x - a.x, e.y - a.y);
    return i + Math.min(1, along / seg);
  }

  function inRangeEnemies(tower, enemies) {
    const stats = combatStats(tower);
    const list = [];
    for (const e of enemies) {
      if (!e.alive) continue;
      if (dist(tower, e) > stats.range) continue;
      list.push(e);
    }
    return list;
  }

  function pickTarget(tower, enemies, waypoints) {
    const list = inRangeEnemies(tower, enemies);
    if (!list.length) return null;

    const mode = tower.targetMode || 'front';

    if (mode === 'closest') {
      let best = null;
      let bestD = Infinity;
      for (const e of list) {
        const d = dist(tower, e);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      return best;
    }

    if (mode === 'strongest') {
      let best = null;
      let bestHp = -1;
      for (const e of list) {
        if (e.hp > bestHp) {
          bestHp = e.hp;
          best = e;
        }
      }
      return best;
    }

    if (mode === 'back') {
      let best = null;
      let bestProg = Infinity;
      for (const e of list) {
        const prog = pathProgress(e, waypoints);
        if (prog < bestProg) {
          bestProg = prog;
          best = e;
        }
      }
      return best;
    }

    // front (default): furthest along the path
    let best = null;
    let bestProg = -1;
    for (const e of list) {
      const prog = pathProgress(e, waypoints);
      if (prog > bestProg) {
        bestProg = prog;
        best = e;
      }
    }
    return best;
  }

  function damageMultiplier(tower, towers) {
    let mult = 1;
    for (const other of towers) {
      if (other === tower) continue;
      const os = combatStats(other);
      if (!os.auraRange || !os.auraDamageBonus) continue;
      if (dist(tower, other) <= os.auraRange) {
        mult += os.auraDamageBonus;
      }
    }
    return mult;
  }

  function tryFire(tower, enemies, towers, projectiles, waypoints) {
    if (tower.cooldown > 0) return;
    const target = pickTarget(tower, enemies, waypoints);
    if (!target) return;

    const stats = combatStats(tower);
    const mult = damageMultiplier(tower, towers);
    const dmg = stats.damage * mult;

    projectiles.push(
      PNProjectiles.createProjectile({
        x: tower.x,
        y: tower.y,
        tx: target.x,
        ty: target.y,
        target,
        speed: stats.projectileSpeed,
        damage: dmg,
        color: tower.color,
        splash: stats.splash || 0,
        chainLeft: stats.chainJumps || 0,
        chainRange: stats.chainRange || 0,
        chainDamageScale: stats.chainDamageScale || 0.7,
        fromTower: tower,
        kind: tower.kind,
      })
    );
    tower.cooldown = stats.fireRate;
  }

  function updateTower(tower, dt, enemies, towers, projectiles, waypoints) {
    if (tower.stunTimer > 0) {
      tower.stunTimer -= dt;
      if (tower.cooldown > 0) tower.cooldown -= dt;
      return; // stunned — cannot fire
    }
    if (tower.cooldown > 0) tower.cooldown -= dt;
    tryFire(tower, enemies, towers, projectiles, waypoints);
  }

  function stunAll(towers, duration) {
    const d = duration || 0.5;
    for (const t of towers) {
      t.stunTimer = Math.max(t.stunTimer || 0, d);
    }
  }

  function drawTower(ctx, tower, selected) {
    const x = Math.round(tower.x);
    const y = Math.round(tower.y);
    const stats = combatStats(tower);

    if (stats.auraRange) {
      ctx.strokeStyle = selected
        ? 'rgba(90, 154, 74, 0.55)'
        : 'rgba(90, 154, 74, 0.28)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, stats.auraRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (selected && Number.isFinite(stats.range)) {
      ctx.strokeStyle = 'rgba(243, 239, 228, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, stats.range, 0, Math.PI * 2);
      ctx.stroke();
    } else if (selected && !Number.isFinite(stats.range)) {
      ctx.strokeStyle = 'rgba(47, 93, 140, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(4, 4, ctx.canvas.width - 8, ctx.canvas.height - 8);
      ctx.setLineDash([]);
    }

    if (global.PNSprites && PNSprites.drawPartField) {
      PNSprites.drawPartField(ctx, tower.type, x, y, selected);
    } else {
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // stun cue — brief white/gold ring + zap marks
    if (tower.stunTimer > 0) {
      const a = Math.min(1, tower.stunTimer / 0.5);
      ctx.strokeStyle = 'rgba(232, 197, 71, ' + (0.45 + 0.45 * a) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 248, 208, ' + (0.35 * a) + ')';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8c547';
      ctx.font = 'bold 14px Georgia, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', x, y - 22);
    }

    // Tier pips under selected tower
    if (selected && ((tower.upgRange || 0) > 0 || (tower.upgDamage || 0) > 0)) {
      const ur = tower.upgRange || 0;
      const ud = tower.upgDamage || 0;
      ctx.font = '10px Georgia, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(243, 239, 228, 0.9)';
      ctx.fillText('R' + ur + ' · D' + ud, x, y + 18);
    }
  }

  function drawGhost(ctx, typeId, c, r, tileSize, valid) {
    const def = DEFS[typeId];
    if (!def) return;
    const x = c * tileSize + tileSize / 2;
    const y = r * tileSize + tileSize / 2;
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = valid ? '#f3efe4' : '#8b2942';
    ctx.lineWidth = 2;
    if (Number.isFinite(def.range)) {
      ctx.beginPath();
      ctx.arc(x, y, def.range, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (def.auraRange) {
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, def.auraRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
    if (global.PNSprites && PNSprites.drawPartFieldGhost) {
      PNSprites.drawPartFieldGhost(ctx, typeId, x, y, valid);
    } else {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function sellValue(tower) {
    const invested = (tower.cost || 0) + (tower.upgradeSpent || 0);
    return Math.floor(invested * 0.5);
  }

  function upgradeTier(tower, path) {
    return path === 'range' ? tower.upgRange || 0 : tower.upgDamage || 0;
  }

  function nextUpgradeCost(tower, path) {
    const tier = upgradeTier(tower, path);
    const costs = UPGRADE_COSTS[path];
    if (!costs || tier >= costs.length) return null;
    return costs[tier];
  }

  function upgradeName(tower, path, tierIndex) {
    if (path === 'range' && tower && tower.type === 'bass') {
      return BASS_RANGE_NAMES[tierIndex] || UPGRADE_NAMES.range[tierIndex];
    }
    if (path === 'damage' && tower && tower.type === 'soprano') {
      return SOPRANO_DAMAGE_NAMES[tierIndex] || UPGRADE_NAMES.damage[tierIndex];
    }
    const names = UPGRADE_NAMES[path];
    return names ? names[tierIndex] : 'Upgrade';
  }

  function crosspathOk(nextRange, nextDamage) {
    if (nextRange > UPGRADE_MAX || nextDamage > UPGRADE_MAX) return false;
    if (Math.min(nextRange, nextDamage) > UPGRADE_CROSS_CAP) return false;
    return true;
  }

  function canBuyUpgrade(tower, path, gold) {
    if (!tower || (path !== 'range' && path !== 'damage')) {
      return { ok: false, reason: 'none' };
    }
    const ur = tower.upgRange || 0;
    const ud = tower.upgDamage || 0;
    const nextR = path === 'range' ? ur + 1 : ur;
    const nextD = path === 'damage' ? ud + 1 : ud;
    if (path === 'range' && ur >= UPGRADE_MAX) {
      return { ok: false, reason: 'maxed' };
    }
    if (path === 'damage' && ud >= UPGRADE_MAX) {
      return { ok: false, reason: 'maxed' };
    }
    if (!crosspathOk(nextR, nextD)) {
      return { ok: false, reason: 'crosspath' };
    }
    const cost = nextUpgradeCost(tower, path);
    if (cost == null) return { ok: false, reason: 'maxed' };
    if (gold < cost) return { ok: false, reason: 'gold', cost: cost };
    const nextTierIndex = path === 'range' ? ur : ud;
    return { ok: true, cost: cost, name: upgradeName(tower, path, nextTierIndex) };
  }

  function buyUpgrade(tower, path, gold) {
    const check = canBuyUpgrade(tower, path, gold);
    if (!check.ok) return { ok: false, reason: check.reason, gold: gold };
    const cost = check.cost;
    if (path === 'range') tower.upgRange = (tower.upgRange || 0) + 1;
    else tower.upgDamage = (tower.upgDamage || 0) + 1;
    tower.upgradeSpent = (tower.upgradeSpent || 0) + cost;
    return { ok: true, cost: cost, gold: gold - cost };
  }

  function upgradeInfo(tower, path) {
    const tier = upgradeTier(tower, path);
    const cost = nextUpgradeCost(tower, path);
    const maxed = cost == null;
    const name = maxed
      ? 'Maxed'
      : upgradeName(tower, path, tier);
    return {
      path: path,
      tier: tier,
      max: UPGRADE_MAX,
      cost: cost,
      name: name,
      maxed: maxed,
    };
  }

  global.PNTowers = {
    DEFS,
    ORDER,
    TARGET_MODES,
    UPGRADE_COSTS,
    UPGRADE_MAX,
    UPGRADE_CROSS_CAP,
    createTower,
    combatStats,
    updateTower,
    stunAll,
    drawTower,
    drawGhost,
    pickTarget,
    cellKey,
    dist,
    sellValue,
    canBuyUpgrade,
    buyUpgrade,
    upgradeInfo,
    nextUpgradeCost,
    upgradeName,
  };
})(typeof window !== 'undefined' ? window : globalThis);
