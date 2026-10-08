/* Parting Notes — procedural Web Audio SFX + optional repertoire BGM */
(function (global) {
  const MUTE_KEY = 'parting-notes-mute';
  // Background music level (0 to 100), set by the Music volume slider next to Mute.
  const VOLUME_KEY = 'pn_music_volume_v1';
  let musicVolume = 100;
  let bgmDucked = false;

  let ctx = null;
  let unlocked = false;
  let muted = false;
  let masterGain = null;
  let sfxGain = null;
  let bgmGain = null;
  let bgmNodes = null;
  let bgmMode = null; // 'title' | 'adventure' | 'play' | 'closing' | null
  let htmlBgm = null;
  let htmlBgmUrl = null; // relative path currently loaded
  let trackCache = {}; // mode -> url|false
  // URLs that failed to load (for example a repertoire file that is not there yet). Shared across
  // modes and kept for this tab session (10 minute window) so a missing file is probed once, not on
  // every screen change or reload. Add ?debug to the page URL to ignore the remembered misses.
  const MISS_KEY = 'pn_bgm_missing_v1';
  const MISS_TTL_MS = 10 * 60 * 1000;
  let missedUrls = {};
  let missedSince = 0;
  // Same rule as PNLevels.isDebug (levels.js loads first): ?debug=0, false or off stays off.
  function debugOn() {
    try {
      if (global.PNLevels && typeof global.PNLevels.isDebug === 'function') return global.PNLevels.isDebug();
      const q = new URLSearchParams(global.location ? global.location.search : '');
      if (!q.has('debug')) return false;
      const v = String(q.get('debug') || '').toLowerCase();
      return v !== '0' && v !== 'false' && v !== 'off';
    } catch (_) {
      return false;
    }
  }
  (function loadMisses() {
    try {
      if (debugOn()) return;
      const raw = global.sessionStorage.getItem(MISS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d || typeof d.u !== 'object' || !d.u || Date.now() - d.t > MISS_TTL_MS) return;
      missedUrls = d.u;
      missedSince = d.t;
    } catch (_) {
      missedUrls = {};
    }
  })();
  function rememberMiss(url) {
    missedUrls[url] = 1;
    if (!missedSince) missedSince = Date.now();
    try {
      global.sessionStorage.setItem(MISS_KEY, JSON.stringify({ t: missedSince, u: missedUrls }));
    } catch (_) {}
  }
  // Candidate files to probe (browsers cannot list folders). Drop legal tracks into repertoire/.
  const BGM_CANDIDATES = {
    title: [
      'assets/audio/repertoire/title-01.mp3',
      'assets/audio/repertoire/title-01.ogg',
      'assets/audio/repertoire/glorious-apollo.mp3',
      'assets/audio/fair-harvard.mp3',
      'assets/audio/fair-harvard.ogg',
    ],
    adventure: [
      'assets/audio/repertoire/adventure-01.mp3',
      'assets/audio/repertoire/adventure-01.ogg',
      'assets/audio/repertoire/abendlied.mp3',
      'assets/audio/repertoire/o-vos-omnes.mp3',
    ],
    play: [
      'assets/audio/repertoire/play-01.mp3',
      'assets/audio/repertoire/play-01.ogg',
      'assets/audio/repertoire/football-songs.mp3',
    ],
    closing: [
      'assets/audio/repertoire/closing-01.mp3',
      'assets/audio/repertoire/closing-01.ogg',
      'assets/audio/repertoire/come-ye-disconsolate.mp3',
    ],
  };
  const BGM_FALLBACK = [
    'assets/audio/fair-harvard.mp3',
    'assets/audio/fair-harvard.ogg',
  ];

  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (_) {
    muted = false;
  }

  function clampVolume(v) {
    const n = Math.round(Number(v));
    if (!isFinite(n)) return 100;
    return Math.max(0, Math.min(100, n));
  }

  try {
    const savedVol = localStorage.getItem(VOLUME_KEY);
    if (savedVol !== null && savedVol !== '') musicVolume = clampVolume(savedVol);
  } catch (_) {
    musicVolume = 100;
  }

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    sfxGain = ctx.createGain();
    bgmGain = ctx.createGain();
    sfxGain.gain.value = 0.55;
    bgmGain.gain.value = 0.22 * (musicVolume / 100);
    masterGain.gain.value = muted ? 0 : 1;
    sfxGain.connect(masterGain);
    bgmGain.connect(masterGain);
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') {
      c.resume().catch(function () {});
    }
    unlocked = true;
    // The title bed is usually loaded before the first gesture, so start it now.
    if (htmlBgm && bgmMode && !muted && htmlBgm.paused && htmlBgm.src) {
      htmlBgm.play().catch(function () {});
    }
    // Soft click so browsers keep the context alive after gesture
    if (!muted) {
      try {
        const t = c.currentTime;
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.value = 440;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        o.connect(g);
        g.connect(sfxGain);
        o.start(t);
        o.stop(t + 0.04);
      } catch (_) {}
    }
  }

  function bindUnlockOnce() {
    const once = function () {
      unlock();
      document.removeEventListener('pointerdown', once, true);
      document.removeEventListener('keydown', once, true);
      document.removeEventListener('touchstart', once, true);
    };
    document.addEventListener('pointerdown', once, true);
    document.addEventListener('keydown', once, true);
    document.addEventListener('touchstart', once, true);
  }

  function applyMute() {
    if (masterGain) {
      masterGain.gain.value = muted ? 0 : 1;
    }
    if (htmlBgm) {
      htmlBgm.muted = muted;
      if (muted) {
        try {
          htmlBgm.pause();
        } catch (_) {}
      } else if (bgmMode && unlocked) {
        htmlBgm.play().catch(function () {});
      }
    }
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch (_) {}
    syncMuteButtons();
    syncVolumeSliders();
  }

  function setMuted(v) {
    muted = !!v;
    applyMute();
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function syncMuteButtons() {
    document.querySelectorAll('[data-mute-btn]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
      btn.textContent = muted ? 'Unmute' : 'Mute';
      btn.title = muted ? 'Unmute sound' : 'Mute sound';
    });
  }

  function getMusicVolume() {
    return musicVolume;
  }

  // Music only (file BGM and procedural pad). Sound effects keep their own level. Mute still
  // silences everything; unmuting returns to this level.
  function setMusicVolume(v) {
    musicVolume = clampVolume(v);
    applyBgmLevels(bgmDucked);
    try {
      localStorage.setItem(VOLUME_KEY, String(musicVolume));
    } catch (_) {}
    syncVolumeSliders();
    return musicVolume;
  }

  function syncVolumeSliders() {
    const text = musicVolume + '%' + (muted ? ' (sound muted)' : '');
    document.querySelectorAll('[data-music-volume]').forEach(function (input) {
      if (String(input.value) !== String(musicVolume)) input.value = String(musicVolume);
      input.setAttribute('aria-valuetext', text);
    });
    document.querySelectorAll('[data-music-volume-out]').forEach(function (out) {
      out.textContent = musicVolume + '%';
    });
  }

  function envGain(duration, peak, attack, release) {
    const c = ensureCtx();
    if (!c || !unlocked) return null;
    const t = c.currentTime;
    const g = c.createGain();
    const a = attack != null ? attack : 0.008;
    const r = release != null ? release : Math.max(0.04, duration * 0.45);
    const p = peak != null ? peak : 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(p, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + 0.01, duration - 0.001));
    g.connect(sfxGain);
    return { g: g, t: t, stop: t + duration + 0.02 };
  }

  function tone(freq, duration, type, peak) {
    const c = ensureCtx();
    if (!c || !unlocked || muted) return;
    const eg = envGain(duration, peak);
    if (!eg) return;
    const o = c.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, eg.t);
    o.connect(eg.g);
    o.start(eg.t);
    o.stop(eg.stop);
  }

  function noiseBurst(duration, peak, filterFreq, filterType) {
    const c = ensureCtx();
    if (!c || !unlocked || muted) return;
    const eg = envGain(duration, peak, 0.002, duration * 0.5);
    if (!eg) return;
    const n = Math.max(1, Math.floor(c.sampleRate * duration));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = filterType || 'lowpass';
    f.frequency.value = filterFreq || 1200;
    src.connect(f);
    f.connect(eg.g);
    src.start(eg.t);
    src.stop(eg.stop);
  }

  const PART_PITCH = {
    soprano: 880,
    alto: 660,
    tenor: 440,
    bass: 220,
  };

  const SFX = {
    place: function () {
      tone(523.25, 0.08, 'triangle', 0.18);
      setTimeout(function () {
        tone(659.25, 0.1, 'triangle', 0.14);
      }, 40);
    },
    sell: function () {
      tone(392, 0.07, 'sine', 0.12);
      setTimeout(function () {
        tone(311.13, 0.12, 'sine', 0.1);
      }, 50);
    },
    startWave: function () {
      tone(392, 0.09, 'square', 0.1);
      setTimeout(function () {
        tone(523.25, 0.1, 'square', 0.1);
      }, 70);
      setTimeout(function () {
        tone(659.25, 0.14, 'square', 0.08);
      }, 140);
    },
    hit: function (part) {
      const f = PART_PITCH[part] || 520;
      tone(f, 0.05, 'triangle', 0.1);
      noiseBurst(0.04, 0.05, f * 1.2, 'bandpass');
    },
    kill: function () {
      tone(660, 0.06, 'sine', 0.12);
      setTimeout(function () {
        tone(880, 0.08, 'sine', 0.1);
      }, 45);
      setTimeout(function () {
        tone(1174, 0.1, 'triangle', 0.08);
      }, 90);
    },
    jazzCapped: function () {
      const c = ensureCtx();
      if (!c || !unlocked || muted) return;
      [988, 1318, 1568].forEach(function (f, i) {
        setTimeout(function () {
          tone(f, 0.07, 'sine', 0.07);
        }, i * 28);
      });
      noiseBurst(0.08, 0.04, 4000, 'highpass');
    },
    folkBlocked: function () {
      noiseBurst(0.1, 0.14, 180, 'lowpass');
      tone(90, 0.12, 'sawtooth', 0.08);
    },
    lifeLeak: function () {
      tone(220, 0.15, 'sawtooth', 0.12);
      setTimeout(function () {
        tone(165, 0.2, 'sawtooth', 0.1);
      }, 80);
    },
    win: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        setTimeout(function () {
          tone(f, 0.18, 'triangle', 0.12);
        }, i * 90);
      });
    },
    lose: function () {
      [392, 349, 311, 247].forEach(function (f, i) {
        setTimeout(function () {
          tone(f, 0.22, 'sine', 0.11);
        }, i * 110);
      });
    },
    andyCue: function () {
      const c = ensureCtx();
      if (!c || !unlocked || muted) return;
      tone(740, 0.06, 'square', 0.14);
      setTimeout(function () {
        tone(988, 0.08, 'square', 0.12);
      }, 40);
      setTimeout(function () {
        tone(1480, 0.12, 'triangle', 0.1);
      }, 90);
      noiseBurst(0.12, 0.06, 2200, 'bandpass');
    },
    uiClick: function () {
      tone(640, 0.03, 'sine', 0.06);
    },
  };

  function play(name, arg) {
    const fn = SFX[name];
    if (!fn) return;
    ensureCtx();
    if (!unlocked) return;
    try {
      fn(arg);
    } catch (_) {}
  }

  function stopProceduralBgm() {
    if (!bgmNodes) return;
    if (bgmNodes._timer) {
      clearInterval(bgmNodes._timer);
      bgmNodes._timer = null;
    }
    try {
      bgmNodes.forEach(function (n) {
        try {
          if (n && n.stop) n.stop();
          if (n && n.disconnect) n.disconnect();
        } catch (_) {}
      });
    } catch (_) {}
    bgmNodes = null;
  }

  function stopHtmlBgm(reset) {
    if (!htmlBgm) return;
    try {
      htmlBgm.pause();
      if (reset) {
        htmlBgm.currentTime = 0;
        htmlBgmUrl = null;
      }
    } catch (_) {}
  }

  function applyBgmLevels(duck) {
    bgmDucked = !!duck;
    const v = musicVolume / 100;
    if (bgmGain) bgmGain.gain.value = (duck ? 0.1 : 0.2) * v;
    if (htmlBgm) htmlBgm.volume = (duck ? 0.28 : 0.42) * v;
  }

  function sameBgmUrl(url) {
    if (!url) return false;
    if (htmlBgmUrl && htmlBgmUrl === url) return true;
    if (htmlBgm && htmlBgm.src && htmlBgm.src.indexOf(url) !== -1) return true;
    return false;
  }

  function probeUrl(url, done) {
    if (missedUrls[url]) {
      done(null);
      return;
    }
    const a = new Audio();
    let settled = false;
    const finish = function (ok) {
      if (settled) return;
      settled = true;
      a.oncanplaythrough = null;
      a.onerror = null;
      done(ok ? url : null);
    };
    a.preload = 'metadata';
    a.oncanplaythrough = function () {
      finish(true);
    };
    a.onerror = function () {
      rememberMiss(url);
      finish(false);
    };
    a.src = url;
    setTimeout(function () {
      if (!settled) finish(a.readyState >= 1);
    }, 450);
  }

  function probeList(list, done) {
    let i = 0;
    function next() {
      if (i >= list.length) {
        done(null);
        return;
      }
      const url = list[i++];
      probeUrl(url, function (ok) {
        if (ok) done(ok);
        else next();
      });
    }
    next();
  }

  function candidatesFor(mode) {
    const m = mode === 'play' || mode === 'adventure' || mode === 'closing' ? mode : 'title';
    const primary = (BGM_CANDIDATES[m] || []).slice();
    const chain =
      m === 'closing'
        ? primary.concat(BGM_CANDIDATES.play || [], BGM_CANDIDATES.adventure || [], BGM_CANDIDATES.title || [], BGM_FALLBACK)
        : m === 'play'
          ? primary.concat(BGM_CANDIDATES.title || [], BGM_FALLBACK)
          : m === 'adventure'
            ? primary.concat(BGM_CANDIDATES.title || [], BGM_FALLBACK)
            : primary.concat(BGM_FALLBACK);
    const seen = {};
    const out = [];
    chain.forEach(function (u) {
      if (!seen[u]) {
        seen[u] = true;
        out.push(u);
      }
    });
    return out;
  }

  function findTrack(mode, done) {
    const key = mode === 'play' || mode === 'adventure' || mode === 'closing' ? mode : 'title';
    if (trackCache[key] === false) {
      done(null);
      return;
    }
    if (typeof trackCache[key] === 'string') {
      done(trackCache[key]);
      return;
    }
    probeList(candidatesFor(key), function (url) {
      trackCache[key] = url || false;
      done(url || null);
    });
  }

  function startProceduralPad(duck) {
    const c = ensureCtx();
    if (!c || !unlocked) return;
    stopProceduralBgm();
    const t0 = c.currentTime;
    const nodes = [];
    const mix = c.createGain();
    mix.gain.value = duck ? 0.45 : 1;
    mix.connect(bgmGain);

    // Soft choral-ish triad pad (college-song atmosphere, not a rip)
    const freqs = [196, 246.94, 293.66, 392]; // G3 B3 D4 G4
    freqs.forEach(function (f, idx) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = idx % 2 === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      g.gain.value = 0.045 - idx * 0.006;
      // Slow tremolo
      const lfo = c.createOscillator();
      const lfoG = c.createGain();
      lfo.frequency.value = 0.12 + idx * 0.03;
      lfoG.gain.value = 0.012;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      o.connect(g);
      g.connect(mix);
      o.start(t0);
      lfo.start(t0);
      nodes.push(o, lfo, g, lfoG);
    });

    // Gentle arpeggio loop
    const arp = [392, 493.88, 587.33, 659.25, 587.33, 493.88];
    const arpGain = c.createGain();
    arpGain.gain.value = duck ? 0.035 : 0.055;
    arpGain.connect(mix);
    let step = 0;
    const intervalMs = 520;
    const timer = setInterval(function () {
      if (!bgmNodes || muted || !unlocked) return;
      const f = arp[step % arp.length];
      step += 1;
      try {
        const o = c.createOscillator();
        const g = c.createGain();
        const t = c.currentTime;
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g);
        g.connect(arpGain);
        o.start(t);
        o.stop(t + 0.38);
      } catch (_) {}
    }, intervalMs);
    nodes._timer = timer;
    nodes.push(mix, arpGain);
    bgmNodes = nodes;
  }

  function bgmStart(mode) {
    ensureCtx();
    const next =
      mode === 'play' || mode === 'adventure' || mode === 'closing' ? mode : 'title';
    const duck = next === 'play' || next === 'closing';
    bgmMode = next;
    applyBgmLevels(duck);

    function ensurePlayingHtml() {
      if (!htmlBgm) return;
      htmlBgm.muted = muted;
      applyBgmLevels(duck);
      if (unlocked && !muted && htmlBgm.paused) {
        htmlBgm.play().catch(function () {
          /* keep silent / procedural fallback only if nothing playing */
        });
      }
    }

    function switchHtmlTrack(url, continueAt) {
      stopProceduralBgm();
      const t = continueAt != null ? continueAt : 0;
      try {
        if (!htmlBgm) {
          htmlBgm = new Audio();
          htmlBgm.loop = true;
        }
        const needLoad = !sameBgmUrl(url);
        if (needLoad) {
          const onMeta = function () {
            htmlBgm.removeEventListener('loadedmetadata', onMeta);
            try {
              const dur = htmlBgm.duration;
              if (dur && isFinite(dur) && dur > 0) {
                htmlBgm.currentTime = ((t % dur) + dur) % dur;
              }
            } catch (_) {}
            ensurePlayingHtml();
          };
          htmlBgm.addEventListener('loadedmetadata', onMeta);
          htmlBgm.src = url;
          htmlBgmUrl = url;
          // If metadata already cached
          if (htmlBgm.readyState >= 1) onMeta();
        } else {
          ensurePlayingHtml();
        }
        htmlBgm.muted = muted;
        applyBgmLevels(duck);
      } catch (_) {
        startProceduralPad(duck);
      }
    }

    findTrack(next, function (url) {
      if (bgmMode !== next) return;
      applyBgmLevels(duck);

      if (url) {
        // Same song already running — only retune volume for the new backdrop.
        if (sameBgmUrl(url) && htmlBgm && !htmlBgm.paused) {
          stopProceduralBgm();
          ensurePlayingHtml();
          return;
        }
        if (sameBgmUrl(url) && htmlBgm) {
          stopProceduralBgm();
          ensurePlayingHtml();
          return;
        }
        // Different song: keep wall-clock position in the loop.
        const tKeep = htmlBgm && !isNaN(htmlBgm.currentTime) ? htmlBgm.currentTime : 0;
        switchHtmlTrack(url, tKeep);
        return;
      }

      // No file — procedural pad; do not restart if already running.
      if (bgmNodes) {
        applyBgmLevels(duck);
        return;
      }
      // Pause HTML without wiping position so returning to a file bed can resume.
      stopHtmlBgm(false);
      if (unlocked) startProceduralPad(duck);
      else {
        const wait = function () {
          if (!unlocked || bgmMode !== next) return;
          if (!bgmNodes) startProceduralPad(duck);
          document.removeEventListener('pointerdown', wait, true);
        };
        document.addEventListener('pointerdown', wait, true);
      }
    });
  }

  function bgmStop() {
    stopProceduralBgm();
    stopHtmlBgm(true);
    bgmMode = null;
  }

  // Public aliases matching requested API surface
  const PNAudio = {
    unlock: unlock,
    toggleMute: toggleMute,
    setMuted: setMuted,
    isMuted: isMuted,
    syncMuteButtons: syncMuteButtons,
    setMusicVolume: setMusicVolume,
    getMusicVolume: getMusicVolume,
    syncVolumeSliders: syncVolumeSliders,
    play: play,
    place: function () {
      play('place');
    },
    sell: function () {
      play('sell');
    },
    startWave: function () {
      play('startWave');
    },
    hit: function (part) {
      play('hit', part);
    },
    kill: function () {
      play('kill');
    },
    jazzCapped: function () {
      play('jazzCapped');
    },
    folkBlocked: function () {
      play('folkBlocked');
    },
    lifeLeak: function () {
      play('lifeLeak');
    },
    win: function () {
      play('win');
    },
    lose: function () {
      play('lose');
    },
    andyCue: function () {
      play('andyCue');
    },
    uiClick: function () {
      play('uiClick');
    },
    bgmStart: bgmStart,
    bgmStop: bgmStop,
  };

  bindUnlockOnce();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncMuteButtons);
    document.addEventListener('DOMContentLoaded', syncVolumeSliders);
  } else {
    syncMuteButtons();
    syncVolumeSliders();
  }

  global.PNAudio = PNAudio;
})(typeof window !== 'undefined' ? window : globalThis);
