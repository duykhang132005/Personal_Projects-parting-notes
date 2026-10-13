/* Parting Notes — wave director */
(function (global) {
  function flattenWave(wave) {
    const list = [];
    (wave.entries || []).forEach((entry) => {
      const style = entry.style || 'normal';
      for (let i = 0; i < entry.count; i++) {
        const spawn = { type: entry.type, style };
        if (entry.hpMult) spawn.hpMult = entry.hpMult;
        if (entry.goldMult) spawn.goldMult = entry.goldMult;
        list.push(spawn);
      }
    });
    return list;
  }

  function createDirector(waveList, opts) {
    const WAVES = waveList && waveList.length ? waveList : [];
    const betweenDelay = (opts && opts.betweenDelay) || 5;
    // Endless mode: opts.generate(index) builds each wave on demand and there is no victory.
    const generate = opts && typeof opts.generate === 'function' ? opts.generate : null;

    return {
      waveIndex: 0,
      queue: [],
      spawnGap: 0.8,
      spawnTimer: 0,
      betweenTimer: 0,
      betweenDelay,
      phase: 'ready',
      started: false,
      waves: WAVES,
      endless: !!generate,

      totalWaves() {
        return generate ? Infinity : this.waves.length;
      },

      currentDisplay() {
        if (!this.started) return 0;
        if (generate) return this.waveIndex + 1;
        return Math.min(this.waveIndex + 1, this.waves.length);
      },

      /** Waves fully cleared so far (endless results). */
      wavesCleared() {
        return this.waveIndex;
      },

      begin() {
        if (this.phase !== 'ready' && this.phase !== 'between') return false;
        if (!generate && !this.waves.length) return false;
        this.started = true;
        this._loadWave(this.waveIndex);
        this.phase = 'spawning';
        this.spawnTimer = 0;
        return true;
      },

      skipBetween() {
        if (this.phase !== 'between') return false;
        this.betweenTimer = 0;
        return this.begin();
      },

      _loadWave(index) {
        const wave = generate ? generate(index) : this.waves[index];
        this.queue = flattenWave(wave);
        this.spawnGap = wave.spawnGap || 0.7;
        this.spawnTimer = 0;
      },

      update(dt, livingCount) {
        const out = {};
        if (this.phase === 'spawning') {
          this.spawnTimer += dt;
          if (this.queue.length && this.spawnTimer >= this.spawnGap) {
            this.spawnTimer = 0;
            out.spawned = this.queue.shift();
          }
          if (!this.queue.length && livingCount === 0) {
            if (!generate && this.waveIndex >= this.waves.length - 1) {
              this.phase = 'won';
              out.victory = true;
            } else {
              this.phase = 'between';
              this.betweenTimer = this.betweenDelay;
              this.waveIndex += 1;
              out.waveClear = true;
            }
          }
        } else if (this.phase === 'between') {
          this.betweenTimer -= dt;
          if (this.betweenTimer <= 0) this.begin();
        }
        return out;
      },
    };
  }

  global.PNWaves = { createDirector, flattenWave };
})(typeof window !== 'undefined' ? window : globalThis);
