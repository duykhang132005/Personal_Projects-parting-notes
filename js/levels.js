/* Parting Notes: adventure levels (maps + difficulty) */
(function (global) {
  const COLS = 12;
  const ROWS = 10;
  const TILE = 64;

  /** Scale base wave templates by difficulty. Preserves style on entries. */
  // hpMult (optional) makes every note in the set tougher without changing its kill gold.
  function scaleWaves(base, mult, gapScale, hpMult) {
    return base.map((w) => ({
      spawnGap: Math.max(0.35, (w.spawnGap || 0.7) * gapScale),
      entries: (w.entries || []).map((e) => {
        const out = {
          type: e.type,
          style: e.style || 'normal',
          count: Math.max(1, Math.round(e.count * mult)),
        };
        if (hpMult && hpMult !== 1) out.hpMult = hpMult;
        return out;
      }),
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

  /** Encore: introduce jazz notes (damage-capped glitter). */
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

  /** Green room / dock: heavier jazz mix. */
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

  /** Tour bus: folk arrives (needs high damage). */
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

  /** Closing night: full jazz + folk mix; Andy Clark enters late. */
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

  /** Finale mix without Andy Clark: jazz and folk together, for Carol staves with no boss. */
  const WAVE_FINALE_NO_BOSS = WAVE_FINALE_MIX.map((w) => ({
    spawnGap: w.spawnGap,
    entries: w.entries.filter((e) => e.type !== 'andy'),
  }));

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
      blurb: 'They want one more number. Jazz notes shimmer in, and they shrug off heavy hits.',
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
      blurb: 'On the road at midnight. Folk notes land, and only big hits get through.',
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
      blurb: 'Packed house finale. Jazz, folk, and conductor Andy Clark, who stuns the choir if you let him cue.',
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

  // A Christmas Carol: a 30-stave act that opens after Closing Night, one stave per movement of
  // the Harvard Glee Club recording, in track order (assets/audio/carol/<music>.mp3).
  // Carol stages live outside LEVELS, so the saved "unlocked" count and the main campaign stay
  // exactly as before. Stave progress is read from "cleared" (see isLevelUnlocked).
  // index continues after Closing Night (10 to 39) so ids, stats and map paging stay unique;
  // mapTheme picks which existing backdrop to reuse, and snow adds a light winter overlay.
  // The five original staves keep their ids (carol-marley, carol-past, carol-present,
  // carol-future, carol-morning), so older saves keep their clears with no migration step.
  const CAROL_ACT = {
    id: 'carol',
    name: 'A Christmas Carol',
    unlockAfter: 'closing',
    audioDir: 'assets/audio/carol/',
  };

  const CAROL_LEVELS = [
    {
      id: 'carol-01-truth-from-above',
      index: 10,
      act: 'carol',
      actIndex: 0,
      name: 'The Truth from Above',
      blurb: 'Snow falls on old London as the story begins. Jazz notes gather at the gate.',
      music: 'carol-01-truth-from-above',
      mapTheme: 0,
      snow: true,
      lives: 14,
      gold: 160,
      betweenDelay: 3.2,
      path: [
        [0, 2], [1, 2], [2, 2], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [4, 7], [5, 7], [5, 6],
        [5, 5], [6, 5], [7, 5], [8, 5], [8, 4], [8, 3], [8, 2], [9, 2], [10, 2], [10, 3], [10, 4], [11, 4],
      ],
      blocks: [[6, 1], [2, 8], [1, 1], [1, 5], [9, 7], [7, 6], [7, 3], [6, 8], [9, 3]],
      waves: scaleWaves(WAVE_ENCORE, 1.05, 0.95),
    },
    {
      id: 'carol-02-counting-house',
      index: 11,
      act: 'carol',
      actIndex: 1,
      name: 'In the Counting-House',
      blurb: 'A cold office on Christmas Eve. Heavy notes march past the ledgers while the coal runs low.',
      music: 'carol-02-counting-house',
      mapTheme: 2,
      snow: true,
      lives: 14,
      gold: 160,
      betweenDelay: 3.2,
      path: [
        [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [4, 7], [4, 6], [4, 5], [4, 4], [4, 3], [5, 3], [6, 3],
        [6, 4], [6, 5], [6, 6], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [10, 6], [10, 5], [11, 5],
      ],
      blocks: [[2, 2], [8, 4], [5, 8], [6, 2], [0, 6], [5, 6], [11, 7], [3, 7]],
      waves: scaleWaves(WAVE_HARD, 0.85, 1.05, 1.2),
    },
    {
      id: 'carol-03-surplus-population',
      index: 12,
      act: 'carol',
      actIndex: 2,
      name: 'Surplus Population',
      blurb: 'Two gentlemen ask for the poor and are shown the door. Jazz notes slip in behind them.',
      music: 'carol-03-surplus-population',
      mapTheme: 1,
      snow: true,
      lives: 13,
      gold: 160,
      betweenDelay: 3.1,
      path: [
        [0, 5], [1, 5], [2, 5], [2, 4], [2, 3], [3, 3], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8],
        [5, 8], [6, 8], [6, 7], [6, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [7, 1], [8, 1], [9, 1],
        [10, 1], [11, 1],
      ],
      blocks: [[7, 3], [1, 2], [0, 7], [2, 8], [9, 2], [5, 4], [5, 2], [8, 7], [3, 6]],
      waves: scaleWaves(WAVE_ENCORE, 1.1, 1.0, 1.1),
    },
    {
      id: 'carol-04-god-rest-you-merry',
      index: 13,
      act: 'carol',
      actIndex: 3,
      name: 'God Rest You Merry, Gentlemen',
      blurb: 'A caroler sings at the keyhole and is chased away. The street fills with jazz notes.',
      music: 'carol-04-god-rest-you-merry',
      mapTheme: 7,
      snow: true,
      lives: 13,
      gold: 160,
      betweenDelay: 3.1,
      path: [
        [0, 7], [1, 7], [1, 6], [1, 5], [2, 5], [3, 5], [4, 5], [4, 6], [4, 7], [4, 8], [5, 8], [6, 8],
        [7, 8], [7, 7], [7, 6], [7, 5], [7, 4], [8, 4], [9, 4], [10, 4], [10, 3], [10, 2], [10, 1], [11, 1],
      ],
      blocks: [[9, 2], [6, 2], [3, 8], [3, 4], [10, 6], [8, 6], [0, 8], [0, 5], [11, 2]],
      waves: scaleWaves(WAVE_JAZZ_HEAVY, 0.9, 1.05),
    },
    {
      id: 'carol-marley',
      index: 14,
      act: 'carol',
      actIndex: 4,
      name: "Marley's Ghost",
      blurb: "Chains rattle through Scrooge's counting-house as jazz notes drift in from the dark.",
      music: 'carol-marley',
      mapTheme: 2,
      snow: true,
      lives: 12,
      gold: 160,
      betweenDelay: 3,
      path: [
        [0, 7], [1, 7], [2, 7], [3, 7], [3, 6], [3, 5], [3, 4], [3, 3], [3, 2], [4, 2], [5, 2], [6, 2],
        [6, 3], [6, 4], [6, 5], [6, 6], [7, 6], [8, 6], [9, 6], [9, 5], [9, 4], [9, 3], [10, 3], [11, 3],
      ],
      blocks: [[1, 4], [2, 1], [5, 5], [7, 8], [8, 1], [10, 6], [4, 8], [7, 3]],
      waves: scaleWaves(WAVE_JAZZ_HEAVY, 1.0, 1.0),
    },
    {
      id: 'carol-06-mankind-was-my-business',
      index: 15,
      act: 'carol',
      actIndex: 5,
      name: 'Mankind Was My Business',
      blurb: "Marley's chains drag past every door he never opened. Jazz notes crowd the stair.",
      music: 'carol-06-mankind-was-my-business',
      mapTheme: 3,
      snow: true,
      lives: 12,
      gold: 160,
      betweenDelay: 3,
      path: [
        [0, 7], [1, 7], [1, 6], [1, 5], [1, 4], [1, 3], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [5, 3],
        [5, 4], [5, 5], [6, 5], [7, 5], [7, 6], [7, 7], [8, 7], [9, 7], [10, 7], [10, 6], [10, 5], [10, 4],
        [11, 4],
      ],
      blocks: [[8, 4], [8, 2], [11, 6], [11, 3], [0, 3], [6, 7], [11, 8], [8, 6], [3, 1], [6, 4], [8, 8]],
      waves: scaleWaves(WAVE_JAZZ_HEAVY, 1.0, 0.95),
    },
    {
      id: 'carol-07-remember',
      index: 16,
      act: 'carol',
      actIndex: 6,
      name: 'Remember',
      blurb: 'The first spirit arrives in a soft light. Folk notes arrive too, and only big hits get through.',
      music: 'carol-07-remember',
      mapTheme: 6,
      snow: true,
      lives: 12,
      gold: 160,
      betweenDelay: 2.9,
      path: [
        [0, 6], [1, 6], [2, 6], [2, 5], [2, 4], [2, 3], [2, 2], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
        [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [8, 6], [9, 6], [9, 5], [9, 4], [9, 3], [9, 2],
        [10, 2], [11, 2],
      ],
      blocks: [[10, 4], [3, 5], [1, 1], [6, 7], [8, 7], [0, 8], [4, 2], [4, 8], [8, 1], [10, 6]],
      waves: scaleWaves(WAVE_FOLK_INTRO, 1.15, 1.0, 1.05),
    },
    {
      id: 'carol-08-ghost-of-christmas-past',
      index: 17,
      act: 'carol',
      actIndex: 7,
      name: 'The Ghost of Christmas Past',
      blurb: 'Back to a lonely schoolroom at midnight. Tougher jazz notes flicker like candles.',
      music: 'carol-08-ghost-of-christmas-past',
      mapTheme: 8,
      snow: true,
      lives: 12,
      gold: 160,
      betweenDelay: 2.9,
      path: [
        [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [3, 7], [4, 7], [4, 6], [4, 5],
        [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [8, 5], [8, 6], [8, 7], [9, 7], [10, 7], [10, 6], [10, 5],
        [10, 4], [10, 3], [10, 2], [10, 1], [11, 1],
      ],
      blocks: [[2, 8], [8, 2], [0, 8], [11, 8], [6, 5], [11, 2], [3, 1], [3, 3], [1, 3], [5, 7]],
      waves: scaleWaves(WAVE_JAZZ_HEAVY, 0.85, 0.95, 1.1),
    },
    {
      id: 'carol-09-little-fan',
      index: 18,
      act: 'carol',
      actIndex: 8,
      name: 'Little Fan',
      blurb: 'His sister comes to bring him home for good. Folk notes follow her down the hall.',
      music: 'carol-09-little-fan',
      mapTheme: 1,
      snow: true,
      lives: 11,
      gold: 160,
      betweenDelay: 2.9,
      path: [
        [0, 7], [1, 7], [2, 7], [2, 6], [2, 5], [2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [4, 3], [4, 4],
        [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [10, 4], [10, 3], [10, 2], [10, 1], [11, 1],
      ],
      blocks: [[11, 7], [2, 1], [0, 5], [9, 1], [6, 2], [4, 6], [9, 3], [9, 7], [11, 3], [0, 2], [5, 4]],
      waves: scaleWaves(WAVE_FOLK_INTRO, 1.1, 1.0, 1.1),
    },
    {
      id: 'carol-10-sussex-carol',
      index: 19,
      act: 'carol',
      actIndex: 9,
      name: 'Sussex Carol',
      blurb: 'Bells ring over the country road. Tougher jazz notes ride the merry tune.',
      music: 'carol-10-sussex-carol',
      mapTheme: 0,
      snow: true,
      lives: 11,
      gold: 160,
      betweenDelay: 2.8,
      path: [
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [4, 4], [4, 5], [4, 6], [5, 6], [6, 6], [6, 5], [6, 4],
        [6, 3], [6, 2], [7, 2], [8, 2], [8, 3], [8, 4], [8, 5], [9, 5], [10, 5], [10, 6], [10, 7], [10, 8],
        [11, 8],
      ],
      blocks: [[8, 8], [11, 4], [0, 4], [0, 1], [2, 5], [6, 7], [8, 6], [9, 2]],
      waves: scaleWaves(WAVE_ENCORE, 1.1, 0.85, 1.25),
    },
    {
      id: 'carol-past',
      index: 20,
      act: 'carol',
      actIndex: 10,
      name: "Fezziwig's Ball",
      blurb: "Fezziwig's ball is in full swing, and folk notes join the dance.",
      music: 'carol-past',
      mapTheme: 5,
      snow: true,
      lives: 11,
      gold: 160,
      betweenDelay: 2.8,
      path: [
        [0, 1], [1, 1], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [3, 6], [4, 6], [5, 6], [5, 5],
        [5, 4], [5, 3], [6, 3], [7, 3], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7], [9, 7], [10, 7], [11, 7],
      ],
      blocks: [[1, 4], [4, 2], [4, 8], [6, 6], [7, 1], [9, 4], [10, 2], [3, 4], [6, 8]],
      waves: scaleWaves(WAVE_FOLK_INTRO, 1.05, 0.95, 1.15),
    },
    {
      id: 'carol-12-gain-is-loss',
      index: 21,
      act: 'carol',
      actIndex: 11,
      name: 'Gain Is Loss',
      blurb: 'Belle gives back his promise. A swarm of tougher jazz notes fills the quiet room.',
      music: 'carol-12-gain-is-loss',
      mapTheme: 3,
      snow: true,
      lives: 11,
      gold: 160,
      betweenDelay: 2.7,
      path: [
        [0, 7], [1, 7], [1, 6], [1, 5], [1, 4], [2, 4], [3, 4], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8],
        [5, 8], [6, 8], [7, 8], [8, 8], [8, 7], [8, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [9, 1],
        [10, 1], [11, 1],
      ],
      blocks: [[6, 7], [10, 4], [5, 3], [2, 7], [1, 2], [6, 5], [9, 7], [9, 2], [7, 2], [0, 4], [0, 6]],
      waves: scaleWaves(WAVE_JAZZ_HEAVY, 0.85, 0.85, 1.2),
    },
    {
      id: 'carol-13-auld-lang-syne',
      index: 22,
      act: 'carol',
      actIndex: 12,
      name: 'Auld Lang Syne',
      blurb: 'Old friends sing the year out. Tough folk notes linger at the door.',
      music: 'carol-13-auld-lang-syne',
      mapTheme: 9,
      snow: true,
      lives: 11,
      gold: 165,
      betweenDelay: 2.7,
      path: [
        [0, 8], [1, 8], [2, 8], [2, 7], [2, 6], [2, 5], [2, 4], [2, 3], [3, 3], [4, 3], [5, 3], [5, 4],
        [5, 5], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [9, 5], [9, 4], [10, 4], [11, 4],
      ],
      blocks: [[11, 8], [0, 1], [3, 6], [5, 8], [5, 1], [3, 8], [8, 7], [1, 5], [2, 1], [1, 3], [0, 7]],
      waves: scaleWaves(WAVE_FOLK_INTRO, 1.1, 0.9, 1.25),
    },
    {
      id: 'carol-present',
      index: 23,
      act: 'carol',
      actIndex: 13,
      name: 'The Ghost of Christmas Present',
      blurb: 'A feast-lit street on Christmas Eve, crowded with jazz and folk notes.',
      music: 'carol-present',
      mapTheme: 4,
      snow: true,
      lives: 11,
      gold: 165,
      betweenDelay: 2.6,
      path: [
        [0, 5], [1, 5], [2, 5], [2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [6, 3], [6, 4],
        [6, 5], [6, 6], [6, 7], [7, 7], [8, 7], [9, 7], [9, 6], [9, 5], [9, 4], [9, 3], [10, 3], [11, 3],
      ],
      blocks: [[1, 2], [1, 7], [4, 4], [4, 7], [5, 8], [7, 4], [8, 1], [10, 5], [3, 8], [11, 6]],
      waves: scaleWaves(WAVE_FOLK_INTRO, 1.1, 0.9, 1.3),
    },
    {
      id: 'carol-15-christmas-journey',
      index: 24,
      act: 'carol',
      actIndex: 14,
      name: 'A Christmas Journey',
      blurb: 'The giant spirit carries him over the rooftops. Jazz and folk notes ride along.',
      music: 'carol-15-christmas-journey',
      mapTheme: 7,
      snow: true,
      lives: 11,
      gold: 165,
      betweenDelay: 2.6,
      path: [
        [0, 7], [1, 7], [1, 6], [1, 5], [1, 4], [2, 4], [3, 4], [3, 3], [3, 2], [3, 1], [4, 1], [5, 1],
        [6, 1], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [9, 7], [9, 6], [9, 5],
        [9, 4], [9, 3], [10, 3], [11, 3],
      ],
      blocks: [[10, 2], [8, 2], [6, 6], [4, 3], [3, 8], [2, 3], [6, 2], [0, 3], [0, 5]],
      waves: scaleWaves(WAVE_FINALE_NO_BOSS, 0.95, 0.85, 1.15),
    },
    {
      id: 'carol-16-a-child-himself',
      index: 25,
      act: 'carol',
      actIndex: 15,
      name: 'A Child Himself',
      blurb: 'The spirit shows the joy of the season in every house. Folk notes fill the lanes.',
      music: 'carol-16-a-child-himself',
      mapTheme: 6,
      snow: true,
      lives: 11,
      gold: 165,
      betweenDelay: 2.6,
      path: [
        [0, 3], [1, 3], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [3, 7], [4, 7], [4, 6], [4, 5], [4, 4],
        [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [8, 2], [8, 1], [9, 1], [10, 1], [11, 1],
      ],
      blocks: [[0, 4], [3, 3], [4, 8], [7, 1], [1, 7], [11, 3], [6, 5], [5, 2]],
      waves: scaleWaves(WAVE_FOLK_INTRO, 1.2, 0.85, 1.2),
    },
    {
      id: 'carol-17-deck-the-halls',
      index: 26,
      act: 'carol',
      actIndex: 16,
      name: 'Deck the Halls',
      blurb: "Holly on every banister and games at his nephew's party. Jazz and folk notes join in.",
      music: 'carol-17-deck-the-halls',
      mapTheme: 5,
      snow: true,
      lives: 11,
      gold: 165,
      betweenDelay: 2.6,
      path: [
        [0, 4], [1, 4], [2, 4], [2, 5], [2, 6], [3, 6], [4, 6], [4, 5], [4, 4], [4, 3], [4, 2], [4, 1],
        [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7],
        [11, 7],
      ],
      blocks: [[3, 2], [11, 2], [9, 4], [6, 8], [3, 7], [9, 7], [5, 4], [0, 2], [3, 4], [7, 2]],
      waves: scaleWaves(WAVE_FINALE_NO_BOSS, 0.95, 0.85, 1.15),
    },
    {
      id: 'carol-18-bob-cratchits-house',
      index: 27,
      act: 'carol',
      actIndex: 17,
      name: "Bob Cratchit's House",
      blurb: 'A small goose and a big welcome. Tough jazz notes squeeze into the crowded kitchen.',
      music: 'carol-18-bob-cratchits-house',
      mapTheme: 1,
      snow: true,
      lives: 10,
      gold: 165,
      betweenDelay: 2.5,
      path: [
        [0, 7], [1, 7], [1, 6], [1, 5], [1, 4], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1], [4, 1], [4, 2],
        [4, 3], [4, 4], [5, 4], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8],
        [10, 7], [10, 6], [11, 6],
      ],
      blocks: [[5, 1], [11, 5], [7, 4], [0, 3], [8, 2], [2, 8], [0, 1], [0, 8]],
      waves: scaleWaves(WAVE_JAZZ_HEAVY, 1.0, 0.85, 1.25),
    },
    {
      id: 'carol-19-silent-night',
      index: 28,
      act: 'carol',
      actIndex: 18,
      name: 'Silent Night',
      blurb: 'Lamps go out across the town. Folk notes walk the snowy lanes in the quiet.',
      music: 'carol-19-silent-night',
      mapTheme: 8,
      snow: true,
      lives: 10,
      gold: 165,
      betweenDelay: 2.5,
      path: [
        [0, 5], [1, 5], [1, 4], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1],
        [8, 1], [8, 2], [8, 3], [9, 3], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8], [11, 8],
      ],
      blocks: [[9, 8], [0, 7], [2, 2], [4, 3], [0, 2], [2, 4], [2, 6], [8, 4], [11, 1]],
      waves: scaleWaves(WAVE_FOLK_INTRO, 1.2, 0.85, 1.25),
    },
    {
      id: 'carol-20-bell-struck-twelve',
      index: 29,
      act: 'carol',
      actIndex: 19,
      name: 'The Bell Struck Twelve',
      blurb: 'Midnight tolls and the second spirit fades. Jazz and folk notes rush the stroke of twelve.',
      music: 'carol-20-bell-struck-twelve',
      mapTheme: 9,
      snow: true,
      lives: 10,
      gold: 165,
      betweenDelay: 2.5,
      path: [
        [0, 3], [1, 3], [1, 4], [1, 5], [1, 6], [2, 6], [3, 6], [3, 5], [3, 4], [3, 3], [3, 2], [3, 1],
        [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [10, 2], [10, 3], [11, 3],
      ],
      blocks: [[5, 2], [5, 5], [1, 8], [9, 4], [8, 2], [1, 1], [0, 6], [3, 8], [2, 3], [11, 4]],
      waves: scaleWaves(WAVE_FINALE_NO_BOSS, 0.95, 0.85, 1.2),
    },
    {
      id: 'carol-future',
      index: 30,
      act: 'carol',
      actIndex: 20,
      name: 'Ghost of the Future',
      blurb: 'A silent spirit points the way, and Andy Clark returns from the shadows.',
      music: 'carol-future',
      mapTheme: 8,
      snow: true,
      lives: 10,
      gold: 165,
      betweenDelay: 2.5,
      path: [
        [0, 2], [1, 2], [2, 2], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [4, 7], [5, 7], [5, 6],
        [5, 5], [5, 4], [5, 3], [6, 3], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [9, 7], [9, 6],
        [9, 5], [9, 4], [10, 4], [11, 4],
      ],
      blocks: [[1, 5], [2, 8], [4, 1], [4, 5], [6, 5], [6, 8], [8, 2], [8, 5], [10, 7], [10, 1]],
      waves: scaleWaves(WAVE_FINALE_MIX, 1.0, 1.0),
    },
    {
      id: 'carol-22-body-of-a-man',
      index: 31,
      act: 'carol',
      actIndex: 21,
      name: 'The Body of a Man',
      blurb: 'Strangers trade gossip about a death nobody mourns. Jazz and folk notes press in.',
      music: 'carol-22-body-of-a-man',
      mapTheme: 2,
      snow: true,
      lives: 10,
      gold: 165,
      betweenDelay: 2.5,
      path: [
        [0, 4], [1, 4], [2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [6, 3], [6, 4], [6, 5],
        [6, 6], [6, 7], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [10, 7], [10, 6], [10, 5], [10, 4], [10, 3],
        [11, 3],
      ],
      blocks: [[4, 6], [0, 6], [10, 2], [11, 8], [7, 7], [11, 4], [0, 1], [9, 7]],
      waves: scaleWaves(WAVE_FINALE_NO_BOSS, 0.95, 0.85, 1.2),
    },
    {
      id: 'carol-23-spirit-of-tiny-tim',
      index: 32,
      act: 'carol',
      actIndex: 22,
      name: 'Spirit of Tiny Tim',
      blurb: 'An empty stool by the fire. Tough folk notes keep a quiet watch.',
      music: 'carol-23-spirit-of-tiny-tim',
      mapTheme: 6,
      snow: true,
      lives: 10,
      gold: 165,
      betweenDelay: 2.5,
      path: [
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [5, 4], [6, 4], [6, 3], [6, 2], [7, 2],
        [8, 2], [9, 2], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8], [11, 8],
      ],
      blocks: [[2, 6], [4, 1], [11, 6], [2, 4], [0, 4], [1, 1], [8, 6], [11, 2], [9, 3], [6, 1], [11, 4]],
      waves: scaleWaves(WAVE_FOLK_INTRO, 1.2, 0.85, 1.25),
    },
    {
      id: 'carol-24-coventry-carol',
      index: 33,
      act: 'carol',
      actIndex: 23,
      name: 'Coventry Carol',
      blurb: 'A lullaby for the lost. Jazz and folk notes drift through the dark.',
      music: 'carol-24-coventry-carol',
      mapTheme: 3,
      snow: true,
      lives: 10,
      gold: 165,
      betweenDelay: 2.5,
      path: [
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [4, 4], [4, 5], [5, 5], [6, 5], [6, 4], [6, 3], [6, 2],
        [6, 1], [7, 1], [8, 1], [8, 2], [8, 3], [8, 4], [9, 4], [10, 4], [10, 5], [10, 6], [11, 6],
      ],
      blocks: [[9, 6], [7, 2], [1, 5], [10, 2], [7, 4], [5, 6], [0, 2], [7, 6], [2, 7], [10, 8], [4, 1]],
      waves: scaleWaves(WAVE_FINALE_NO_BOSS, 1.0, 0.85, 1.2),
    },
    {
      id: 'carol-25-spirits-of-all-three',
      index: 34,
      act: 'carol',
      actIndex: 24,
      name: 'The Spirits of All Three',
      blurb: 'He begs all three spirits for another chance. Andy Clark takes the podium again.',
      music: 'carol-25-spirits-of-all-three',
      mapTheme: 9,
      snow: true,
      lives: 10,
      gold: 170,
      betweenDelay: 2.5,
      path: [
        [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [5, 7], [5, 8], [6, 8], [7, 8], [7, 7], [7, 6],
        [7, 5], [7, 4], [7, 3], [7, 2], [8, 2], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [10, 6], [11, 6],
      ],
      blocks: [[5, 1], [9, 8], [6, 7], [11, 5], [7, 1], [6, 5], [10, 3], [1, 7]],
      waves: scaleWaves(WAVE_FINALE_MIX, 1.05, 0.95),
    },
    {
      id: 'carol-26-poverty',
      index: 35,
      act: 'carol',
      actIndex: 25,
      name: 'Poverty',
      blurb: "Want and Ignorance huddle under the spirit's robe. A heavy crowd of jazz notes follows.",
      music: 'carol-26-poverty',
      mapTheme: 7,
      snow: true,
      lives: 10,
      gold: 170,
      betweenDelay: 2.4,
      path: [
        [0, 4], [1, 4], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8],
        [7, 7], [7, 6], [7, 5], [7, 4], [7, 3], [7, 2], [8, 2], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6],
        [9, 7], [9, 8], [10, 8], [11, 8],
      ],
      blocks: [[9, 1], [3, 2], [0, 5], [11, 1], [7, 1], [11, 7], [11, 4], [1, 8], [5, 4], [5, 6]],
      waves: scaleWaves(WAVE_JAZZ_HEAVY, 1.05, 0.85, 1.3),
    },
    {
      id: 'carol-27-christmas-day',
      index: 36,
      act: 'carol',
      actIndex: 26,
      name: 'Christmas Day',
      blurb: 'He wakes in his own bed and it is Christmas Day. Jazz and folk notes race to the window.',
      music: 'carol-27-christmas-day',
      mapTheme: 0,
      snow: true,
      lives: 10,
      gold: 170,
      betweenDelay: 2.4,
      path: [
        [0, 2], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [2, 8], [3, 8], [4, 8], [4, 7],
        [4, 6], [5, 6], [6, 6], [7, 6], [7, 5], [7, 4], [8, 4], [9, 4], [9, 3], [9, 2], [10, 2], [11, 2],
      ],
      blocks: [[0, 1], [5, 8], [9, 1], [3, 3], [6, 3], [2, 1], [8, 7], [9, 5], [10, 3], [3, 6], [6, 5]],
      waves: scaleWaves(WAVE_FINALE_NO_BOSS, 1.05, 0.85, 1.2),
    },
    {
      id: 'carol-28-back-payments',
      index: 37,
      act: 'carol',
      actIndex: 27,
      name: 'Back Payments',
      blurb: 'A prize turkey for the Cratchits and a raise for Bob. Tough folk notes come to collect.',
      music: 'carol-28-back-payments',
      mapTheme: 2,
      snow: true,
      lives: 10,
      gold: 170,
      betweenDelay: 2.4,
      path: [
        [0, 8], [1, 8], [1, 7], [1, 6], [1, 5], [1, 4], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1], [4, 1],
        [5, 1], [6, 1], [7, 1], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [9, 6], [10, 6], [10, 5],
        [10, 4], [10, 3], [10, 2], [10, 1], [11, 1],
      ],
      blocks: [[10, 7], [8, 7], [3, 3], [5, 3], [3, 8], [6, 8], [11, 4], [6, 6]],
      waves: scaleWaves(WAVE_FOLK_INTRO, 1.25, 0.85, 1.2),
    },
    {
      id: 'carol-morning',
      index: 38,
      act: 'carol',
      actIndex: 28,
      name: 'God Bless Us, Every One',
      blurb: "Snow on the lawn and bells in the air. Tiny Tim's blessing rings out, and Andy Clark conducts once more.",
      music: 'carol-morning',
      mapTheme: 0,
      snow: true,
      lives: 10,
      gold: 170,
      betweenDelay: 2.4,
      path: [
        [0, 4], [1, 4], [2, 4], [2, 5], [2, 6], [2, 7], [3, 7], [4, 7], [5, 7], [5, 6], [5, 5], [5, 4],
        [5, 3], [5, 2], [6, 2], [7, 2], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [9, 6], [10, 6], [10, 5],
        [10, 4], [11, 4],
      ],
      blocks: [[1, 2], [1, 7], [3, 4], [4, 1], [4, 8], [6, 5], [7, 8], [9, 3], [11, 7], [7, 4]],
      waves: scaleWaves(WAVE_FINALE_MIX, 1.1, 0.95),
    },
    {
      id: 'carol-30-midnight-clear',
      index: 39,
      act: 'carol',
      actIndex: 29,
      name: 'It Came Upon the Midnight Clear',
      blurb: 'The last carol. Jazz, folk and Andy Clark all come for the final chorus. Hold the line.',
      music: 'carol-30-midnight-clear',
      mapTheme: 4,
      snow: true,
      lives: 10,
      gold: 175,
      betweenDelay: 2.4,
      path: [
        [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
        [7, 7], [7, 6], [7, 5], [7, 4], [7, 3], [7, 2], [7, 1], [8, 1], [9, 1], [9, 2], [9, 3], [9, 4],
        [9, 5], [9, 6], [10, 6], [11, 6],
      ],
      blocks: [[3, 4], [4, 1], [1, 4], [6, 6], [8, 3], [10, 4], [9, 7], [6, 1], [6, 4], [1, 1], [11, 7]],
      waves: scaleWaves(WAVE_FINALE_MIX, 1.1, 0.95, 1.05),
    },
  ];

  const ALL_LEVELS = LEVELS.concat(CAROL_LEVELS);

  // Encore (endless): unlocked with Choir Andy (Closing Night cleared, or ?debug). It is not in
  // LEVELS, so it never touches progress, map paging, transitions or the congrats screen.
  // Wave n (1-based) reuses the Closing Night templates without the boss, cycling every 10 waves:
  //   count  = round(base count * (1 + countPerWave * (n - 1)))
  //   HP     = base HP * hpGrowth ^ (n - 1)
  //   gold   = base kill gold * (1 + goldPerWave * (n - 1))
  //   gap    = max(minGap, base gap * (1 - gapPerWave * (n - 1)))
  // Every 10th wave adds Andy Clark (same HP growth). There is no last wave.
  const ENDLESS_TUNING = {
    hpGrowth: 1.11,
    countPerWave: 0.03,
    goldPerWave: 0.02,
    gapPerWave: 0.01,
    minGap: 0.28,
    bossEvery: 10,
  };
  const ENDLESS_BASE = WAVE_FINALE_MIX.map((w) => ({
    spawnGap: w.spawnGap,
    entries: w.entries.filter((e) => e.type !== 'andy'),
  }));

  function endlessWave(index) {
    const i = Math.max(0, Math.floor(index));
    const t = ENDLESS_TUNING;
    const base = ENDLESS_BASE[i % ENDLESS_BASE.length];
    const hpMult = Math.pow(t.hpGrowth, i);
    const goldMult = 1 + t.goldPerWave * i;
    const countMult = 1 + t.countPerWave * i;
    const entries = base.entries.map((e) => ({
      type: e.type,
      style: e.style || 'normal',
      count: Math.max(1, Math.round(e.count * countMult)),
      hpMult,
      goldMult,
    }));
    if ((i + 1) % t.bossEvery === 0) {
      entries.unshift({ type: 'andy', style: 'normal', count: 1, hpMult, goldMult });
    }
    return {
      spawnGap: Math.max(t.minGap, (base.spawnGap || 0.5) * (1 - t.gapPerWave * i)),
      entries,
    };
  }

  const closingDef = LEVELS[LEVELS.length - 1];
  const ENDLESS_LEVEL = {
    id: 'endless',
    endless: true,
    // Same index as Closing Night so it reuses that map theme and the closing music bed.
    index: closingDef.index,
    name: 'Encore (endless)',
    blurb: 'Closing Night, again and again. Waves grow without end and Andy Clark returns every 10th wave.',
    lives: 20,
    gold: 180,
    betweenDelay: 3,
    path: closingDef.path,
    blocks: closingDef.blocks,
    waves: [],
    generateWave: endlessWave,
  };

  function getLevel(idOrIndex) {
    if (typeof idOrIndex === 'number') return ALL_LEVELS.find((l) => l.index === idOrIndex) || null;
    if (idOrIndex === ENDLESS_LEVEL.id) return ENDLESS_LEVEL;
    return ALL_LEVELS.find((l) => l.id === idOrIndex) || null;
  }

  // Background music. Fair Harvard is the menu theme only (title, Dictionary, congrats).
  // Each map page and each stage has its own Glee Club excerpt, loaded only when that screen
  // opens; a missing file falls back to the shared beds in js/audio.js, never to Fair Harvard.
  const MUSIC = {
    menu: 'assets/audio/fair-harvard.mp3',
    pages: [
      'assets/audio/map/page-1.mp3',
      'assets/audio/map/page-2.mp3',
      'assets/audio/map/page-3.mp3',
      'assets/audio/map/page-4.mp3',
      'assets/audio/map/page-5.mp3',
      'assets/audio/map/page-6.mp3',
      'assets/audio/map/page-7.mp3',
      'assets/audio/map/page-8.mp3',
      'assets/audio/map/page-9.mp3',
    ],
    stages: {
      approach: 'assets/audio/stages/approach.mp3',
      entrance: 'assets/audio/stages/entrance.mp3',
      hallway: 'assets/audio/stages/hallway.mp3',
      elevator: 'assets/audio/stages/elevator.mp3',
      finale: 'assets/audio/stages/finale.mp3',
      encore: 'assets/audio/stages/encore.mp3',
      greenroom: 'assets/audio/stages/greenroom.mp3',
      dock: 'assets/audio/stages/dock.mp3',
      tourbus: 'assets/audio/stages/tourbus.mp3',
      closing: 'assets/audio/stages/closing.mp3',
      endless: 'assets/audio/stages/endless.mp3',
    },
  };

  // Music file for a stage: Carol staves use their own movement, other stages their excerpt.
  function trackUrl(levelOrId) {
    const level = typeof levelOrId === 'string' ? getLevel(levelOrId) : levelOrId;
    if (!level) return null;
    if (typeof level.music === 'string' && level.music) return CAROL_ACT.audioDir + level.music + '.mp3';
    return MUSIC.stages[level.id] || null;
  }

  // Music file for an adventure map page (0-based), or null.
  function pageTrackUrl(page) {
    return MUSIC.pages[page] || null;
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

  // Returns false when storage is unavailable or full, so callers (like the win flow)
  // keep going with the in-memory progress instead of throwing.
  function saveProgress(progress) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      return true;
    } catch (_) {
      return false;
    }
  }

  function markCleared(levelId) {
    const p = loadProgress();
    if (!p.cleared.includes(levelId)) p.cleared.push(levelId);
    const level = getLevel(levelId);
    // Carol staves unlock from "cleared", so they never move the main campaign's count.
    if (level && !level.act && level.index + 2 > p.unlocked) {
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

  function isEndlessUnlocked() {
    if (DEBUG) return true;
    const p = loadProgress();
    return p.cleared.includes('closing');
  }

  function isCarolUnlocked(progressOpt) {
    const p = progressOpt || loadProgress();
    return p.cleared.includes(CAROL_ACT.unlockAfter);
  }

  // The first Carol stave not yet cleared (the one the player is working on), or null once
  // the act is done or before Closing Night is cleared.
  function carolFrontier(progressOpt) {
    const p = progressOpt || loadProgress();
    if (!isCarolUnlocked(p)) return null;
    return CAROL_LEVELS.find((l) => !p.cleared.includes(l.id)) || null;
  }

  // One rule for every stage: main stages use the saved count, Encore follows
  // isEndlessUnlocked, and Carol staves open one at a time in order: a stave is open when it is
  // cleared or it is the first uncleared stave (and Closing Night is cleared). Saves from the
  // five-stave act keep their cleared staves open for replay and continue from the first new
  // stave before them.
  function isLevelUnlocked(levelOrId, progressOpt) {
    const level = typeof levelOrId === 'object' && levelOrId ? levelOrId : getLevel(levelOrId);
    if (!level) return false;
    if (level.endless) return isEndlessUnlocked();
    const p = progressOpt || loadProgress();
    if (level.act === CAROL_ACT.id) {
      if (!isCarolUnlocked(p)) return false;
      if (p.cleared.includes(level.id)) return true;
      const frontier = carolFrontier(p);
      return !!frontier && frontier.id === level.id;
    }
    return level.index < p.unlocked;
  }

  function getNextLevel(idOrIndex) {
    const cur = getLevel(idOrIndex);
    if (!cur || cur.endless) return null;
    if (cur.act === CAROL_ACT.id) return CAROL_LEVELS[cur.actIndex + 1] || null;
    return LEVELS[cur.index + 1] || null;
  }

  global.PNLevels = {
    COLS,
    ROWS,
    TILE,
    LEVELS,
    CAROL_ACT,
    CAROL_LEVELS,
    ALL_LEVELS,
    BASE_TOWERS,
    getLevel,
    getNextLevel,
    isLevelUnlocked,
    isCarolUnlocked,
    carolFrontier,
    trackUrl,
    pageTrackUrl,
    MUSIC,
    loadProgress,
    saveProgress,
    markCleared,
    unlockTower,
    isTowerUnlocked,
    hasUnlockedAndy,
    isDebug,
    ENDLESS_LEVEL,
    ENDLESS_TUNING,
    endlessWave,
    isEndlessUnlocked,
  };
})(typeof window !== 'undefined' ? window : globalThis);
