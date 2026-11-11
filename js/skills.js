/* Parting Notes - skill descriptions for the Dictionary, built from js/towers.js data */
(function (global) {
  // Plain-words line for each upgrade. Numbers are never typed here: they come from
  // PNTowers.combatStats, so a balance change in towers.js updates the Dictionary too.
  const WHAT = {
    soprano: {
      range: [
        'Longer breath lets her reach notes further down the path.',
        'Reaches further again.',
        'Her widest reach. Chain bounces look for a different kind of note first.',
      ],
      damage: [
        'Each hit echoes to one more nearby note.',
        'Hits harder and the echo carries to a second note.',
        'Her strongest tone. The echo carries to a third note with less falloff.',
      ],
    },
    alto: {
      range: [
        'She sings further, and her support aura covers more of the choir.',
        'A wider aura that also makes singers inside it sing faster.',
        'Her widest aura. Singers inside it chip Jazz notes harder and break Folk notes sooner.',
      ],
      damage: [
        'Clearer diction. Each Alto earns more gold on every kill.',
        'Singers inside her aura hit harder.',
        'The biggest aura damage boost for the choir around her.',
      ],
    },
    tenor: {
      range: [
        'Projects further down the path.',
        'Reaches further, with a wider splash.',
        'His widest reach. Every splash also slows the notes it hits.',
      ],
      damage: [
        'Harder hits and a wider splash.',
        'Splash hits harder when it catches a crowd.',
        'After a run of splash hits, the next shot swells bigger and louder.',
      ],
    },
    bass: {
      range: [
        'Sings on the beat, firing faster.',
        'Tighter rhythm, firing faster again.',
        'His fastest tempo. Each shot pierces on to a second note.',
      ],
      damage: [
        'A heavier hit on every shot.',
        'Hits harder, and each hit drags the note to a slower pace.',
        'His heaviest hold. A stronger slow and extra damage to Whole notes and bosses.',
      ],
    },
    andy: {
      range: [
        'Reaches further, with a wider cue.',
        'Reaches further again, with a wider cue.',
        'His longest reach and widest cue.',
      ],
      damage: [
        'A firmer tap with the baton.',
        'A heavier downbeat.',
        'His strongest hit. The cue holds notes longer and spreads wider.',
      ],
    },
  };

  const ROLE = {
    soprano: 'Single-target lead. The Tone path turns her hits into chain bounces.',
    alto: 'Light damage plus a support aura that powers up nearby singers. Every Alto adds gold to each kill.',
    tenor: 'Splash damage that hits every note near the impact.',
    bass: 'Reaches anywhere on the map. Slow, heavy shots.',
    andy: 'Long-range support. Each hit sends out a cue that freezes nearby notes in place.',
  };

  function round(n, places) {
    const p = Math.pow(10, places || 0);
    return Math.round(n * p) / p;
  }
  function secs(n) {
    return round(n, 2).toFixed(2).replace(/0$/, '') + ' s';
  }
  function pct(f) {
    return Math.round(f * 100) + '%';
  }
  function signed(n) {
    return (n >= 0 ? '+' : '') + round(n, 2);
  }

  function statsAt(type, ur, ud) {
    return global.PNTowers.combatStats({ type: type, kind: type, upgRange: ur, upgDamage: ud });
  }

  // Readable lines for every stat that changed between two combatStats results.
  function diffLines(a, b, crescendo) {
    const out = [];
    if (b.damage !== a.damage) out.push(signed(b.damage - a.damage) + ' damage (' + round(a.damage, 2) + ' to ' + round(b.damage, 2) + ')');
    if (b.range !== a.range && Number.isFinite(b.range)) out.push(signed(b.range - a.range) + ' range (' + a.range + ' to ' + b.range + ')');
    if (b.fireRate !== a.fireRate) {
      out.push(pct(1 - b.fireRate / a.fireRate) + ' shorter shot delay (' + secs(a.fireRate) + ' to ' + secs(b.fireRate) + ')');
    }
    if (b.splash !== a.splash) out.push(signed(b.splash - a.splash) + ' splash radius (' + a.splash + ' to ' + b.splash + ')');
    if (b.chainJumps !== a.chainJumps) out.push('bounces to ' + b.chainJumps + (b.chainJumps === 1 ? ' extra note' : ' extra notes'));
    if (b.chainRange !== a.chainRange) out.push('chain reach ' + a.chainRange + ' to ' + b.chainRange);
    if (b.chainJumps > 0 && b.chainDamageScale !== a.chainDamageScale) out.push('each bounce keeps ' + pct(b.chainDamageScale) + ' damage');
    if (b.chainPreferDifferent && !a.chainPreferDifferent) out.push('bounces prefer a different note type');
    if (b.auraRange !== a.auraRange) out.push(signed(b.auraRange - a.auraRange) + ' aura radius (' + a.auraRange + ' to ' + b.auraRange + ')');
    if (b.auraFireRateBonus !== a.auraFireRateBonus) out.push('singers in aura fire ' + pct(b.auraFireRateBonus - a.auraFireRateBonus) + ' faster');
    if (b.auraDamageBonus !== a.auraDamageBonus) {
      out.push('+' + pct(b.auraDamageBonus - a.auraDamageBonus) + ' aura damage (' + pct(a.auraDamageBonus) + ' to ' + pct(b.auraDamageBonus) + ')');
    }
    if (b.jazzCapBonus !== a.jazzCapBonus) out.push('+' + (b.jazzCapBonus - a.jazzCapBonus) + ' Jazz hit cap in aura');
    if (b.folkAssist !== a.folkAssist) out.push('+' + (b.folkAssist - a.folkAssist) + ' toward the Folk threshold in aura');
    if (b.goldPerKill !== a.goldPerKill) out.push('+' + b.goldPerKill + ' gold per kill per Alto (was +' + a.goldPerKill + ')');
    if (b.hitSlowDuration !== a.hitSlowDuration || b.hitSlowMult !== a.hitSlowMult) {
      out.push('hits slow notes to ' + pct(b.hitSlowMult) + ' speed for ' + secs(b.hitSlowDuration));
    }
    if (b.splashSlowDuration !== a.splashSlowDuration || b.splashSlowMult !== a.splashSlowMult) {
      out.push('splash slows notes to ' + pct(b.splashSlowMult) + ' speed for ' + secs(b.splashSlowDuration));
    }
    if (b.clusterMin !== a.clusterMin || b.clusterMult !== a.clusterMult) {
      out.push('+' + pct(b.clusterMult - 1) + ' splash damage when ' + b.clusterMin + ' or more notes are hit');
    }
    if (b.crescendo && !a.crescendo && crescendo) {
      out.push('after ' + crescendo.streak + ' splash hits in a row, the next shot deals x' + crescendo.damageMult + ' damage with x' + crescendo.splashMult + ' splash');
    }
    if (b.heavyBonusMult !== a.heavyBonusMult) out.push('+' + pct(b.heavyBonusMult - 1) + ' damage to Whole notes and bosses');
    if (b.cueRadius !== a.cueRadius) out.push(signed(b.cueRadius - a.cueRadius) + ' cue radius (' + a.cueRadius + ' to ' + b.cueRadius + ')');
    if (b.cueStunDuration !== a.cueStunDuration) {
      out.push('+' + secs(b.cueStunDuration - a.cueStunDuration) + ' cue freeze (' + secs(a.cueStunDuration) + ' to ' + secs(b.cueStunDuration) + ')');
    }
    return out;
  }

  // One entry per tier: name, cost, plain line and the numbers it changes.
  function describe(type, path, tier) {
    const T = global.PNTowers;
    const names = T.UPGRADE_NAMES_BY_VOICE[type];
    if (!names || !names[path] || tier < 0 || tier >= T.UPGRADE_MAX) return null;
    const other = path === 'range' ? 'damage' : 'range';
    const at = (t, o) => (path === 'range' ? statsAt(type, t, o) : statsAt(type, o, t));
    const nums = diffLines(at(tier, 0), at(tier + 1, 0), T.CRESCENDO);
    // Some upgrades only add something once the other path has its first tier (for example
    // Soprano chain reach needs Echo). Report those extra changes separately.
    const label = (l) => l.replace(/^[+-]?[0-9.]+%?\s*/, '').replace(/\s*\(.*\)$/, '');
    const plain = new Set(nums.map(label));
    const withOther = diffLines(at(tier, 1), at(tier + 1, 1), T.CRESCENDO).filter((l) => !plain.has(label(l)));
    withOther.forEach((l) => nums.push('with ' + names[other][0] + ': ' + l));
    const crossNote = tier + 1 > T.UPGRADE_CROSS_CAP
      ? 'Needs the ' + T.PATH_LABELS[type][other] + ' path at tier ' + T.UPGRADE_CROSS_CAP + ' or lower.'
      : '';
    return {
      type: type,
      path: path,
      tier: tier + 1,
      name: names[path][tier],
      cost: T.UPGRADE_COSTS[path][tier],
      what: (WHAT[type] && WHAT[type][path] && WHAT[type][path][tier]) || '',
      nums: nums,
      note: crossNote,
    };
  }

  function baseLines(type) {
    const T = global.PNTowers;
    const def = T.DEFS[type];
    if (!def) return [];
    const s = statsAt(type, 0, 0);
    const out = [
      'Damage ' + s.damage,
      Number.isFinite(s.range) ? 'Range ' + s.range : 'Range: whole map',
      'Shot delay ' + secs(s.fireRate),
    ];
    if (s.splash) out.push('Splash ' + s.splash);
    if (s.auraRange) out.push('Aura ' + s.auraRange + ', +' + pct(s.auraDamageBonus) + ' damage');
    if (s.goldPerKill) out.push('+' + s.goldPerKill + ' gold per kill');
    if (s.cueRadius) out.push('Cue ' + s.cueRadius + ' radius, ' + secs(s.cueStunDuration) + ' freeze');
    return out;
  }

  function forTower(type) {
    const T = global.PNTowers;
    const paths = ['range', 'damage'].map((path) => {
      const tiers = [];
      for (let i = 0; i < T.UPGRADE_MAX; i++) tiers.push(describe(type, path, i));
      return { path: path, label: T.PATH_LABELS[type][path], tiers: tiers };
    });
    return { type: type, role: ROLE[type] || '', base: baseLines(type), paths: paths };
  }

  global.PNSkills = { WHAT, ROLE, describe, baseLines, forTower, diffLines };
})(typeof window !== 'undefined' ? window : globalThis);
