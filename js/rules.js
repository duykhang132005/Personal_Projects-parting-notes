/* Parting Notes - pure helpers shared by the play loop and by tests */
(function (global) {
  function canAfford(gold, cost) {
    return gold >= cost;
  }

  function leakAmount(isBoss) {
    return isBoss ? 5 : 1;
  }

  function applyLifeLeak(lives, isBoss) {
    return Math.max(0, lives - leakAmount(isBoss));
  }

  // Apply already-filtered damage to an enemy. Returns whether a hit landed and whether it killed.
  function applyHit(enemy, filtered) {
    if (!enemy || filtered <= 0) return { applied: false, killed: false };
    enemy.hp -= filtered;
    const killed = enemy.hp <= 0;
    if (killed) enemy.alive = false;
    return { applied: true, killed: killed };
  }

  // ---- Upgrade hotkeys: "," buys the left path, "." the right path ----
  const UPGRADE_KEYS = { ',': 'range', '.': 'damage' };

  function upgradeKeyPath(key) {
    return Object.prototype.hasOwnProperty.call(UPGRADE_KEYS, key) ? UPGRADE_KEYS[key] : null;
  }

  // Text fields keep their own keys. Sliders, checkboxes and buttons do not count as text.
  function isTextEntry(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = String(el.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag !== 'INPUT') return false;
    const type = String(el.type || 'text').toLowerCase();
    return ['range', 'checkbox', 'radio', 'button', 'submit', 'reset', 'color', 'file', 'image'].indexOf(type) === -1;
  }

  // Same rules as the upgrade buttons. Returns null for other keys; otherwise what happened and
  // a message for the live region ('' when there is nothing to say, such as no selection).
  function upgradeByKey(state, key, towers) {
    const path = upgradeKeyPath(key);
    if (!path) return null;
    const t = state && state.selectedTower;
    if (!t) return { path: path, ok: false, reason: 'none', message: '' };
    if (state.status !== 'playing') return { path: path, ok: false, reason: 'status', message: '' };
    const label = towers.pathLabel(t, path);
    const check = towers.canBuyUpgrade(t, path, state.gold);
    if (!check.ok) {
      let message = '';
      if (check.reason === 'maxed') message = t.name + ' ' + label + ' path is maxed.';
      else if (check.reason === 'crosspath') message = t.name + ' ' + label + ' path is locked by the 3/2 crosspath limit.';
      else if (check.reason === 'gold') message = 'Need ' + check.cost + 'g for the next ' + label + ' upgrade.';
      return { path: path, ok: false, reason: check.reason, message: message };
    }
    const result = towers.buyUpgrade(t, path, state.gold);
    if (!result.ok) return { path: path, ok: false, reason: result.reason, message: '' };
    state.gold = result.gold;
    return {
      path: path,
      ok: true,
      cost: check.cost,
      name: check.name,
      message: t.name + ': bought ' + check.name + ' for ' + check.cost + 'g.',
    };
  }

  // ---- Status icons: who is affecting whom ----
  // One entry per status. shape is an SVG path in a 16 by 16 box, used both for the canvas
  // badge (Path2D) and the legend (inline SVG), so the two always match. tone names a :root token.
  const STATUS_ICONS = {
    aura: { label: 'Aura', tone: '--status-aura', shape: 'M8 3 L13 9 H10 V13 H6 V9 H3 Z' },
    blend: { label: 'Blend', tone: '--status-blend', shape: 'M3 4 L8 8 L3 12 Z M8 4 L13 8 L8 12 Z' },
    harmony: { label: 'Harmony', tone: '--status-harmony', shape: 'M6 2 H13 V4.5 H8 V12 H6 Z M11 4.5 H13 V11 H11 Z M3 12 A2.5 2 0 1 0 8 12 A2.5 2 0 1 0 3 12 Z M8.5 11 A2.5 2 0 1 0 13.5 11 A2.5 2 0 1 0 8.5 11 Z' },
    stunned: { label: 'Stunned', tone: '--status-stun', shape: 'M9 2 L4 9 H7.5 L6 14 L12 6.5 H8.5 Z' },
    cue: { label: 'Frozen by cue', tone: '--status-cue', shape: 'M2 13 L10 5 L11.5 6.5 L3.5 14.5 Z M10.5 3.5 A2 2 0 1 0 14.5 3.5 A2 2 0 1 0 10.5 3.5 Z' },
    slow: { label: 'Slowed', tone: '--status-slow', shape: 'M4 2 H12 V4 L9 8 L12 12 V14 H4 V12 L7 8 L4 4 Z' },
  };

  function pct(f) {
    return Math.round(f * 100) + '%';
  }

  function inAura(target, source, stats, T) {
    return !!(stats.auraRange && T.dist(target, source) <= stats.auraRange);
  }

  // What one tower's aura gives another (Alto auras today). Harmony also covers the Alto itself,
  // matching PNTowers.harmonyAssists; Aura and Blend skip the source, matching the multipliers.
  function givenBy(source, target, T) {
    const out = [];
    if (!source || !target) return out;
    const os = T.combatStats(source);
    if (!inAura(target, source, os, T)) return out;
    if (source !== target && os.auraDamageBonus) {
      out.push({ id: 'aura', value: os.auraDamageBonus, detail: '+' + pct(os.auraDamageBonus) + ' damage' });
    }
    if (source !== target && os.auraFireRateBonus) {
      out.push({ id: 'blend', value: os.auraFireRateBonus, detail: pct(os.auraFireRateBonus) + ' faster' });
    }
    if (source.type === 'alto' && (os.jazzCapBonus || os.folkAssist)) {
      out.push({
        id: 'harmony',
        value: os.jazzCapBonus,
        detail: '+' + os.jazzCapBonus + ' Jazz cap, +' + os.folkAssist + ' Folk assist',
      });
    }
    return out;
  }

  // Every status a tower is under right now, totalled over its sources.
  function towerStatuses(tower, towers, T) {
    const totals = {};
    const order = [];
    (towers || []).forEach((src) => {
      givenBy(src, tower, T).forEach((g) => {
        if (!totals[g.id]) {
          totals[g.id] = { id: g.id, value: 0, jazz: 0, folk: 0, sources: [] };
          order.push(g.id);
        }
        const t = totals[g.id];
        t.sources.push(src);
        if (g.id === 'harmony') {
          const os = T.combatStats(src);
          t.jazz += os.jazzCapBonus || 0;
          t.folk += os.folkAssist || 0;
        } else {
          t.value += g.value;
        }
      });
    });
    const out = order.map((id) => {
      const t = totals[id];
      const detail = id === 'aura'
        ? '+' + pct(t.value) + ' damage'
        : id === 'blend'
          ? pct(t.value) + ' faster'
          : '+' + t.jazz + ' Jazz cap, +' + t.folk + ' Folk assist';
      return { id: id, label: STATUS_ICONS[id].label, detail: detail, sources: t.sources };
    });
    if (tower && tower.stunTimer > 0) {
      out.push({ id: 'stunned', label: STATUS_ICONS.stunned.label, detail: 'Andy Clark cued, cannot sing', sources: [] });
    }
    return out;
  }

  function enemyStatuses(enemy) {
    const out = [];
    if (!enemy || !enemy.alive) return out;
    if (enemy.stunTimer > 0) out.push({ id: 'cue', label: STATUS_ICONS.cue.label, detail: 'stopped in place' });
    if (enemy.slowTimer > 0 && (enemy.slowMult == null || enemy.slowMult < 1)) {
      out.push({ id: 'slow', label: STATUS_ICONS.slow.label, detail: pct(enemy.slowMult != null ? enemy.slowMult : 0.65) + ' speed' });
    }
    return out;
  }

  // Everything to mark while a tower is selected: what it is under, what it gives other singers,
  // and the notes in its reach that carry the kind of status it applies (cue freeze or slow).
  function selectionStatuses(selected, towers, enemies, T) {
    const res = { self: [], allies: [], enemies: [] };
    if (!selected) return res;
    res.self = towerStatuses(selected, towers, T);
    (towers || []).forEach((t) => {
      if (t === selected) return;
      const given = givenBy(selected, t, T).map((g) => ({ id: g.id, label: STATUS_ICONS[g.id].label, detail: g.detail }));
      if (given.length) res.allies.push({ tower: t, statuses: given });
    });
    const s = T.combatStats(selected);
    const causes = {};
    if (s.cueRadius > 0 && s.cueStunDuration > 0) causes.cue = true;
    if (s.hitSlowDuration > 0 || s.splashSlowDuration > 0) causes.slow = true;
    if (causes.cue || causes.slow) {
      const reach = (Number.isFinite(s.range) ? s.range : Infinity) + (s.cueRadius || 0) + (s.splash || 0);
      (enemies || []).forEach((e) => {
        if (!e || !e.alive || T.dist(selected, e) > reach) return;
        const st = enemyStatuses(e).filter((x) => causes[x.id]);
        if (st.length) res.enemies.push({ enemy: e, statuses: st });
      });
    }
    return res;
  }

  // Plain lines for the panel and screen readers, so no status depends on the icon colour.
  function statusSummary(selected, sel) {
    const lines = [];
    if (!selected || !sel) return lines;
    sel.self.forEach((st) => {
      const n = st.sources.length;
      lines.push({ id: st.id, text: st.label + ': ' + st.detail + (n ? ' (from ' + n + (n === 1 ? ' Alto)' : ' Altos)') : '') });
    });
    const given = {};
    const givenOrder = [];
    sel.allies.forEach((a) => a.statuses.forEach((st) => {
      if (!given[st.id]) {
        given[st.id] = { st: st, n: 0 };
        givenOrder.push(st.id);
      }
      given[st.id].n += 1;
    }));
    givenOrder.forEach((id) => {
      const g = given[id];
      lines.push({ id: id, text: 'Gives ' + g.st.label + ' (' + g.st.detail + ') to ' + g.n + (g.n === 1 ? ' singer' : ' singers') });
    });
    const foes = {};
    sel.enemies.forEach((e) => e.statuses.forEach((st) => {
      foes[st.id] = (foes[st.id] || 0) + 1;
    }));
    Object.keys(foes).forEach((id) => {
      const n = foes[id];
      lines.push({ id: id, text: n + (n === 1 ? ' note' : ' notes') + ' in reach: ' + STATUS_ICONS[id].label.toLowerCase() });
    });
    return lines;
  }

  // Pointer position to board pixels. rect is the canvas border box; the canvas has a CSS
  // border, so subtract it and scale the content box to the drawing size.
  function boardPoint(clientX, clientY, rect, box) {
    const w = box.clientWidth || rect.width;
    const h = box.clientHeight || rect.height;
    return {
      x: (clientX - rect.left - (box.clientLeft || 0)) * (box.width / w),
      y: (clientY - rect.top - (box.clientTop || 0)) * (box.height / h),
    };
  }

  // First button on the win / loss card: "Play again" after a win, "Retry" otherwise.
  function endPrimaryLabel(kind) {
    return kind === 'Victory' ? 'Play again' : 'Retry';
  }

  global.PNRules = {
    canAfford,
    endPrimaryLabel,
    boardPoint,
    leakAmount,
    applyLifeLeak,
    applyHit,
    UPGRADE_KEYS,
    upgradeKeyPath,
    isTextEntry,
    upgradeByKey,
    STATUS_ICONS,
    givenBy,
    towerStatuses,
    enemyStatuses,
    selectionStatuses,
    statusSummary,
  };
})(typeof window !== 'undefined' ? window : globalThis);
