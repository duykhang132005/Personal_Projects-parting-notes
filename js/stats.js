/* Parting Notes: local per-stage stats and the Encore (endless) best wave */
(function (global) {
  // Kept apart from the progress key (parting-notes-progress) so stats can never corrupt saves.
  const STATS_KEY = 'pn_stage_stats_v1';
  const ENCORE_BEST_KEY = 'pn_encore_best_v1';

  // Debug runs (?debug) read stats but never write them, so test runs cannot skew real numbers.
  function canWrite() {
    return !(global.PNLevels && PNLevels.isDebug && PNLevels.isDebug());
  }

  function emptyStage() {
    return { clears: 0, losses: 0, bestLives: null, lastLossWave: null, lossWaves: {} };
  }

  function cleanStage(s) {
    const out = emptyStage();
    if (!s || typeof s !== 'object') return out;
    out.clears = Math.max(0, Math.floor(Number(s.clears) || 0));
    out.losses = Math.max(0, Math.floor(Number(s.losses) || 0));
    if (Number.isFinite(Number(s.bestLives)) && s.bestLives !== null) out.bestLives = Math.max(0, Math.floor(Number(s.bestLives)));
    if (Number.isFinite(Number(s.lastLossWave)) && s.lastLossWave !== null) out.lastLossWave = Math.max(1, Math.floor(Number(s.lastLossWave)));
    if (s.lossWaves && typeof s.lossWaves === 'object') {
      Object.keys(s.lossWaves).forEach(function (w) {
        const n = Math.floor(Number(s.lossWaves[w]) || 0);
        if (/^\d+$/.test(w) && n > 0) out.lossWaves[w] = n;
      });
    }
    return out;
  }

  function loadAll() {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      const d = raw ? JSON.parse(raw) : null;
      const stages = {};
      if (d && d.stages && typeof d.stages === 'object') {
        Object.keys(d.stages).forEach(function (id) {
          stages[id] = cleanStage(d.stages[id]);
        });
      }
      return { v: 1, stages: stages };
    } catch (_) {
      return { v: 1, stages: {} };
    }
  }

  function saveAll(all) {
    if (!canWrite()) return false;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(all));
      return true;
    } catch (_) {
      return false;
    }
  }

  function get(levelId) {
    const all = loadAll();
    return all.stages[levelId] ? all.stages[levelId] : emptyStage();
  }

  function recordWin(levelId, livesLeft) {
    if (!levelId || !canWrite()) return null;
    const all = loadAll();
    const s = all.stages[levelId] || emptyStage();
    s.clears += 1;
    const lives = Math.max(0, Math.floor(Number(livesLeft) || 0));
    if (s.bestLives === null || lives > s.bestLives) s.bestLives = lives;
    all.stages[levelId] = s;
    saveAll(all);
    return s;
  }

  function recordLoss(levelId, wave) {
    if (!levelId || !canWrite()) return null;
    const all = loadAll();
    const s = all.stages[levelId] || emptyStage();
    s.losses += 1;
    const w = Math.max(1, Math.floor(Number(wave) || 1));
    s.lastLossWave = w;
    s.lossWaves[w] = (s.lossWaves[w] || 0) + 1;
    all.stages[levelId] = s;
    saveAll(all);
    return s;
  }

  /** Wave the player loses on most often (ties go to the earlier wave), or null. */
  function commonLossWave(s) {
    let best = null;
    let bestN = 0;
    Object.keys((s && s.lossWaves) || {}).forEach(function (w) {
      const n = s.lossWaves[w];
      if (n > bestN || (n === bestN && Number(w) < Number(best))) {
        bestN = n;
        best = Number(w);
      }
    });
    return best;
  }

  /** Short readout for a map node, e.g. "Best 18 lives" or "2 losses". Empty when unplayed. */
  function nodeSummary(s) {
    if (!s) return '';
    if (s.clears > 0 && s.bestLives !== null) return 'Best ' + s.bestLives + (s.bestLives === 1 ? ' life' : ' lives');
    if (s.losses > 0) return s.losses + (s.losses === 1 ? ' loss' : ' losses');
    return '';
  }

  /** Fuller line for the detail panel. */
  function detailText(s) {
    if (!s || (s.clears === 0 && s.losses === 0)) return 'No runs recorded yet.';
    const parts = ['Clears ' + s.clears, 'Losses ' + s.losses];
    if (s.bestLives !== null) parts.push('Best ' + s.bestLives + (s.bestLives === 1 ? ' life left' : ' lives left'));
    if (s.lastLossWave !== null) {
      let loss = 'Last loss on wave ' + s.lastLossWave;
      const common = commonLossWave(s);
      if (common !== null && s.losses > 1 && common !== s.lastLossWave) loss += ' (most often wave ' + common + ')';
      parts.push(loss);
    }
    return parts.join(' · ') + '.';
  }

  function getEncoreBest() {
    try {
      const n = Math.floor(Number(localStorage.getItem(ENCORE_BEST_KEY)) || 0);
      return Math.max(0, n);
    } catch (_) {
      return 0;
    }
  }

  /** Saves wavesSurvived if it beats the stored best. Returns true when a new best was saved. */
  function submitEncoreWaves(wavesSurvived) {
    const n = Math.max(0, Math.floor(Number(wavesSurvived) || 0));
    if (!canWrite() || n <= getEncoreBest()) return false;
    try {
      localStorage.setItem(ENCORE_BEST_KEY, String(n));
      return true;
    } catch (_) {
      return false;
    }
  }

  /** Clears stage stats and the Encore best only. Progress, unlocks and volume are untouched. */
  function resetAll() {
    try {
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem(ENCORE_BEST_KEY);
    } catch (_) {}
  }

  global.PNStats = {
    STATS_KEY,
    ENCORE_BEST_KEY,
    get,
    loadAll,
    recordWin,
    recordLoss,
    commonLossWave,
    nodeSummary,
    detailText,
    getEncoreBest,
    submitEncoreWaves,
    resetAll,
    canWrite,
  };
})(typeof window !== 'undefined' ? window : globalThis);
