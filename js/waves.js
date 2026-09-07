/* Parting Notes — wave director */
(function (global) {
  function flattenWave(wave) {
    const list = [];
    (wave.entries || []).forEach((entry) => {
      const style = entry.style || 'normal';
      for (let i = 0; i < entry.count; i++) {
        list.push({ type: entry.type, style });
      }
    });
    return list;
  }

  function createDirector(waveList, opts) {
    const WAVES = waveList && waveList.length ? waveList : [];
    const betweenDelay = (opts && opts.betweenDelay) || 5;

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

      totalWaves() {
        return this.waves.length;
      },

      currentDisplay() {
        if (!this.started) return 0;
        return Math.min(this.waveIndex + 1, this.waves.length);
      },

      begin() {
        if (this.phase !== 'ready' && this.phase !== 'between') return false;
        if (!this.waves.length) return false;
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
        const wave = this.waves[index];
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
            if (this.waveIndex >= this.waves.length - 1) {
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
