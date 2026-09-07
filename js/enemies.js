/* Parting Notes — music-note enemies */
(function (global) {
  const TYPES = {
    eighth: { id: 'eighth', name: 'Eighth', hp: 20, speed: 90, gold: 4, color: '#e8c547' },
    quarter: { id: 'quarter', name: 'Quarter', hp: 40, speed: 60, gold: 6, color: '#1a1f16' },
    half: { id: 'half', name: 'Half', hp: 100, speed: 40, gold: 12, color: '#2f5d8c' },
    whole: { id: 'whole', name: 'Whole', hp: 200, speed: 28, gold: 20, color: '#8b2942' },
    /** Conductor boss — Closing Night only. */
    andy: {
      id: 'andy',
      name: 'Andy Clark',
      hp: 1400,
      speed: 24,
      gold: 120,
      color: '#1a1a1e',
      isBoss: true,
      singInterval: 3.5,
      stunDuration: 0.5,
    },
  };

  /** Jazz: each hit's effective damage is capped (high DPS wastes overkill). */
  const JAZZ_CAP = 10;
  /** Folk: hits below this deal 0; only high damage gets through. */
  const FOLK_MIN = 20;

  const STYLES = {
    normal: { id: 'normal' },
    jazz: { id: 'jazz', name: 'Jazz' },
    folk: { id: 'folk', name: 'Folk' },
  };

  function dist(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.hypot(dx, dy);
  }

  /**
   * @param {string} typeId
   * @param {Array} waypoints
   * @param {string|object} [styleOrOpts] style id or { style }
   */
  function createEnemy(typeId, waypoints, styleOrOpts) {
    const def = TYPES[typeId] || TYPES.quarter;
    const start = waypoints[0];
    let style = 'normal';
    if (typeof styleOrOpts === 'string') style = styleOrOpts;
    else if (styleOrOpts && typeof styleOrOpts === 'object' && styleOrOpts.style) {
      style = styleOrOpts.style;
    }
    if (!STYLES[style]) style = 'normal';

    const isBoss = !!def.isBoss;
    const styleLabel =
      !isBoss && style !== 'normal' && STYLES[style].name ? STYLES[style].name + ' ' : '';

    return {
      type: def.id,
      style: isBoss ? 'normal' : style,
      name: isBoss ? def.name : styleLabel + def.name,
      maxHp: def.hp,
      hp: def.hp,
      speed: def.speed,
      gold: def.gold,
      color: def.color,
      isBoss,
      singInterval: def.singInterval || 0,
      stunDuration: def.stunDuration || 0,
      singTimer: isBoss ? (def.singInterval || 3.5) * 0.6 : 0,
      singFlash: 0,
      x: start.x,
      y: start.y,
      wpIndex: 0,
      alive: true,
      reachedEnd: false,
    };
  }

  /** Apply jazz cap / folk threshold to raw hit damage. */
  function filterDamage(enemy, amount) {
    let dmg = amount;
    if (!enemy || dmg <= 0) return 0;
    if (enemy.isBoss || enemy.type === 'andy') return dmg;
    if (enemy.style === 'jazz') {
      dmg = Math.min(dmg, JAZZ_CAP);
    } else if (enemy.style === 'folk') {
      if (dmg < FOLK_MIN) return 0;
    }
    return dmg;
  }

  /** Tick boss sing timer; returns true if he just cued a stun. */
  function tickBossSing(e, dt) {
    if (!e || !e.alive || !e.isBoss) return false;
    if (e.singFlash > 0) e.singFlash -= dt;
    e.singTimer -= dt;
    if (e.singTimer <= 0) {
      e.singTimer = e.singInterval || 3.5;
      e.singFlash = 0.45;
      return true;
    }
    return false;
  }

  function updateEnemy(e, waypoints, dt) {
    if (!e.alive || e.reachedEnd) return;
    if (e.wpIndex >= waypoints.length - 1) {
      e.reachedEnd = true;
      e.alive = false;
      return;
    }

    const target = waypoints[e.wpIndex + 1];
    const d = dist(e, target);
    const step = e.speed * dt;
    if (d <= step || d < 0.5) {
      e.x = target.x;
      e.y = target.y;
      e.wpIndex += 1;
      if (e.wpIndex >= waypoints.length - 1) {
        e.reachedEnd = true;
        e.alive = false;
      }
      return;
    }
    const t = step / d;
    e.x += (target.x - e.x) * t;
    e.y += (target.y - e.y) * t;
  }

  function drawNote(ctx, e) {
    if (!e.alive) return;
    const x = Math.round(e.x);
    const y = Math.round(e.y);

    if (e.isBoss || e.type === 'andy') {
      if (global.PNSprites && PNSprites.drawAndyClark) {
        PNSprites.drawAndyClark(ctx, x, y - 6, {
          scale: 1.4,
          flash: e.singFlash > 0,
        });
      } else if (global.PNSprites && PNSprites.drawNote) {
        PNSprites.drawNote(ctx, 'andy', x, y - 6);
      } else {
        ctx.fillStyle = '#1a1a1e';
        ctx.fillRect(x - 14, y - 20, 28, 36);
      }
      // boss name tag
      ctx.font = 'bold 11px Georgia, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(20,10,8,0.85)';
      ctx.strokeText('Andy Clark', x, y - 36);
      ctx.fillStyle = '#f3efe4';
      ctx.fillText('Andy Clark', x, y - 36);
      const w = 48;
      const ratio = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = '#1a1f16';
      ctx.fillRect(x - w / 2, y + 28, w, 6);
      ctx.fillStyle = '#c41e3a';
      ctx.fillRect(x - w / 2, y + 28, w * ratio, 6);
      return;
    }

    if (global.PNSprites && PNSprites.drawNote) {
      PNSprites.drawNote(ctx, e.type, x, y - 4, e.style || 'normal');
    } else {
      ctx.fillStyle = e.style === 'folk' ? '#6b4423' : e.color;
      ctx.fillRect(x - 10, y - 8, 20, 16);
    }

    // hp bar
    const w = 32;
    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = '#1a1f16';
    ctx.fillRect(x - w / 2, y + 18, w, 5);
    ctx.fillStyle = e.style === 'jazz' ? '#e8c547' : e.style === 'folk' ? '#8b6340' : '#7cb86a';
    ctx.fillRect(x - w / 2, y + 18, w * ratio, 5);
  }

  global.PNEnemies = {
    TYPES,
    STYLES,
    JAZZ_CAP,
    FOLK_MIN,
    createEnemy,
    filterDamage,
    tickBossSing,
    updateEnemy,
    drawNote,
  };
})(typeof window !== 'undefined' ? window : globalThis);
