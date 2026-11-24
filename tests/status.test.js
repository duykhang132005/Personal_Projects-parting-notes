'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts } = require('./helpers/load-game.js');

function load() {
  const { context } = loadScripts(['js/enemies.js', 'js/towers.js', 'js/rules.js']);
  return { T: context.PNTowers, R: context.PNRules };
}

function tower(T, type, c, r, ur, ud) {
  const t = T.createTower(type, c, r, 64);
  t.upgRange = ur || 0;
  t.upgDamage = ud || 0;
  return t;
}

describe('status detection', () => {
  it('an Alto aura buffs singers inside its radius only, matching the damage multiplier', () => {
    const { T, R } = load();
    const alto = tower(T, 'alto', 5, 5);
    const near = tower(T, 'soprano', 7, 5); // 128 px away, aura is 200
    const far = tower(T, 'soprano', 0, 0); // about 362 px away
    const towers = [alto, near, far];

    const nearSt = R.towerStatuses(near, towers, T);
    assert.deepEqual(Array.from(nearSt, (s) => s.id), ['aura']);
    assert.equal(nearSt[0].detail, '+25% damage');
    assert.equal(T.damageMultiplier(near, towers), 1.25);
    assert.equal(R.towerStatuses(far, towers, T).length, 0);
    assert.equal(T.damageMultiplier(far, towers), 1);

    const sel = R.selectionStatuses(alto, towers, [], T);
    assert.equal(sel.allies.length, 1);
    assert.equal(sel.allies[0].tower, near);
    const lines = R.statusSummary(alto, sel);
    assert.ok(lines.some((l) => l.text === 'Gives Aura (+25% damage) to 1 singer'), JSON.stringify(lines));
  });

  it('stacks two Altos and reports Blend and Harmony from upgraded Altos', () => {
    const { T, R } = load();
    const a1 = tower(T, 'alto', 4, 4, 2, 0); // Blend
    const a2 = tower(T, 'alto', 6, 4, 3, 0); // Harmony
    const bass = tower(T, 'bass', 5, 5);
    const towers = [a1, a2, bass];
    const st = R.towerStatuses(bass, towers, T);
    const byId = Object.fromEntries(Array.from(st, (s) => [s.id, s]));
    assert.equal(byId.aura.detail, '+50% damage');
    assert.equal(byId.aura.sources.length, 2);
    assert.equal(byId.blend.detail, '20% faster');
    assert.ok(Math.abs(T.fireRateMultiplier(bass, towers) - 1.2) < 1e-9);
    assert.equal(byId.harmony.detail, '+3 Jazz cap, +6 Folk assist');
    const assist = T.harmonyAssists(bass, towers);
    assert.equal(assist.jazzCapBonus, 3);
    assert.equal(assist.folkAssist, 6);
    const lines = R.statusSummary(bass, R.selectionStatuses(bass, towers, [], T));
    assert.ok(lines.some((l) => l.text === 'Aura: +50% damage (from 2 Altos)'), JSON.stringify(lines));
  });

  it('shows a boss stun on the selected singer and frozen or slowed notes for Andy and Bass', () => {
    const { T, R } = load();
    const andy = tower(T, 'andy', 2, 2);
    andy.stunTimer = 0.3;
    const frozen = { alive: true, x: andy.x + 100, y: andy.y, stunTimer: 0.4, slowTimer: 0 };
    const away = { alive: true, x: andy.x + 2000, y: andy.y, stunTimer: 0.4, slowTimer: 0 };
    const slowed = { alive: true, x: andy.x + 50, y: andy.y, stunTimer: 0, slowTimer: 1, slowMult: 0.7 };
    const sel = R.selectionStatuses(andy, [andy], [frozen, away, slowed], T);
    assert.deepEqual(Array.from(sel.self, (s) => s.id), ['stunned']);
    assert.equal(sel.enemies.length, 1, 'only the frozen note in reach, and Andy does not slow');
    assert.equal(sel.enemies[0].enemy, frozen);

    const bass = tower(T, 'bass', 2, 2, 0, 2); // Drone slows
    const bsel = R.selectionStatuses(bass, [bass], [frozen, slowed, away], T);
    assert.deepEqual(Array.from(bsel.enemies, (e) => e.statuses[0].id), ['slow']);
    assert.equal(bsel.enemies[0].statuses[0].detail, '70% speed');
    assert.equal(R.selectionStatuses(tower(T, 'soprano', 1, 1), [], [frozen, slowed], T).enemies.length, 0);
  });

  it('has a drawn shape and a label for every status id', () => {
    const { R } = load();
    for (const id of ['aura', 'blend', 'harmony', 'stunned', 'cue', 'slow']) {
      const def = R.STATUS_ICONS[id];
      assert.ok(def && def.label && /^M/.test(def.shape) && /^--status-/.test(def.tone), id);
    }
  });
});

describe('upgrade hotkeys', () => {
  it('"," and "." buy the left and right paths with the same rules as the buttons', () => {
    const { T, R } = load();
    assert.equal(R.upgradeKeyPath(','), 'range');
    assert.equal(R.upgradeKeyPath('.'), 'damage');
    assert.equal(R.upgradeByKey({ selectedTower: null }, 'x', T), null);

    const t = tower(T, 'soprano', 1, 1);
    const state = { selectedTower: null, status: 'playing', gold: 1000 };
    const none = R.upgradeByKey(state, ',', T);
    assert.equal(none.ok, false);
    assert.equal(none.message, '');
    assert.equal(state.gold, 1000);

    state.selectedTower = t;
    const r1 = R.upgradeByKey(state, ',', T);
    assert.equal(r1.ok, true);
    assert.equal(t.upgRange, 1);
    assert.equal(state.gold, 1000 - T.UPGRADE_COSTS.range[0]);
    assert.equal(r1.message, 'Soprano: bought Breath Control for 30g.');

    R.upgradeByKey(state, ',', T);
    R.upgradeByKey(state, ',', T);
    assert.equal(t.upgRange, 3);
    const maxed = R.upgradeByKey(state, ',', T);
    assert.equal(maxed.reason, 'maxed');
    assert.match(maxed.message, /maxed/);

    R.upgradeByKey(state, '.', T);
    R.upgradeByKey(state, '.', T);
    assert.equal(t.upgDamage, 2);
    const cross = R.upgradeByKey(state, '.', T);
    assert.equal(cross.reason, 'crosspath');
    assert.equal(t.upgDamage, 2);

    const t2 = tower(T, 'bass', 3, 3);
    const poor = { selectedTower: t2, status: 'playing', gold: 10 };
    const g = R.upgradeByKey(poor, '.', T);
    assert.equal(g.reason, 'gold');
    assert.equal(g.message, 'Need 35g for the next Weight upgrade.');
    assert.equal(poor.gold, 10);
    assert.equal(t2.upgDamage, 0);

    const ended = { selectedTower: t2, status: 'won', gold: 1000 };
    assert.equal(R.upgradeByKey(ended, '.', T).ok, false);
    assert.equal(t2.upgDamage, 0);
  });

  it('ignores the keys while typing in a text field', () => {
    const { R } = load();
    assert.equal(R.isTextEntry({ tagName: 'INPUT', type: 'text' }), true);
    assert.equal(R.isTextEntry({ tagName: 'TEXTAREA' }), true);
    assert.equal(R.isTextEntry({ tagName: 'DIV', isContentEditable: true }), true);
    assert.equal(R.isTextEntry({ tagName: 'INPUT', type: 'range' }), false);
    assert.equal(R.isTextEntry({ tagName: 'BUTTON' }), false);
    assert.equal(R.isTextEntry(null), false);
  });
});

describe('board pointer mapping', () => {
  it('maps a click through the CSS border and scale to the right board pixel', () => {
    const { R } = load();
    // 768 by 640 board shown at 384 by 320 inside a 4 px border, placed at (100, 50).
    const rect = { left: 100, top: 50, width: 392, height: 328 };
    const box = { clientLeft: 4, clientTop: 4, clientWidth: 384, clientHeight: 320, width: 768, height: 640 };
    const topLeft = R.boardPoint(104, 54, rect, box);
    assert.equal(topLeft.x, 0);
    assert.equal(topLeft.y, 0);
    const p = R.boardPoint(104 + 96, 54 + 160, rect, box);
    assert.equal(p.x, 192);
    assert.equal(p.y, 320);
    assert.equal(Math.floor(p.x / 64), 3);
    assert.equal(Math.floor(p.y / 64), 5);
    const end = R.boardPoint(104 + 384, 54 + 320, rect, box);
    assert.equal(end.x, 768);
    assert.equal(end.y, 640);
  });
});


describe('end card', () => {
  it('offers Play again after a win (Carol finale included) and Retry after a loss', () => {
    const { R } = load();
    assert.equal(R.endPrimaryLabel('Victory'), 'Play again');
    assert.equal(R.endPrimaryLabel('Defeat'), 'Retry');
    assert.equal(R.endPrimaryLabel('Encore over'), 'Retry');
  });
});

describe('map static layer cache', () => {
  function stubCtx(counts) {
    const grad = { addColorStop() {} };
    const noop = () => {};
    return {
      save: noop,
      restore: noop,
      beginPath: noop,
      closePath: noop,
      moveTo: noop,
      lineTo: noop,
      arc: noop,
      ellipse: noop,
      rect: noop,
      roundRect: noop,
      quadraticCurveTo: noop,
      bezierCurveTo: noop,
      translate: noop,
      rotate: noop,
      scale: noop,
      setLineDash: noop,
      fill() { counts.drawOps += 1; },
      stroke() { counts.drawOps += 1; },
      fillRect() { counts.drawOps += 1; },
      strokeRect() { counts.drawOps += 1; },
      fillText() { counts.drawOps += 1; },
      strokeText() { counts.drawOps += 1; },
      drawImage(img, x, y) { counts.blits.push({ img, x, y }); },
      createLinearGradient() { return grad; },
      createRadialGradient() { return grad; },
    };
  }

  const sampleLevel = {
    id: 'approach',
    index: 0,
    cols: 12,
    rows: 10,
    tile: 64,
    path: [[0, 4], [5, 4], [5, 6], [11, 6]],
    blocks: [[2, 2]],
    snow: true,
  };

  it('falls back to direct drawing when document is absent', () => {
    const { context } = loadScripts(['js/map.js']);
    const map = context.PNMap.createMap(sampleLevel);
    const counts = { drawOps: 0, blits: [] };
    map.draw(stubCtx(counts));
    assert.ok(counts.drawOps > 0);
    assert.equal(counts.blits.length, 0);
  });

  it('pre-renders static layers once onto an offscreen 768x640 canvas and blits on draw', () => {
    const offCounts = { drawOps: 0, blits: [] };
    const offCanvas = {
      width: 0,
      height: 0,
      getContext(kind) {
        return kind === '2d' ? stubCtx(offCounts) : null;
      },
    };
    let created = 0;
    const { context } = loadScripts(['js/map.js'], {
      globals: {
        document: {
          createElement(tag) {
            if (tag === 'canvas') {
              created += 1;
              return offCanvas;
            }
            return null;
          },
        },
      },
    });
    const map = context.PNMap.createMap(sampleLevel);
    assert.equal(created, 1);
    assert.equal(offCanvas.width, 768);
    assert.equal(offCanvas.height, 640);
    assert.ok(offCounts.drawOps > 0);
    const initialOffOps = offCounts.drawOps;

    const screenCounts = { drawOps: 0, blits: [] };
    const screenCtx = stubCtx(screenCounts);
    map.draw(screenCtx);
    map.draw(screenCtx);
    assert.equal(screenCounts.drawOps, 0);
    assert.equal(screenCounts.blits.length, 2);
    assert.equal(screenCounts.blits[0].img, offCanvas);
    assert.equal(screenCounts.blits[0].x, 0);
    assert.equal(screenCounts.blits[0].y, 0);
    assert.equal(offCounts.drawOps, initialOffOps);
  });
});
