'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadTowers, loadCombat } = require('./helpers/load-game.js');

describe('economy and upgrades', () => {
  it('uses the published tower prices', () => {
    const PNTowers = loadTowers();
    assert.equal(PNTowers.DEFS.soprano.cost, 55);
    assert.equal(PNTowers.DEFS.alto.cost, 75);
    assert.equal(PNTowers.DEFS.tenor.cost, 75);
    assert.equal(PNTowers.DEFS.bass.cost, 100);
    assert.equal(PNTowers.DEFS.andy.cost, 190);
  });

  it('afford check blocks when gold is too low and allows when it is enough', () => {
    const { PNRules } = loadCombat();
    const cost = 55;
    assert.equal(PNRules.canAfford(cost - 1, cost), false);
    assert.equal(PNRules.canAfford(cost, cost), true);
    assert.equal(PNRules.canAfford(cost + 1, cost), true);
    assert.equal(PNRules.canAfford(0, cost), false);
  });

  it('sell value is half of cost plus upgrade spend, rounded down', () => {
    const PNTowers = loadTowers();
    const tower = PNTowers.createTower('soprano', 0, 0, 40);
    assert.equal(PNTowers.sellValue(tower), Math.floor(55 * 0.5));
    tower.upgradeSpent = 30;
    assert.equal(PNTowers.sellValue(tower), Math.floor((55 + 30) * 0.5));
    const bass = PNTowers.createTower('bass', 1, 1, 40);
    assert.equal(PNTowers.sellValue(bass), Math.floor(100 * 0.5));
  });

  it('enforces the 3/2 crosspath cap and still allows a legal 3/2 path', () => {
    const PNTowers = loadTowers();
    const tower = PNTowers.createTower('soprano', 0, 0, 40);
    const plenty = 9999;

    tower.upgRange = 0;
    tower.upgDamage = 0;
    assert.equal(PNTowers.canBuyUpgrade(tower, 'range', plenty).ok, true);
    assert.equal(PNTowers.canBuyUpgrade(tower, 'damage', plenty).ok, true);

    tower.upgRange = 3;
    tower.upgDamage = 1;
    const toThreeTwo = PNTowers.canBuyUpgrade(tower, 'damage', plenty);
    assert.equal(toThreeTwo.ok, true);

    tower.upgRange = 3;
    tower.upgDamage = 2;
    const overCap = PNTowers.canBuyUpgrade(tower, 'damage', plenty);
    assert.equal(overCap.ok, false);
    assert.equal(overCap.reason, 'crosspath');

    tower.upgRange = 2;
    tower.upgDamage = 2;
    assert.equal(PNTowers.canBuyUpgrade(tower, 'range', plenty).ok, true);
    assert.equal(PNTowers.canBuyUpgrade(tower, 'damage', plenty).ok, true);
  });

  it('blocks an upgrade when gold is short of the next tier cost', () => {
    const PNTowers = loadTowers();
    const tower = PNTowers.createTower('soprano', 0, 0, 40);
    const cost = PNTowers.nextUpgradeCost(tower, 'range');
    assert.ok(cost > 0);
    const short = PNTowers.canBuyUpgrade(tower, 'range', cost - 1);
    assert.equal(short.ok, false);
    assert.equal(short.reason, 'gold');
    assert.equal(PNTowers.canBuyUpgrade(tower, 'range', cost).ok, true);
  });
});
