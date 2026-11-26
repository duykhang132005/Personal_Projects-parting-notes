'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadScripts, loadLevels, memoryStorage } = require('./helpers/load-game.js');

const ROOT = path.join(__dirname, '..');

const PROGRESS_KEY = 'parting-notes-progress';
const MAIN_IDS = [
  'approach', 'entrance', 'hallway', 'elevator', 'finale',
  'encore', 'greenroom', 'dock', 'tourbus', 'closing',
];
// One stave per track of the recording, in track order (01 to 30).
const TRACKS = [
  ['carol-01-truth-from-above', 'The Truth from Above'],
  ['carol-02-counting-house', 'In the Counting-House'],
  ['carol-03-surplus-population', 'Surplus Population'],
  ['carol-04-god-rest-you-merry', 'God Rest You Merry, Gentlemen'],
  ['carol-marley', "Marley's Ghost"],
  ['carol-06-mankind-was-my-business', 'Mankind Was My Business'],
  ['carol-07-remember', 'Remember'],
  ['carol-08-ghost-of-christmas-past', 'The Ghost of Christmas Past'],
  ['carol-09-little-fan', 'Little Fan'],
  ['carol-10-sussex-carol', 'Sussex Carol'],
  ['carol-past', "Fezziwig's Ball"],
  ['carol-12-gain-is-loss', 'Gain Is Loss'],
  ['carol-13-auld-lang-syne', 'Auld Lang Syne'],
  ['carol-present', 'The Ghost of Christmas Present'],
  ['carol-15-christmas-journey', 'A Christmas Journey'],
  ['carol-16-a-child-himself', 'A Child Himself'],
  ['carol-17-deck-the-halls', 'Deck the Halls'],
  ['carol-18-bob-cratchits-house', "Bob Cratchit's House"],
  ['carol-19-silent-night', 'Silent Night'],
  ['carol-20-bell-struck-twelve', 'The Bell Struck Twelve'],
  ['carol-future', 'Ghost of the Future'],
  ['carol-22-body-of-a-man', 'The Body of a Man'],
  ['carol-23-spirit-of-tiny-tim', 'Spirit of Tiny Tim'],
  ['carol-24-coventry-carol', 'Coventry Carol'],
  ['carol-25-spirits-of-all-three', 'The Spirits of All Three'],
  ['carol-26-poverty', 'Poverty'],
  ['carol-27-christmas-day', 'Christmas Day'],
  ['carol-28-back-payments', 'Back Payments'],
  ['carol-morning', 'God Bless Us, Every One'],
  ['carol-30-midnight-clear', 'It Came Upon the Midnight Clear'],
];
const CAROL_IDS = TRACKS.map((t) => t[0]);
// The five staves of the first Carol release keep their ids, so old saves still match.
const LEGACY_IDS = ['carol-marley', 'carol-past', 'carol-present', 'carol-future', 'carol-morning'];
const LEGACY_SLOTS = [5, 11, 14, 21, 29];
const FINAL_ID = 'carol-30-midnight-clear';

function storeWith(progress) {
  const store = memoryStorage();
  store.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return store;
}

describe('A Christmas Carol act', () => {
  it('has 30 staves in track order with valid paths, blocks and waves', () => {
    const { context } = loadScripts(['js/levels.js', 'js/enemies.js']);
    const { PNLevels, PNEnemies } = context;
    const carol = PNLevels.CAROL_LEVELS;
    assert.equal(carol.length, 30);
    assert.deepEqual(Array.from(carol, (l) => l.id), CAROL_IDS);
    assert.deepEqual(Array.from(carol, (l) => l.name), TRACKS.map((t) => t[1]));
    LEGACY_IDS.forEach((id, i) => assert.equal(PNLevels.getLevel(id).actIndex + 1, LEGACY_SLOTS[i], id + ' sits in its track slot'));
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

    // Every new layout is its own map, not a copy of another stage.
    const shapes = new Set(PNLevels.ALL_LEVELS.map((l) => JSON.stringify(l.path)));
    assert.equal(shapes.size, PNLevels.ALL_LEVELS.length, 'no two stages share a path');

    // Andy Clark returns in Ghost of the Future, The Spirits of All Three, God Bless Us and the finale.
    const withAndy = carol.filter((l) => l.waves.some((w) => w.entries.some((e) => e.type === 'andy')));
    assert.deepEqual(Array.from(withAndy, (l) => l.id), [
      'carol-future', 'carol-25-spirits-of-all-three', 'carol-morning', FINAL_ID,
    ]);
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
    urls.forEach((url) => assert.ok(fs.existsSync(path.join(ROOT, url)), url + ' exists on disk'));
    // The five original files keep their names.
    LEGACY_IDS.forEach((id) => assert.equal(PNLevels.trackUrl(id), 'assets/audio/carol/' + id + '.mp3'));
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
    assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[0]), true);
    assert.equal(PNLevels.carolFrontier().id, CAROL_IDS[0]);
    CAROL_IDS.slice(1).forEach((id) => assert.equal(PNLevels.isLevelUnlocked(id), false, id + ' waits'));

    for (let i = 0; i < CAROL_IDS.length; i++) {
      assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[i]), true, CAROL_IDS[i] + ' is open');
      if (i + 1 < CAROL_IDS.length) {
        assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[i + 1]), false, CAROL_IDS[i + 1] + ' waits');
        assert.equal(PNLevels.getNextLevel(CAROL_IDS[i]).id, CAROL_IDS[i + 1]);
      } else {
        assert.equal(PNLevels.getNextLevel(CAROL_IDS[i]), null, 'It Came Upon the Midnight Clear ends the act');
      }
      const p = PNLevels.markCleared(CAROL_IDS[i]);
      assert.ok(p.cleared.includes(CAROL_IDS[i]));
      // Carol clears never change the main campaign count.
      assert.equal(p.unlocked, 10);
    }
    assert.ok(CAROL_IDS.every((id) => PNLevels.isLevelUnlocked(id)));
    assert.equal(PNLevels.carolFrontier(), null, 'the act is complete');
  });

  it('clearing a Carol stave saves it without unlocking main stages', () => {
    const { context, localStorage } = loadLevels({
      localStorage: storeWith({ unlocked: 2, cleared: ['approach', 'closing'], towersUnlocked: [] }),
    });
    const PNLevels = context.PNLevels;
    const p = PNLevels.markCleared(CAROL_IDS[0]);
    assert.equal(p.unlocked, 2);
    assert.equal(PNLevels.isLevelUnlocked('hallway'), false);
    assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[1]), true);
    assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[2]), false);
    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    assert.ok(stored.cleared.includes(CAROL_IDS[0]));
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
    assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[0]), true, 'the act opens for finished saves');
    assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[1]), false);
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
    assert.equal(broken.isLevelUnlocked(CAROL_IDS[0]), false);
  });

  it('keeps clears from five-stave saves and continues one stave at a time', () => {
    // Mid-act save from the five-stave release: Marley and Christmas Past were cleared.
    const midSave = { unlocked: 10, cleared: MAIN_IDS.concat(['carol-marley', 'carol-past']), towersUnlocked: ['andy'] };
    const { context, localStorage } = loadLevels({ localStorage: storeWith(midSave) });
    const PNLevels = context.PNLevels;
    const p = PNLevels.loadProgress();
    assert.deepEqual(Array.from(p.cleared), midSave.cleared, 'no clears are lost');
    assert.equal(p.unlocked, 10);
    // Cleared staves stay open for replay; play continues after the last cleared stave
    // (Christmas Past is stave 11, so the frontier is Gain Is Loss).
    assert.equal(PNLevels.isLevelUnlocked('carol-marley'), true);
    assert.equal(PNLevels.isLevelUnlocked('carol-past'), true);
    assert.equal(PNLevels.carolFrontier().id, 'carol-12-gain-is-loss');
    assert.equal(PNLevels.isLevelUnlocked('carol-12-gain-is-loss'), true);
    const openNew = CAROL_IDS.filter((id) => !LEGACY_IDS.includes(id) && PNLevels.isLevelUnlocked(id));
    assert.deepEqual(openNew, ['carol-12-gain-is-loss'], 'only one new stave is open');
    CAROL_IDS.slice(0, 4).forEach((id) => {
      assert.equal(PNLevels.isLevelUnlocked(id), false, id + ' stays closed behind the resume point');
    });
    // Loading does not rewrite the save.
    assert.deepEqual(JSON.parse(localStorage.getItem(PROGRESS_KEY)), midSave);

    // A save that finished the five-stave act keeps all five clears and continues at the finale,
    // the first uncleared stave after God Bless Us, Every One.
    const doneSave = { unlocked: 10, cleared: MAIN_IDS.concat(LEGACY_IDS), towersUnlocked: ['andy'] };
    const done = loadLevels({ localStorage: storeWith(doneSave) }).context.PNLevels;
    assert.deepEqual(Array.from(done.loadProgress().cleared), doneSave.cleared);
    LEGACY_IDS.forEach((id) => assert.equal(done.isLevelUnlocked(id), true, id + ' stays open'));
    assert.equal(done.carolFrontier().id, FINAL_ID);
    assert.equal(done.isLevelUnlocked(FINAL_ID), true);
    CAROL_IDS.filter((id) => !LEGACY_IDS.includes(id) && id !== FINAL_ID).forEach((id) => {
      assert.equal(done.isLevelUnlocked(id), false, id + ' stays closed until the finale, or until it is reached in order');
    });
    assert.equal(done.loadProgress().unlocked, 10, 'Carol clears never move the main campaign');
  });

  it('opens the stave after Marley, not stave 1, when an old save only cleared carol-marley', () => {
    const old = { unlocked: 10, cleared: MAIN_IDS.concat(['carol-marley']), towersUnlocked: ['andy'] };
    const { context, localStorage } = loadLevels({ localStorage: storeWith(old) });
    const PNLevels = context.PNLevels;
    assert.deepEqual(Array.from(PNLevels.loadProgress().cleared), old.cleared, 'no clears are lost');
    assert.equal(PNLevels.isLevelUnlocked('carol-marley'), true, 'Marley stays open for replay');
    assert.equal(PNLevels.carolFrontier().id, 'carol-06-mankind-was-my-business');
    assert.equal(PNLevels.isLevelUnlocked('carol-06-mankind-was-my-business'), true);
    assert.equal(PNLevels.isLevelUnlocked(CAROL_IDS[0]), false, 'stave 1 is not opened as a new stave');
    CAROL_IDS.slice(0, 4).forEach((id) => {
      assert.equal(PNLevels.isLevelUnlocked(id), false, id + ' is not open as new');
    });
    CAROL_IDS.slice(6).forEach((id) => {
      assert.equal(PNLevels.isLevelUnlocked(id), false, id + ' still waits');
    });
    assert.equal(PNLevels.loadProgress().unlocked, 10);
    assert.deepEqual(JSON.parse(localStorage.getItem(PROGRESS_KEY)), old);
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
    // The other original staves and every main stage are unchanged.
    ['carol-marley', 'carol-future', 'carol-morning'].concat(MAIN_IDS).forEach((id) => {
      assert.deepEqual(mults(id), [1], id + ' keeps base HP');
    });
    // New staves use the same style of HP boost, never above x1.35.
    PNLevels.CAROL_LEVELS.forEach((l) => mults(l.id).forEach((m) => assert.ok(m >= 1 && m <= 1.35, l.id + ' HP x' + m)));
    // The HP boost reaches the spawned notes; kill gold is not scaled.
    const director = PNWaves.createDirector(PNLevels.getLevel('carol-present').waves, { betweenDelay: 3 });
    director.begin();
    let spawned = null;
    for (let i = 0; i < 50 && !spawned; i++) spawned = director.update(0.1, 0).spawned;
    assert.ok(spawned, 'first note spawns');
    assert.equal(spawned.hpMult, present[0]);
    assert.equal(spawned.goldMult, undefined);
  });

  it('ramps difficulty gently across the act', () => {
    const { context } = loadScripts(['js/levels.js', 'js/enemies.js']);
    const { PNLevels, PNEnemies } = context;
    // Weighted note HP: jazz and folk notes take more work to clear than plain notes.
    const weight = { normal: 1, jazz: 1.6, folk: 1.4 };
    const load = (l) => l.waves.reduce((sum, w) => sum + w.entries.reduce((s, e) => {
      const t = PNEnemies.TYPES[e.type];
      return s + e.count * t.hp * (e.hpMult || 1) * (t.isBoss ? 1 : weight[e.style]);
    }, 0), 0);
    const loads = PNLevels.CAROL_LEVELS.map(load);
    // Each map page of five is harder on average than the page before it.
    const pages = [0, 1, 2, 3, 4, 5].map((p) => loads.slice(p * 5, p * 5 + 5).reduce((a, b) => a + b, 0) / 5);
    for (let p = 1; p < pages.length; p++) assert.ok(pages[p] > pages[p - 1], 'page ' + (p + 1) + ' is harder');
    // The first stave is the gentlest and the finale the hardest.
    assert.equal(Math.min(...loads), loads[0]);
    assert.equal(Math.max(...loads), loads[loads.length - 1]);
    // No stave jumps far past the one before it, and lives never go up along the act.
    for (let i = 1; i < loads.length; i++) {
      assert.ok(loads[i] <= loads[i - 1] * 1.25, PNLevels.CAROL_LEVELS[i].id + ' is not a spike');
      assert.ok(PNLevels.CAROL_LEVELS[i].lives <= PNLevels.CAROL_LEVELS[i - 1].lives);
    }
  });
});

