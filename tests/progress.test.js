'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadLevels, memoryStorage } = require('./helpers/load-game.js');

const PROGRESS_KEY = 'parting-notes-progress';

describe('progress', () => {
  it('markCleared saves progress and unlocks the next stage', () => {
    const { context, localStorage } = loadLevels();
    const PNLevels = context.PNLevels;

    const before = PNLevels.loadProgress();
    assert.equal(before.unlocked, 1);
    assert.equal(before.cleared.length, 0);
    assert.equal(PNLevels.getNextLevel('approach').id, 'entrance');

    const after = PNLevels.markCleared('approach');
    assert.ok(after.cleared.includes('approach'));
    assert.equal(after.unlocked, 2);

    const raw = localStorage.getItem(PROGRESS_KEY);
    assert.ok(raw);
    const stored = JSON.parse(raw);
    assert.ok(stored.cleared.includes('approach'));
    assert.equal(stored.unlocked, 2);
  });

  it('clearing Closing Night unlocks Choir Andy and Encore', () => {
    const { context, localStorage } = loadLevels();
    const PNLevels = context.PNLevels;

    assert.equal(PNLevels.isTowerUnlocked('soprano'), true);
    assert.equal(PNLevels.isTowerUnlocked('andy'), false);
    assert.equal(PNLevels.hasUnlockedAndy(), false);
    assert.equal(PNLevels.isEndlessUnlocked(), false);

    const after = PNLevels.markCleared('closing');
    assert.ok(after.cleared.includes('closing'));
    assert.ok(after.towersUnlocked.includes('andy'));
    assert.equal(after.unlocked, PNLevels.LEVELS.length);
    assert.equal(PNLevels.hasUnlockedAndy(), true);
    assert.equal(PNLevels.isTowerUnlocked('andy'), true);
    assert.equal(PNLevels.isEndlessUnlocked(), true);

    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    assert.ok(stored.cleared.includes('closing'));
    assert.ok(stored.towersUnlocked.includes('andy'));
  });

  it('saveProgress fails gracefully when setItem throws, and markCleared does not throw', () => {
    const store = memoryStorage();
    store.setItem = function setItem() {
      throw new Error('QuotaExceededError');
    };
    const { context } = loadLevels({ localStorage: store });
    const PNLevels = context.PNLevels;

    assert.equal(PNLevels.saveProgress({ unlocked: 1, cleared: [], towersUnlocked: [] }), false);

    let threw = false;
    let result;
    try {
      result = PNLevels.markCleared('approach');
    } catch (err) {
      threw = true;
    }
    assert.equal(threw, false);
    assert.ok(result);
    assert.ok(result.cleared.includes('approach'));
    assert.equal(result.unlocked, 2);
  });
});
