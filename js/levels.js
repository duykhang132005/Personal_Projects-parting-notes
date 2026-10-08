/* Parting Notes — adventure levels (maps + difficulty) */
(function (global) {
  const COLS = 12;
  const ROWS = 10;
  const TILE = 64;

  /** Scale base wave templates by difficulty. Preserves style on entries. */
  function scaleWaves(base, mult, gapScale) {
    return base.map((w) => ({
      spawnGap: Math.max(0.35, (w.spawnGap || 0.7) * gapScale),
      entries: (w.entries || []).map((e) => ({
        type: e.type,
        style: e.style || 'normal',
        count: Math.max(1, Math.round(e.count * mult)),
      })),
    }));
  }

  const WAVE_EASY = [
    { entries: [{ type: 'quarter', count: 5 }], spawnGap: 1.0 },
    { entries: [{ type: 'eighth', count: 6 }, { type: 'quarter', count: 3 }], spawnGap: 0.85 },
    { entries: [{ type: 'quarter', count: 7 }], spawnGap: 0.8 },
    { entries: [{ type: 'half', count: 1 }, { type: 'quarter', count: 5 }], spawnGap: 0.85 },
    { entries: [{ type: 'eighth', count: 8 }, { type: 'quarter', count: 4 }], spawnGap: 0.7 },
    { entries: [{ type: 'half', count: 2 }, { type: 'eighth', count: 6 }], spawnGap: 0.75 },
  ];

  const WAVE_MID = [
    { entries: [{ type: 'quarter', count: 6 }], spawnGap: 0.9 },
    { entries: [{ type: 'eighth', count: 8 }, { type: 'quarter', count: 4 }], spawnGap: 0.7 },
    { entries: [{ type: 'quarter', count: 8 }, { type: 'eighth', count: 6 }], spawnGap: 0.65 },
    { entries: [{ type: 'half', count: 2 }, { type: 'quarter', count: 6 }], spawnGap: 0.75 },
    { entries: [{ type: 'eighth', count: 12 }, { type: 'quarter', count: 6 }], spawnGap: 0.55 },
    { entries: [{ type: 'half', count: 3 }, { type: 'eighth', count: 8 }], spawnGap: 0.65 },
    { entries: [{ type: 'quarter', count: 10 }, { type: 'half', count: 3 }], spawnGap: 0.6 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'eighth', count: 8 }], spawnGap: 0.55 },
  ];

  const WAVE_HARD = [
    { entries: [{ type: 'eighth', count: 10 }, { type: 'quarter', count: 6 }], spawnGap: 0.65 },
    { entries: [{ type: 'quarter', count: 10 }, { type: 'eighth', count: 8 }], spawnGap: 0.55 },
    { entries: [{ type: 'half', count: 3 }, { type: 'quarter', count: 8 }], spawnGap: 0.6 },
    { entries: [{ type: 'eighth', count: 14 }, { type: 'half', count: 3 }], spawnGap: 0.5 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'quarter', count: 8 }], spawnGap: 0.55 },
    { entries: [{ type: 'half', count: 4 }, { type: 'eighth', count: 12 }], spawnGap: 0.5 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'half', count: 3 }, { type: 'eighth', count: 10 }], spawnGap: 0.48 },
    { entries: [{ type: 'whole', count: 2 }, { type: 'half', count: 4 }, { type: 'eighth', count: 12 }], spawnGap: 0.45 },
    { entries: [{ type: 'eighth', count: 16 }, { type: 'quarter', count: 10 }, { type: 'half', count: 4 }], spawnGap: 0.42 },
    { entries: [{ type: 'whole', count: 3 }, { type: 'half', count: 5 }, { type: 'eighth', count: 14 }], spawnGap: 0.4 },
  ];

  /** Encore — introduce jazz notes (damage-capped glitter). */
  const WAVE_ENCORE = [
    { entries: [{ type: 'quarter', count: 8 }, { type: 'eighth', count: 6 }], spawnGap: 0.6 },
    { entries: [{ type: 'quarter', style: 'jazz', count: 4 }, { type: 'eighth', count: 8 }], spawnGap: 0.55 },
    { entries: [{ type: 'half', count: 2 }, { type: 'quarter', style: 'jazz', count: 5 }], spawnGap: 0.55 },
    { entries: [{ type: 'eighth', style: 'jazz', count: 10 }, { type: 'quarter', count: 6 }], spawnGap: 0.5 },
    { entries: [{ type: 'half', count: 3 }, { type: 'eighth', count: 10 }, { type: 'quarter', style: 'jazz', count: 4 }], spawnGap: 0.48 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'quarter', style: 'jazz', count: 6 }, { type: 'eighth', count: 8 }], spawnGap: 0.5 },
    { entries: [{ type: 'half', style: 'jazz', count: 2 }, { type: 'eighth', count: 12 }, { type: 'quarter', count: 6 }], spawnGap: 0.45 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'half', count: 3 }, { type: 'eighth', style: 'jazz', count: 10 }], spawnGap: 0.42 },
    { entries: [{ type: 'eighth', count: 14 }, { type: 'quarter', style: 'jazz', count: 8 }, { type: 'half', count: 3 }], spawnGap: 0.4 },
    { entries: [{ type: 'whole', count: 2 }, { type: 'half', style: 'jazz', count: 3 }, { type: 'eighth', count: 12 }], spawnGap: 0.38 },
  ];

  /** Green room / dock — heavier jazz mix. */
  const WAVE_JAZZ_HEAVY = [
    { entries: [{ type: 'eighth', count: 10 }, { type: 'quarter', style: 'jazz', count: 6 }], spawnGap: 0.55 },
    { entries: [{ type: 'quarter', count: 8 }, { type: 'eighth', style: 'jazz', count: 10 }], spawnGap: 0.5 },
    { entries: [{ type: 'half', style: 'jazz', count: 2 }, { type: 'quarter', count: 8 }, { type: 'eighth', count: 8 }], spawnGap: 0.5 },
    { entries: [{ type: 'eighth', style: 'jazz', count: 14 }, { type: 'half', count: 3 }], spawnGap: 0.45 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'quarter', style: 'jazz', count: 8 }, { type: 'eighth', count: 8 }], spawnGap: 0.48 },
    { entries: [{ type: 'half', count: 3 }, { type: 'quarter', style: 'jazz', count: 6 }, { type: 'eighth', style: 'jazz', count: 10 }], spawnGap: 0.44 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'half', style: 'jazz', count: 3 }, { type: 'eighth', count: 12 }], spawnGap: 0.42 },
    { entries: [{ type: 'whole', count: 2 }, { type: 'half', count: 3 }, { type: 'quarter', style: 'jazz', count: 8 }, { type: 'eighth', count: 10 }], spawnGap: 0.4 },
    { entries: [{ type: 'eighth', style: 'jazz', count: 16 }, { type: 'quarter', count: 8 }, { type: 'half', style: 'jazz', count: 3 }], spawnGap: 0.38 },
    { entries: [{ type: 'whole', count: 2 }, { type: 'half', style: 'jazz', count: 4 }, { type: 'eighth', style: 'jazz', count: 14 }], spawnGap: 0.36 },
  ];

  /** Tour bus — folk arrives (needs high damage). */
  const WAVE_FOLK_INTRO = [
    { entries: [{ type: 'eighth', count: 12 }, { type: 'quarter', style: 'jazz', count: 6 }], spawnGap: 0.5 },
    { entries: [{ type: 'quarter', count: 8 }, { type: 'half', count: 2 }, { type: 'quarter', style: 'folk', count: 2 }], spawnGap: 0.5 },
    { entries: [{ type: 'eighth', style: 'jazz', count: 12 }, { type: 'quarter', style: 'folk', count: 3 }], spawnGap: 0.45 },
    { entries: [{ type: 'half', count: 3 }, { type: 'eighth', count: 10 }, { type: 'half', style: 'folk', count: 1 }], spawnGap: 0.45 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'quarter', style: 'jazz', count: 6 }, { type: 'quarter', style: 'folk', count: 3 }], spawnGap: 0.44 },
    { entries: [{ type: 'eighth', style: 'jazz', count: 12 }, { type: 'half', style: 'folk', count: 2 }, { type: 'quarter', count: 6 }], spawnGap: 0.42 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'half', style: 'jazz', count: 3 }, { type: 'eighth', style: 'folk', count: 4 }], spawnGap: 0.4 },
    { entries: [{ type: 'whole', count: 2 }, { type: 'quarter', style: 'folk', count: 5 }, { type: 'eighth', style: 'jazz', count: 10 }], spawnGap: 0.38 },
    { entries: [{ type: 'half', style: 'folk', count: 3 }, { type: 'quarter', style: 'jazz', count: 8 }, { type: 'eighth', count: 12 }], spawnGap: 0.36 },
    { entries: [{ type: 'whole', count: 2 }, { type: 'whole', style: 'folk', count: 1 }, { type: 'half', style: 'jazz', count: 3 }, { type: 'eighth', count: 12 }], spawnGap: 0.34 },
  ];

  /** Closing night — full jazz + folk mix; Andy Clark enters late. */
  const WAVE_FINALE_MIX = [
    { entries: [{ type: 'eighth', style: 'jazz', count: 12 }, { type: 'quarter', count: 8 }], spawnGap: 0.48 },
    { entries: [{ type: 'quarter', style: 'folk', count: 4 }, { type: 'eighth', count: 10 }, { type: 'quarter', style: 'jazz', count: 5 }], spawnGap: 0.45 },
    { entries: [{ type: 'half', style: 'jazz', count: 3 }, { type: 'half', style: 'folk', count: 2 }, { type: 'eighth', count: 10 }], spawnGap: 0.42 },
    { entries: [{ type: 'eighth', style: 'jazz', count: 14 }, { type: 'quarter', style: 'folk', count: 6 }, { type: 'half', count: 3 }], spawnGap: 0.4 },
    { entries: [{ type: 'whole', count: 1 }, { type: 'whole', style: 'jazz', count: 1 }, { type: 'quarter', style: 'folk', count: 5 }], spawnGap: 0.4 },
    { entries: [{ type: 'half', style: 'folk', count: 3 }, { type: 'eighth', style: 'jazz', count: 14 }, { type: 'quarter', count: 8 }], spawnGap: 0.38 },
    { entries: [{ type: 'andy', count: 1 }, { type: 'half', style: 'jazz', count: 3 }, { type: 'eighth', count: 10 }], spawnGap: 0.42 },
    { entries: [{ type: 'whole', count: 2 }, { type: 'quarter', style: 'jazz', count: 8 }, { type: 'quarter', style: 'folk', count: 6 }, { type: 'eighth', style: 'jazz', count: 10 }], spawnGap: 0.34 },
    { entries: [{ type: 'andy', count: 1 }, { type: 'half', style: 'folk', count: 3 }, { type: 'half', style: 'jazz', count: 2 }, { type: 'eighth', count: 12 }], spawnGap: 0.36 },
    { entries: [{ type: 'andy', count: 1 }, { type: 'whole', count: 2 }, { type: 'whole', style: 'folk', count: 1 }, { type: 'whole', style: 'jazz', count: 1 }, { type: 'half', style: 'folk', count: 3 }, { type: 'eighth', style: 'jazz', count: 14 }], spawnGap: 0.32 },
  ];

  const LEVELS = [
    {
      id: 'approach',
      index: 0,
      name: 'Lawn Approach',
      blurb: 'Cross the grass and sidewalk toward the hall doors. Learn the choir.',
      lives: 20,
      gold: 130,
      betweenDelay: 5,
      path: [
        [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],
      ],
      blocks: [[2, 2], [8, 7], [5, 1], [9, 2]],
      waves: WAVE_EASY,
    },
    {
      id: 'entrance',
      index: 1,
      name: 'Lobby Threshold',
      blurb: 'Through the facade and into the lobby. Cover the corners.',
      lives: 18,
      gold: 115,
      betweenDelay: 4.5,
      path: [
        [0, 2], [1, 2], [2, 2], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7],
        [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [8, 6], [8, 5], [8, 4], [8, 3],
        [9, 3], [10, 3], [11, 3],
      ],
      blocks: [[1, 5], [5, 3], [6, 5], [10, 6], [2, 8]],
      waves: scaleWaves(WAVE_MID, 0.85, 1.05),
    },
    {
      id: 'hallway',
      index: 2,
      name: 'Backstage Hall',
      blurb: 'A winding interior corridor. Altos earn their keep.',
      lives: 16,
      gold: 110,
      betweenDelay: 4,
      path: [
        [0, 5], [1, 5], [2, 5], [2, 4], [2, 3], [3, 3], [4, 3], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7],
        [6, 7], [7, 7], [8, 7], [8, 6], [8, 5], [8, 4], [9, 4], [10, 4], [11, 4],
      ],
      blocks: [[1, 1], [3, 6], [6, 2], [7, 4], [10, 7], [4, 8]],
      waves: WAVE_MID,
    },
    {
      id: 'elevator',
      index: 3,
      name: 'Elevator Bank',
      blurb: 'Up through the elevator lobby. Bring Bass for the long holds.',
      lives: 15,
      gold: 110,
      betweenDelay: 3.5,
      path: [
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8],
        [5, 8], [6, 8], [7, 8], [7, 7], [7, 6], [7, 5], [7, 4], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],
      ],
      blocks: [[2, 4], [2, 7], [6, 2], [6, 5], [9, 6], [10, 1], [1, 8]],
      waves: scaleWaves(WAVE_HARD, 0.9, 1.0).slice(0, 9),
    },
    {
      id: 'finale',
      index: 4,
      name: 'Stage Curtain',
      blurb: 'Down the aisle to the stage. Every voice on for the closing number.',
      lives: 12,
      gold: 120,
      betweenDelay: 3,
      path: [
        [0, 4], [1, 4], [2, 4], [3, 4], [3, 5], [3, 6], [4, 6], [5, 6], [6, 6], [6, 5], [6, 4], [6, 3],
        [7, 3], [8, 3], [9, 3], [9, 4], [9, 5], [9, 6], [9, 7], [10, 7], [11, 7],
      ],
      blocks: [[1, 1], [2, 8], [5, 1], [8, 8], [10, 1], [4, 3], [7, 7], [1, 7]],
      waves: WAVE_HARD,
    },
    {
      id: 'encore',
      index: 5,
      name: 'Encore Call',
      blurb: 'They want one more number. Jazz notes shimmer in — they shrug off heavy hits.',
      lives: 12,
      gold: 135,
      betweenDelay: 3,
      path: [
        [0, 3], [1, 3], [2, 3], [3, 3], [3, 4], [3, 5], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6],
        [7, 5], [7, 4], [7, 3], [8, 3], [9, 3], [10, 3], [10, 4], [10, 5], [11, 5],
      ],
      blocks: [[1, 1], [1, 7], [5, 2], [5, 8], [8, 8], [9, 1], [2, 8], [6, 1]],
      waves: WAVE_ENCORE,
    },
    {
      id: 'greenroom',
      index: 6,
      name: 'Green Room Crush',
      blurb: 'Dressing-room chaos. Racks, mirrors, and glittery jazz notes in the crush.',
      lives: 11,
      gold: 130,
      betweenDelay: 2.8,
      path: [
        [0, 6], [1, 6], [2, 6], [2, 5], [2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [5, 2], [5, 3], [5, 4],
        [5, 5], [5, 6], [5, 7], [6, 7], [7, 7], [8, 7], [8, 6], [8, 5], [8, 4], [9, 4], [10, 4], [11, 4],
      ],
      blocks: [[1, 1], [1, 4], [3, 5], [4, 8], [6, 3], [7, 5], [9, 1], [9, 7], [10, 8]],
      waves: scaleWaves(WAVE_JAZZ_HEAVY, 0.95, 1.0),
    },
    {
      id: 'dock',
      index: 7,
      name: 'Loading Dock',
      blurb: 'Freight exit behind the hall. Yellow lines, crates, and more jazz swagger.',
      lives: 10,
      gold: 140,
      betweenDelay: 2.6,
      path: [
        [0, 1], [1, 1], [2, 1], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7],
        [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [8, 6], [8, 5], [8, 4], [8, 3], [8, 2],
        [9, 2], [10, 2], [11, 2],
      ],
      blocks: [[1, 4], [1, 8], [5, 3], [5, 5], [6, 1], [9, 5], [10, 7], [2, 8], [10, 4]],
      waves: WAVE_JAZZ_HEAVY,
    },
    {
      id: 'tourbus',
      index: 8,
      name: 'Midnight Tour Bus',
      blurb: 'On the road at midnight. Folk notes land — only big hits get through.',
      lives: 10,
      gold: 140,
      betweenDelay: 2.5,
      path: [
        [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [4, 4], [4, 3], [4, 2], [5, 2], [6, 2], [7, 2],
        [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [9, 7], [10, 7], [10, 6], [10, 5], [11, 5],
      ],
      blocks: [[1, 2], [2, 7], [5, 5], [5, 8], [6, 6], [8, 3], [9, 1], [9, 5], [2, 3], [1, 8]],
      waves: WAVE_FOLK_INTRO,
    },
    {
      id: 'closing',
      index: 9,
      name: 'Closing Night',
      blurb: 'Packed house finale. Jazz, folk, and conductor Andy Clark — stun the choir if you let him cue.',
      lives: 9,
      gold: 145,
      betweenDelay: 2.4,
      path: [
        [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [3, 7], [4, 7], [5, 7],
        [5, 6], [5, 5], [5, 4], [5, 3], [6, 3], [7, 3], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7],
        [9, 7], [10, 7], [10, 6], [10, 5], [11, 5],
      ],
      blocks: [[1, 5], [1, 8], [3, 1], [3, 4], [4, 5], [6, 1], [6, 6], [7, 8], [9, 2], [9, 5], [4, 2]],
      waves: WAVE_FINALE_MIX,
    },
  ];

  function getLevel(idOrIndex) {
    if (typeof idOrIndex === 'number') return LEVELS[idOrIndex] || null;
    return LEVELS.find((l) => l.id === idOrIndex) || null;
  }

  const PROGRESS_KEY = 'parting-notes-progress';

  const BASE_TOWERS = ['soprano', 'alto', 'tenor', 'bass'];

  function normalizeProgress(data) {
    const cleared = Array.isArray(data && data.cleared) ? data.cleared.slice() : [];
    let towersUnlocked = Array.isArray(data && data.towersUnlocked)
      ? data.towersUnlocked.filter((id) => typeof id === 'string')
      : [];
    // Migrate: clearing Closing Night unlocks Choir Andy.
    if (cleared.includes('closing') && !towersUnlocked.includes('andy')) {
      towersUnlocked = towersUnlocked.concat(['andy']);
    }
    return {
      unlocked: Math.max(1, Math.min(LEVELS.length, Number(data && data.unlocked) || 1)),
      cleared,
      towersUnlocked,
    };
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return { unlocked: 1, cleared: [], towersUnlocked: [] };
      const data = JSON.parse(raw);
      const hadAndy =
        Array.isArray(data.towersUnlocked) && data.towersUnlocked.includes('andy');
      const p = normalizeProgress(data);
      // Persist migration for saves that cleared Closing Night before unlock tracking.
      if (!hadAndy && p.towersUnlocked.includes('andy')) {
        saveProgress(p);
      }
      return p;
    } catch {
      return { unlocked: 1, cleared: [], towersUnlocked: [] };
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  function markCleared(levelId) {
    const p = loadProgress();
    if (!p.cleared.includes(levelId)) p.cleared.push(levelId);
    const level = getLevel(levelId);
    if (level && level.index + 2 > p.unlocked) {
      p.unlocked = Math.min(LEVELS.length, level.index + 2);
    }
    if (levelId === 'closing') unlockTower('andy', p);
    saveProgress(p);
    return p;
  }

  function unlockTower(id, progressOpt) {
    const p = progressOpt || loadProgress();
    if (!id) return p;
    if (!Array.isArray(p.towersUnlocked)) p.towersUnlocked = [];
    if (!p.towersUnlocked.includes(id)) p.towersUnlocked.push(id);
    if (!progressOpt) saveProgress(p);
    return p;
  }

  // Debug mode is off for players. Open the game with ?debug in the URL to turn it on.
  // It never writes to the saved progress; it only changes what the screens report.
  const DEBUG = (function () {
    try {
      const q = new URLSearchParams(global.location ? global.location.search : '');
      if (!q.has('debug')) return false;
      const v = String(q.get('debug') || '').toLowerCase();
      return v !== '0' && v !== 'false' && v !== 'off';
    } catch (_) {
      return false;
    }
  })();

  function isDebug() {
    return DEBUG;
  }

  function isTowerUnlocked(id) {
    if (!id) return false;
    if (BASE_TOWERS.includes(id)) return true;
    if (DEBUG) return true;
    const p = loadProgress();
    return Array.isArray(p.towersUnlocked) && p.towersUnlocked.includes(id);
  }

  function hasUnlockedAndy() {
    return isTowerUnlocked('andy');
  }

  function getNextLevel(idOrIndex) {
    const cur = getLevel(idOrIndex);
    if (!cur) return null;
    return LEVELS[cur.index + 1] || null;
  }

  global.PNLevels = {
    COLS,
    ROWS,
    TILE,
    LEVELS,
    BASE_TOWERS,
    getLevel,
    getNextLevel,
    loadProgress,
    saveProgress,
    markCleared,
    unlockTower,
    isTowerUnlocked,
    hasUnlockedAndy,
    isDebug,
  };
})(typeof window !== 'undefined' ? window : globalThis);
