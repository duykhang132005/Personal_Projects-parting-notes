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
      damage: 14,
      color: '#a51c30',
      chainJumps: 2,
      chainRange: 100,
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
    };
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
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
    const list = [];
    for (const e of enemies) {
      if (!e.alive) continue;
      if (dist(tower, e) > tower.range) continue;
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
      if (!other.auraRange || !other.auraDamageBonus) continue;
      if (dist(tower, other) <= other.auraRange) {
        mult += other.auraDamageBonus;
      }
    }
    return mult;
  }

  function tryFire(tower, enemies, towers, projectiles, waypoints) {
    if (tower.cooldown > 0) return;
    const target = pickTarget(tower, enemies, waypoints);
    if (!target) return;

    const mult = damageMultiplier(tower, towers);
    const dmg = tower.damage * mult;

    projectiles.push(
      PNProjectiles.createProjectile({
        x: tower.x,
        y: tower.y,
        tx: target.x,
        ty: target.y,
        target,
        speed: tower.projectileSpeed,
        damage: dmg,
        color: tower.color,
        splash: tower.splash || 0,
        chainLeft: tower.chainJumps || 0,
        chainRange: tower.chainRange || 0,
        chainDamageScale: tower.chainDamageScale || 0.7,
        fromTower: tower,
        kind: tower.kind,
      })
    );
    tower.cooldown = tower.fireRate;
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

    if (tower.auraRange) {
      ctx.strokeStyle = selected
        ? 'rgba(90, 154, 74, 0.55)'
        : 'rgba(90, 154, 74, 0.28)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, tower.auraRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (selected && Number.isFinite(tower.range)) {
      ctx.strokeStyle = 'rgba(243, 239, 228, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
    } else if (selected && !Number.isFinite(tower.range)) {
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
    return Math.floor((tower.cost || 0) * 0.5);
  }

  global.PNTowers = {
    DEFS,
    ORDER,
    TARGET_MODES,
    createTower,
    updateTower,
    stunAll,
    drawTower,
    drawGhost,
    pickTarget,
    cellKey,
    dist,
    sellValue,
  };
})(typeof window !== 'undefined' ? window : globalThis);
