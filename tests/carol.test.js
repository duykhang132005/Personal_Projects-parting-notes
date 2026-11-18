'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts, loadLevels, memoryStorage } = require('./helpers/load-game.js');

const PROGRESS_KEY = 'parting-notes-progress';
const MAIN_IDS = [
  'approach', 'entrance', 'hallway', 'elevator', 'finale',
  'encore', 'greenroom', 'dock', 'tourbus', 'closing',
];
const CAROL_IDS = ['carol-marley', 'carol-past', 'carol-present', 'carol-future', 'carol-morning'];

function storeWith(progress) {
  const store = memoryStorage();
  store.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return store;
}

describe('A Christmas Carol act', () => {
  it('has five staves in story order with valid paths, blocks and waves', () => {
    const { context } = loadScripts(['js/levels.js', 'js/enemies.js']);
    const { PNLevels, PNEnemies } = context;
    const carol = PNLevels.CAROL_LEVELS;
    assert.deepEqual(Array.from(carol, (l) => l.id), CAROL_IDS);
    // The main campaign is untouched.
    assert.deepEqual(Array.from(PNLevels.LEVELS, (l) => l.id), MAIN_IDS);

    const { COLS, ROWS } = PNLevels;
    const allIndexes = new Set(PNLevels.ALL_LEVELS.map((l) => l.index));
    assert.equal(allIndexes.size, PNLevels.ALL_LEVELS.length, 'stage indexes are unique');

    carol.forEach((level, i) => {
      assert.equal(level.act, 'carol');
      assert.equal(level.actIndex, i);
      assert.equal(level.index, PNLevels.LEVELS.length + i);
      assert.equal(PNLevels.getLevel(level.id), level);
      assert.equal(PNLevels.getLevel(level.index), level);
      assert.ok(level.lives > 0 && level.gold > 0, level.id + ' has lives and gold');
      assert.ok(level.mapTheme >= 0 && level.mapTheme < PNLevels.LEVELS.length, level.id + ' reuses a backdrop');

      const path = level.path;
      assert.ok(path.length >= 12, level.id + ' path is long enough');
      assert.equal(path[0][0], 0, level.id + ' path starts at the left edge');
      assert.equal(path[path.length - 1][0], COLS - 1, level.id + ' path ends at the right edge');
      const cells = new Set();
      path.forEach(([c, r], k) => {
        assert.ok(c >= 0 && c < COLS && r >= 0 && r < ROWS, level.id + ' cell in bounds');
        const key = c + ',' + r;
        assert.ok(!cells.has(key), level.id + ' path does not cross itself at ' + key);
        cells.add(key);
        if (k > 0) {
          const [pc, pr] = path[k - 1];
          assert.equal(Math.abs(c - pc) + Math.abs(r - pr), 1, level.id + ' path steps one tile at ' + key);
        }
      });
      level.blocks.forEach(([c, r]) => {
        assert.ok(c >= 0 && c < COLS && r >= 0 && r < ROWS, level.id + ' block in bounds');
        assert.ok(!cells.has(c + ',' + r), level.id + ' block is off the path');
      });

      assert.ok(level.waves.length >= 8, level.id + ' has a full set of waves');
      level.waves.forEach((w) => {
        assert.ok(w.spawnGap > 0);
        assert.ok(w.entries.length > 0);
        w.entries.forEach((e) => {
          assert.ok(PNEnemies.TYPES[e.type], level.id + ' uses a real note type: ' + e.type);
          assert.ok(PNEnemies.STYLES[e.style], level.id + ' uses a real style: ' + e.style);
          assert.ok(Number.isInteger(e.count) && e.count >= 1);
        });
      });
    });

    // Andy Clark returns in Yet to Come.
    const future = PNLevels.getLevel('carol-future');
    assert.ok(future.waves.some((w) => w.entries.some((e) => e.type === 'andy')));
  });

  it('maps each stave to its own audio track under assets/audio/carol', () => {
    const { context } = loadLevels();
    const PNLevels = context.PNLevels;
    const urls = PNLevels.CAROL_LEVELS.map((l) => PNLevels.trackUrl(l));
    urls.forEach((url, i) => {
      assert.match(url, /^assets\/audio\/carol\/[a-z0-9-]+\.mp3$/);
      assert.equal(url, 'assets/audio/carol/' + PNLevels.CAROL_LEVELS[i].music + '.mp3');
    });
    assert.equal(new Set(urls).size, urls.length, 'tracks are not shared');
    assert.equal(PNLevels.trackUrl('carol-marley'), 'assets/audio/carol/carol-marley.mp3');
    // Main stages and Encore use their own excerpts outside the carol folder.
    PNLevels.LEVELS.concat([PNLevels.ENDLESS_LEVEL]).forEach((l) => {
      assert.match(PNLevels.trackUrl(l), /^assets\/audio\/stages\/[a-z0-9-]+\.mp3$/);
    });
  });

  it('stays locked until Closing Night is cleared, then opens one stave at a time', () => {
    const { context } = loadLevels({
      localStorage: storeWith({ unlocked: 10, cleared: MAIN_IDS.slice(0, 9), towersUnlocked: [] }),
    });
    const PNLevels = context.PNLevels;
    assert.equal(PNLevels.isCarolUnlocked(), false);
    PNLevels.CAROL_LEVELS.forEach((l) => assert.equal(PNLevels.isLevelUnlocked(l), false));
    assert.equal(PNLevels.getNextLevel('closing'), null, 'Closing Night still ends the main campaign');

    PNLevels.markCleared('closing');
    assert.equal(PNLevels.isCarolUnlocked(), true);
    assert.equal(PNLevels.isLevelUnlocked('carol-marley'), true);
    assert.equal(PNLevels.isLevelUnlocked('carol-past'), false);

    for (let i = 0; i < CAROL_IDS.length; i++) {
      assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[i]), true, CAROL_IDS[i] + ' is open');
      if (i + 1 < CAROL_IDS.length) {
        assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[i + 1]), false, CAROL_IDS[i + 1] + ' waits');
        assert.equal(PNLevels.getNextLevel(CAROL_IDS[i]).id, CAROL_IDS[i + 1]);
      } else {
        assert.equal(PNLevels.getNextLevel(CAROL_IDS[i]), null, 'Christmas Morning ends the act');
      }
      const p = PNLevels.markCleared(CAROL_IDS[i]);
      assert.ok(p.cleared.includes(CAROL_IDS[i]));
      // Carol clears never change the main campaign count.
      assert.equal(p.unlocked, 10);
    }
    assert.ok(CAROL_IDS.every((id) => PNLevels.isLevelUnlocked(id)));
  });

  it('clearing a Carol stave saves it without unlocking main stages', () => {
    const { context, localStorage } = loadLevels({
      localStorage: storeWith({ unlocked: 2, cleared: ['approach', 'closing'], towersUnlocked: [] }),
    });
    const PNLevels = context.PNLevels;
    const p = PNLevels.markCleared('carol-marley');
    assert.equal(p.unlocked, 2);
    assert.equal(PNLevels.isLevelUnlocked('hallway'), false);
    assert.equal(PNLevels.isLevelUnlocked('carol-past'), true);
    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    assert.ok(stored.cleared.includes('carol-marley'));
    assert.equal(stored.unlocked, 2);
  });

  it('loads older save shapes without losing progress', () => {
    // A finished save from before Carol and before tower unlock tracking.
    const old = { unlocked: 10, cleared: MAIN_IDS.slice() };
    const { context, localStorage } = loadLevels({ localStorage: storeWith(old) });
    const PNLevels = context.PNLevels;
    const p = PNLevels.loadProgress();
    assert.equal(p.unlocked, 10);
    assert.deepEqual(Array.from(p.cleared), MAIN_IDS);
    assert.ok(p.towersUnlocked.includes('andy'));
    MAIN_IDS.forEach((id) => assert.equal(PNLevels.isLevelUnlocked(id), true, id + ' stays open'));
    assert.equal(PNLevels.isLevelUnlocked('carol-marley'), true, 'the act opens for finished saves');
    assert.equal(PNLevels.isLevelUnlocked('carol-past'), false);
    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    assert.equal(stored.unlocked, 10);
    assert.deepEqual(stored.cleared, MAIN_IDS);

    // A mid-campaign save keeps its place and the act stays locked.
    const mid = loadLevels({ localStorage: storeWith({ unlocked: 4, cleared: MAIN_IDS.slice(0, 3) }) }).context.PNLevels;
    assert.equal(mid.loadProgress().unlocked, 4);
    assert.equal(mid.isLevelUnlocked('elevator'), true);
    assert.equal(mid.isLevelUnlocked('finale'), false);
    assert.equal(mid.isCarolUnlocked(), false);

    // A broken save still starts cleanly.
    const store = memoryStorage();
    store.setItem(PROGRESS_KEY, '{not json');
    const broken = loadLevels({ localStorage: store }).context.PNLevels;
    assert.equal(broken.loadProgress().unlocked, 1);
    assert.equal(broken.isLevelUnlocked('carol-marley'), false);
  });
});

describe('Carol stave tuning', () => {
  it('toughens Christmas Past and Present notes without extra kill gold', () => {
    const { context } = loadScripts(['js/levels.js', 'js/waves.js']);
    const { PNLevels, PNWaves } = context;
    const mults = (id) => {
      const out = new Set();
      PNLevels.getLevel(id).waves.forEach((w) => w.entries.forEach((e) => out.add(e.hpMult || 1)));
      return Array.from(out);
    };
    // Christmas Past and Present were won with two unupgraded singers in a headless run, so
    // their notes carry more HP; Present stays a step harder than Past.
    const past = mults('carol-past');
    const present = mults('carol-present');
    assert.equal(past.length, 1);
    assert.equal(present.length, 1);
    assert.ok(past[0] > 1 && present[0] > past[0]);
    // The other staves and every main stage are unchanged.
    ['carol-marley', 'carol-future', 'carol-morning'].concat(MAIN_IDS).forEach((id) => {
      assert.deepEqual(mults(id), [1], id + ' keeps base HP');
    });
    // The HP boost reaches the spawned notes; kill gold is not scaled.
    const director = PNWaves.createDirector(PNLevels.getLevel('carol-present').waves, { betweenDelay: 3 });
    director.begin();
    let spawned = null;
    for (let i = 0; i < 50 && !spawned; i++) spawned = director.update(0.1, 0).spawned;
    assert.ok(spawned, 'first note spawns');
    assert.equal(spawned.hpMult, present[0]);
    assert.equal(spawned.goldMult, undefined);
  });
});

