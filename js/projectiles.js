/* Parting Notes — projectiles */
(function (global) {
  function createProjectile(opts) {
    return {
      x: opts.x,
      y: opts.y,
      tx: opts.tx,
      ty: opts.ty,
      target: opts.target || null,
      speed: opts.speed || 320,
      damage: opts.damage || 10,
      color: opts.color || '#f3efe4',
      splash: opts.splash || 0,
      chainLeft: opts.chainLeft || 0,
      chainRange: opts.chainRange || 0,
      chainDamageScale: opts.chainDamageScale || 0.7,
      fromTower: opts.fromTower || null,
      alive: true,
      kind: opts.kind || 'bolt',
    };
  }

  function updateProjectile(p, dt, enemies, onHit) {
    if (!p.alive) return;

    // Home toward live target if still alive
    if (p.target && p.target.alive) {
      p.tx = p.target.x;
      p.ty = p.target.y;
    }

    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const step = p.speed * dt;

    if (d <= step || d < 4) {
      p.x = p.tx;
      p.y = p.ty;
      p.alive = false;
      if (typeof onHit === 'function') onHit(p);
      return;
    }

    p.x += (dx / d) * step;
    p.y += (dy / d) * step;
  }

  function drawProjectile(ctx, p) {
    if (!p.alive) return;
    ctx.fillStyle = p.color;
    const s = p.kind === 'bass' ? 6 : 4;
    ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
  }

  global.PNProjectiles = {
    createProjectile,
    updateProjectile,
    drawProjectile,
  };
})(typeof window !== 'undefined' ? window : globalThis);
