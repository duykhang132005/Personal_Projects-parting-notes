'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts } = require('./helpers/load-game.js');

function load() {
  const { context } = loadScripts(['js/towers.js', 'js/skills.js']);
  return { T: context.PNTowers, S: context.PNSkills };
}

describe('Dictionary skill descriptions', () => {
  it('describes every tier of every path for every singer, with plain words and numbers', () => {
    const { T, S } = load();
    for (const type of T.ORDER_ALL) {
      const info = S.forTower(type);
      assert.ok(info.role.length > 10, type + ' has a role line');
      assert.ok(info.base.length >= 3, type + ' has base stats');
      assert.equal(info.paths.length, 2);
      info.paths.forEach((p) => {
        assert.equal(p.label, T.PATH_LABELS[type][p.path]);
        assert.equal(p.tiers.length, T.UPGRADE_MAX);
        p.tiers.forEach((t, i) => {
          assert.equal(t.name, T.UPGRADE_NAMES_BY_VOICE[type][p.path][i]);
          assert.equal(t.cost, T.UPGRADE_COSTS[p.path][i]);
          assert.ok(t.what.length > 10, t.name + ' has a plain-words line');
          assert.ok(t.nums.length >= 1, t.name + ' has at least one number');
          assert.ok(t.nums.some((n) => /[0-9]/.test(n)), t.name + ' has a number');
          assert.ok([t.what].concat(t.nums).every((x) => x.indexOf('\u2014') === -1), 'no em dashes');
        });
        // Tier 3 carries the crosspath note.
        assert.match(p.tiers[2].note, /tier 2 or lower/);
        assert.equal(p.tiers[0].note, '');
      });
    }
  });

  it('takes its numbers from combatStats, so they follow towers.js', () => {
    const { T, S } = load();
    const echo = S.describe('soprano', 'damage', 0);
    const base = T.combatStats({ type: 'soprano', upgRange: 0, upgDamage: 0 });
    const t1 = T.combatStats({ type: 'soprano', upgRange: 0, upgDamage: 1 });
    assert.ok(echo.nums.includes('+' + (t1.damage - base.damage) + ' damage (' + base.damage + ' to ' + t1.damage + ')'));

    const onBeat = S.describe('bass', 'range', 0);
    assert.ok(onBeat.nums.some((n) => n.startsWith('20% shorter shot delay')), onBeat.nums.join('; '));

    const curtain = S.describe('andy', 'damage', 2);
    assert.ok(curtain.nums.some((n) => n.includes('cue freeze (0.6 s to 0.72 s)')), curtain.nums.join('; '));

    const crescendo = S.describe('tenor', 'damage', 2);
    assert.ok(crescendo.nums.some((n) => n.includes('after ' + T.CRESCENDO.streak + ' splash hits')));

    // Changing the data changes the text.
    T.DEFS.soprano.damage = 30;
    const echo2 = S.describe('soprano', 'damage', 0);
    assert.ok(echo2.nums.includes('+4 damage (30 to 34)'), echo2.nums.join('; '));
    assert.ok(S.baseLines('soprano').includes('Damage 30'));
  });
});
