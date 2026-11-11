'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts } = require('./helpers/load-game.js');

const FAIR_HARVARD = /fair-harvard/;

function stubDocument() {
  return {
    hidden: false,
    readyState: 'complete',
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() {
      return [];
    },
  };
}

function load() {
  const { context } = loadScripts(['js/levels.js', 'js/ui.js', 'js/audio.js'], {
    globals: { document: stubDocument() },
  });
  return context;
}

describe('music mapping', () => {
  it('plays Fair Harvard on the menu bed only', () => {
    const { PNAudio, PNLevels } = load();
    assert.ok(PNAudio.bgmCandidates('title').some((u) => FAIR_HARVARD.test(u)), 'menu has Fair Harvard');
    ['adventure', 'play', 'closing'].forEach((mode) => {
      const chain = Array.from(PNAudio.bgmCandidates(mode));
      assert.ok(!chain.some((u) => FAIR_HARVARD.test(u)), mode + ' never falls back to Fair Harvard');
    });
    assert.match(PNLevels.MUSIC.menu, FAIR_HARVARD);
  });

  it('gives every map page its own non-Fair-Harvard track', () => {
    const { PNLevels, PNUI } = load();
    const pages = PNUI.MAP_PAGES.length;
    assert.equal(pages, 4);
    const urls = [];
    for (let p = 0; p < pages; p++) {
      const url = PNLevels.pageTrackUrl(p);
      assert.match(url, /^assets\/audio\/map\/page-\d\.mp3$/);
      assert.doesNotMatch(url, FAIR_HARVARD);
      urls.push(url);
    }
    assert.equal(new Set(urls).size, pages, 'pages do not share a track');
    assert.equal(PNLevels.pageTrackUrl(pages), null);
  });

  it('gives every stage, Carol stave and Encore its own non-Fair-Harvard track', () => {
    const { PNLevels } = load();
    const levels = PNLevels.ALL_LEVELS.concat([PNLevels.ENDLESS_LEVEL]);
    assert.equal(levels.length, 16);
    const urls = levels.map((l) => PNLevels.trackUrl(l));
    urls.forEach((url, i) => {
      assert.ok(url, levels[i].id + ' has a track');
      assert.match(url, /^assets\/audio\/(stages|carol)\/[a-z0-9-]+\.mp3$/);
      assert.doesNotMatch(url, FAIR_HARVARD);
    });
    assert.equal(new Set(urls).size, urls.length, 'stages do not share a track');
    const pageUrls = new Set(PNLevels.MUSIC.pages);
    urls.forEach((u) => assert.ok(!pageUrls.has(u), 'stage and map tracks differ'));
  });
});
