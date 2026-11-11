'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadTowers, loadCombat } = require('./helpers/load-game.js');

describe('combat and lives', () => {
  it('range targeting picks in-range enemies and ignores out-of-range ones', () => {
    const PNTowers = loadTowers();
    const tower = PNTowers.createTower('soprano', 0, 0, 40);
    tower.targetMode = 'closest';
    // Soprano base range is 140. Tower center is (20, 20).
    const inside = { alive: true, x: 20 + 100, y: 20, hp: 10 };
    const edge = { alive: true, x: 20 + 140, y: 20, hp: 10 };
    const outside = { alive: true, x: 20 + 200, y: 20, hp: 10 };
    const deadInside = { alive: false, x: 20 + 10, y: 20, hp: 0 };

    assert.equal(PNTowers.dist(tower, inside) < PNTowers.combatStats(tower).range, true);
    assert.equal(PNTowers.dist(tower, outside) > PNTowers.combatStats(tower).range, true);

    assert.equal(PNTowers.pickTarget(tower, [inside, outside]), inside);
    assert.equal(PNTowers.pickTarget(tower, [outside, inside]), inside);
    assert.equal(PNTowers.pickTarget(tower, [outside]), null);
    assert.equal(PNTowers.pickTarget(tower, [deadInside, outside]), null);
    assert.equal(PNTowers.pickTarget(tower, [edge]), edge);
  });

  it('filterDamage and applyHit reduce HP or kill, and ignore a zero hit', () => {
    const { PNEnemies, PNRules } = loadCombat();
    const enemy = { hp: 20, maxHp: 20, alive: true, style: 'normal', isBoss: false };
    const filtered = PNEnemies.filterDamage(enemy, 8);
    assert.equal(filtered, 8);
    const hit = PNRules.applyHit(enemy, filtered);
    assert.equal(hit.applied, true);
    assert.equal(hit.killed, false);
    assert.equal(enemy.hp, 12);
    assert.equal(enemy.alive, true);

    const kill = PNRules.applyHit(enemy, 12);
    assert.equal(kill.applied, true);
    assert.equal(kill.killed, true);
    assert.equal(enemy.alive, false);
    assert.ok(enemy.hp <= 0);

    const alreadyDeadHp = enemy.hp;
    const zero = PNRules.applyHit(enemy, 0);
    assert.equal(zero.applied, false);
    assert.equal(zero.killed, false);
    assert.equal(enemy.hp, alreadyDeadHp);
  });

  it('jazz caps and folk blocks flow through filterDamage before a hit applies', () => {
    const { PNEnemies, PNRules } = loadCombat();
    const jazz = { hp: 50, alive: true, style: 'jazz', isBoss: false };
    const capped = PNEnemies.filterDamage(jazz, 16);
    assert.equal(capped, PNEnemies.JAZZ_CAP);
    assert.equal(PNRules.applyHit(jazz, capped).applied, true);
    assert.equal(jazz.hp, 50 - PNEnemies.JAZZ_CAP);

    const folk = { hp: 50, alive: true, style: 'folk', isBoss: false };
    const blocked = PNEnemies.filterDamage(folk, PNEnemies.FOLK_MIN - 1);
    assert.equal(blocked, 0);
    assert.equal(PNRules.applyHit(folk, blocked).applied, false);
    assert.equal(folk.hp, 50);
    assert.equal(PNEnemies.filterDamage(folk, PNEnemies.FOLK_MIN), PNEnemies.FOLK_MIN);
  });

  it('leaks remove lives, with bosses costing more, and never go below zero', () => {
    const { PNRules } = loadCombat();
    assert.equal(PNRules.leakAmount(false), 1);
    assert.equal(PNRules.leakAmount(true), 5);
    assert.equal(PNRules.applyLifeLeak(10, false), 9);
    assert.equal(PNRules.applyLifeLeak(10, true), 5);
    assert.equal(PNRules.applyLifeLeak(3, true), 0);
    assert.equal(PNRules.applyLifeLeak(1, false), 0);
    assert.equal(PNRules.applyLifeLeak(0, false), 0);
  });
});
