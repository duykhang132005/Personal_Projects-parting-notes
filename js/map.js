/* Parting Notes — theme-aware stage backdrops (journey to the hall) */
(function (global) {
  const TILE_GRASS = 0;
  const TILE_PATH = 1;
  const TILE_BLOCK = 2;

  function cellCenter(c, r, tile) {
    return { x: c * tile + tile / 2, y: r * tile + tile / 2 };
  }

  function hash(c, r) {
    return ((c * 73856093) ^ (r * 19349663)) >>> 0;
  }

  function buildGrid(cols, rows, pathCells, blocks) {
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) row.push(TILE_GRASS);
      grid.push(row);
    }
    (blocks || []).forEach(([c, r]) => {
      if (grid[r] && grid[r][c] !== undefined) grid[r][c] = TILE_BLOCK;
    });
    (pathCells || []).forEach(([c, r]) => {
      if (grid[r] && grid[r][c] !== undefined) grid[r][c] = TILE_PATH;
    });
    return grid;
  }

  /** Visual themes keyed by level index — grid/path/blocks stay logical. */
  const THEMES = [
    {
      id: 'approach',
      path: { shadow: '#3a3a38', mid: '#8a8680', top: '#b8b4aa', dash: 'rgba(60,60,55,0.35)' },
      hintOk: 'rgba(40, 90, 40, 0.7)',
      hintBad: 'rgba(140, 40, 40, 0.7)',
    },
    {
      id: 'entrance',
      path: { shadow: '#2a1c14', mid: '#6b4a32', top: '#8b6340', dash: 'rgba(201,162,39,0.4)' },
      hintOk: 'rgba(201, 162, 39, 0.65)',
      hintBad: 'rgba(139, 41, 66, 0.65)',
    },
    {
      id: 'hallway',
      path: { shadow: '#1a1410', mid: '#4a3a2e', top: '#6a5544', dash: 'rgba(200,180,140,0.35)' },
      hintOk: 'rgba(201, 162, 39, 0.65)',
      hintBad: 'rgba(139, 41, 66, 0.65)',
    },
    {
      id: 'elevator',
      path: { shadow: '#1c1e22', mid: '#4a5058', top: '#6a727c', dash: 'rgba(180,200,220,0.4)' },
      hintOk: 'rgba(140, 180, 220, 0.7)',
      hintBad: 'rgba(139, 41, 66, 0.65)',
    },
    {
      id: 'stage',
      path: { shadow: '#2a1218', mid: '#5c1a2c', top: '#8b2942', dash: 'rgba(201,162,39,0.45)' },
      hintOk: 'rgba(201, 162, 39, 0.65)',
      hintBad: 'rgba(139, 41, 66, 0.65)',
    },
    {
      id: 'encore',
      path: { shadow: '#1a0c14', mid: '#6b1838', top: '#a51c30', dash: 'rgba(255,220,140,0.5)' },
      hintOk: 'rgba(255, 220, 140, 0.7)',
      hintBad: 'rgba(139, 41, 66, 0.7)',
    },
    {
      id: 'greenroom',
      path: { shadow: '#0e1a12', mid: '#2a5a3a', top: '#3d8a58', dash: 'rgba(180,220,160,0.4)' },
      hintOk: 'rgba(100, 180, 120, 0.7)',
      hintBad: 'rgba(139, 41, 66, 0.65)',
    },
    {
      id: 'dock',
      path: { shadow: '#1a1a10', mid: '#5a5a28', top: '#8a8a3a', dash: 'rgba(40,40,20,0.5)' },
      hintOk: 'rgba(220, 200, 60, 0.65)',
      hintBad: 'rgba(139, 41, 66, 0.65)',
    },
    {
      id: 'tourbus',
      path: { shadow: '#0c1018', mid: '#2a3548', top: '#4a5a70', dash: 'rgba(100,140,200,0.4)' },
      hintOk: 'rgba(120, 160, 220, 0.7)',
      hintBad: 'rgba(139, 41, 66, 0.65)',
    },
    {
      id: 'closing',
      path: { shadow: '#2a0c18', mid: '#7a1a38', top: '#c41e3a', dash: 'rgba(255,230,160,0.55)' },
      hintOk: 'rgba(255, 220, 120, 0.75)',
      hintBad: 'rgba(139, 41, 66, 0.7)',
    },
  ];

  function createMap(level) {
    const cols = (level && level.cols) || PNLevels.COLS;
    const rows = (level && level.rows) || PNLevels.ROWS;
    const tile = (level && level.tile) || PNLevels.TILE;
    const pathCells = (level && level.path) || [];
    const blocks = (level && level.blocks) || [];
    const grid = buildGrid(cols, rows, pathCells, blocks);
    const waypoints = pathCells.map(([c, r]) => cellCenter(c, r, tile));
    const width = cols * tile;
    const height = rows * tile;
    const seed = (level && typeof level.index === 'number') ? level.index : 0;
    const theme = THEMES[Math.min(seed, THEMES.length - 1)] || THEMES[0];

    function strokePath(ctx, widthMul, color, offsetScale) {
      if (waypoints.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = tile * widthMul;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < waypoints.length; i++) {
        const p = waypoints[i];
        const hx = hash(i + seed * 3, seed + 11);
        const jx = ((hx % 9) - 4) * offsetScale;
        const jy = (((hx >> 4) % 9) - 4) * offsetScale;
        if (i === 0) ctx.moveTo(p.x + jx, p.y + jy);
        else ctx.lineTo(p.x + jx, p.y + jy);
      }
      ctx.stroke();
    }

    function drawThemedPath(ctx) {
      if (waypoints.length < 2) return;
      const p = theme.path;
      strokePath(ctx, 0.9, p.shadow, 0.4);
      strokePath(ctx, 0.78, p.mid, 0.32);
      strokePath(ctx, 0.62, p.top, 0.28);

      ctx.strokeStyle = p.dash;
      ctx.lineWidth = tile * 0.08;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);
      for (let i = 1; i < waypoints.length; i++) ctx.lineTo(waypoints[i].x, waypoints[i].y);
      ctx.stroke();
      ctx.setLineDash([]);

      for (let i = 0; i < waypoints.length - 1; i++) {
        const a = waypoints[i];
        const b = waypoints[i + 1];
        for (let s = 0; s < 8; s++) {
          const t = s / 8;
          const x = a.x + (b.x - a.x) * t;
          const y = a.y + (b.y - a.y) * t;
          const hx = hash(i * 19 + s, seed + 7);
          ctx.fillStyle = hx % 2 === 0 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.07)';
          ctx.beginPath();
          ctx.ellipse(x + ((hx % 11) - 5), y + (((hx >> 3) % 11) - 5), 2 + (hx % 3), 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    /* —— Level 0: grass field + sidewalk approach —— */
    function drawBackdropApproach(ctx) {
      const sky = ctx.createLinearGradient(0, 0, 0, height * 0.35);
      sky.addColorStop(0, '#7eb6e8');
      sky.addColorStop(1, '#b8d4a8');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height * 0.28);

      const grass = ctx.createLinearGradient(0, height * 0.22, 0, height);
      grass.addColorStop(0, '#6aaa58');
      grass.addColorStop(0.5, '#5a9a4a');
      grass.addColorStop(1, '#3d6b3a');
      ctx.fillStyle = grass;
      ctx.fillRect(0, height * 0.22, width, height * 0.78);

      for (let i = 0; i < 80; i++) {
        const hx = hash(i, seed + 3);
        const gx = (hx % width);
        const gy = height * 0.28 + ((hx >> 8) % Math.floor(height * 0.7));
        ctx.fillStyle = hx % 3 === 0 ? 'rgba(255,255,200,0.12)' : 'rgba(20,60,20,0.18)';
        ctx.fillRect(gx, gy, 3 + (hx % 4), 2);
      }

      // distant treeline
      for (let x = 0; x < width; x += 28) {
        const hx = hash(x, seed);
        const th = 28 + (hx % 22);
        ctx.fillStyle = '#2d5a2a';
        ctx.beginPath();
        ctx.moveTo(x, height * 0.28);
        ctx.lineTo(x + 14, height * 0.28 - th);
        ctx.lineTo(x + 28, height * 0.28);
        ctx.fill();
      }
    }

    function drawBuildableApproach(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile;
          const y = r * tile;
          const hx = hash(c, r + seed);
          ctx.fillStyle = hx % 2 === 0 ? 'rgba(70,130,60,0.15)' : 'rgba(40,90,40,0.1)';
          ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        }
      }
    }

    function drawPropsApproach(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2;
        const y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + 20, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (i % 2 === 0) {
          // tree
          ctx.fillStyle = '#5a3a1e';
          ctx.fillRect(x - 3, y + 2, 6, 18);
          ctx.fillStyle = '#2d6b2a';
          ctx.beginPath();
          ctx.arc(x, y - 4, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3d8a3a';
          ctx.beginPath();
          ctx.arc(x - 6, y, 10, 0, Math.PI * 2);
          ctx.arc(x + 7, y - 2, 9, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // planter
          ctx.fillStyle = '#8b6340';
          ctx.fillRect(x - 14, y + 6, 28, 14);
          ctx.fillStyle = '#5a3a1e';
          ctx.fillRect(x - 12, y + 4, 24, 6);
          ctx.fillStyle = '#3d8a3a';
          ctx.beginPath();
          ctx.ellipse(x, y + 2, 10, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#c23b5a';
          ctx.beginPath();
          ctx.arc(x - 4, y - 2, 3, 0, Math.PI * 2);
          ctx.arc(x + 5, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    function drawMarkersApproach(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0];
      const end = waypoints[waypoints.length - 1];
      // street lamp / curb start
      ctx.fillStyle = '#4a4a48';
      ctx.fillRect(start.x - 4, start.y - 28, 8, 36);
      ctx.fillStyle = '#e8c547';
      ctx.beginPath();
      ctx.arc(start.x, start.y - 30, 8, 0, Math.PI * 2);
      ctx.fill();
      // hall facade doors at end
      ctx.fillStyle = '#3d2418';
      ctx.fillRect(end.x - 4, end.y - 30, 36, 58);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(end.x - 2, end.y - 32, 32, 6);
      ctx.fillStyle = '#5c1a2c';
      ctx.fillRect(end.x + 2, end.y - 22, 12, 40);
      ctx.fillRect(end.x + 16, end.y - 22, 12, 40);
      ctx.fillStyle = '#e8c547';
      ctx.beginPath();
      ctx.arc(end.x + 12, end.y - 2, 2, 0, Math.PI * 2);
      ctx.arc(end.x + 18, end.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    /* —— Level 1: entering the building —— */
    function drawBackdropEntrance(ctx) {
      // brick facade upper
      const brick = ctx.createLinearGradient(0, 0, 0, height);
      brick.addColorStop(0, '#8b4a3a');
      brick.addColorStop(0.35, '#6e3a2e');
      brick.addColorStop(1, '#4a2e24');
      ctx.fillStyle = brick;
      ctx.fillRect(0, 0, width, height);

      const brickH = 14;
      const brickW = 32;
      for (let y = 0, row = 0; y < height; y += brickH, row++) {
        const off = row % 2 === 0 ? 0 : brickW / 2;
        for (let x = -brickW + off; x < width; x += brickW) {
          ctx.strokeStyle = 'rgba(30,12,8,0.35)';
          ctx.strokeRect(x + 0.5, y + 0.5, brickW - 1, brickH - 1);
          if (hash(x, y + seed) % 7 === 0) {
            ctx.fillStyle = 'rgba(255,200,160,0.06)';
            ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
          }
        }
      }

      // lobby threshold / stone floor strip lower
      const stone = ctx.createLinearGradient(0, height * 0.55, 0, height);
      stone.addColorStop(0, '#6a5a4a');
      stone.addColorStop(1, '#4a3e34');
      ctx.fillStyle = stone;
      ctx.fillRect(0, height * 0.55, width, height * 0.45);
      for (let y = height * 0.55; y < height; y += 20) {
        ctx.strokeStyle = 'rgba(20,14,10,0.25)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // grand doorway silhouette at top
      ctx.fillStyle = 'rgba(20,10,8,0.55)';
      ctx.fillRect(width * 0.35, 0, width * 0.3, height * 0.22);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(width * 0.34, height * 0.2, width * 0.32, 6);
    }

    function drawBuildableEntrance(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile;
          const y = r * tile;
          ctx.fillStyle = 'rgba(90,70,50,0.2)';
          ctx.fillRect(x + 4, y + 4, tile - 8, tile - 8);
          ctx.strokeStyle = 'rgba(201,162,39,0.12)';
          ctx.strokeRect(x + 8, y + 8, tile - 16, tile - 16);
        }
      }
    }

    function drawPropsEntrance(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2;
        const y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + 18, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (i % 3 === 0) {
          // column / pillar
          ctx.fillStyle = '#d4c4a8';
          ctx.fillRect(x - 8, y - 22, 16, 42);
          ctx.fillStyle = '#c9a227';
          ctx.fillRect(x - 12, y - 26, 24, 8);
          ctx.fillRect(x - 12, y + 16, 24, 6);
        } else if (i % 3 === 1) {
          // double doors prop
          ctx.fillStyle = '#3d2418';
          ctx.fillRect(x - 16, y - 18, 32, 36);
          ctx.fillStyle = '#5c1a2c';
          ctx.fillRect(x - 14, y - 14, 13, 30);
          ctx.fillRect(x + 1, y - 14, 13, 30);
          ctx.fillStyle = '#e8c547';
          ctx.fillRect(x - 2, y - 2, 4, 4);
        } else {
          // lobby planter
          ctx.fillStyle = '#4a3a2a';
          ctx.fillRect(x - 12, y + 4, 24, 16);
          ctx.fillStyle = '#2d6b2a';
          ctx.beginPath();
          ctx.ellipse(x, y, 12, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    function drawMarkersEntrance(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0];
      const end = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#2a1810';
      ctx.fillRect(start.x - 16, start.y - 24, 18, 44);
      ctx.fillStyle = '#8b2942';
      ctx.fillRect(start.x - 12, start.y - 18, 10, 32);
      ctx.fillStyle = '#3d2418';
      ctx.beginPath();
      ctx.roundRect(end.x - 4, end.y - 28, 32, 54, 4);
      ctx.fill();
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(end.x - 2, end.y - 30, 28, 5);
      ctx.fillStyle = '#6a5544';
      ctx.fillRect(end.x + 4, end.y - 20, 16, 36);
    }

    /* —— Level 2: interior hallway —— */
    function drawBackdropHallway(ctx) {
      const wall = ctx.createLinearGradient(0, 0, 0, height);
      wall.addColorStop(0, '#5a4a3e');
      wall.addColorStop(0.4, '#4a3c32');
      wall.addColorStop(1, '#3a2e28');
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, width, height);

      // wainscoting
      ctx.fillStyle = '#3d2914';
      ctx.fillRect(0, height * 0.42, width, height * 0.58);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(0, height * 0.42, width, 4);
      ctx.fillRect(0, height * 0.42 + 10, width, 2);

      // floor planks
      for (let y = height * 0.45; y < height; y += 16) {
        ctx.fillStyle = (Math.floor(y / 16) % 2 === 0) ? 'rgba(255,210,150,0.05)' : 'rgba(20,10,5,0.1)';
        ctx.fillRect(0, y, width, 15);
        ctx.strokeStyle = 'rgba(20,10,5,0.3)';
        ctx.beginPath();
        ctx.moveTo(0, y + 15.5);
        ctx.lineTo(width, y + 15.5);
        ctx.stroke();
      }

      // wall sconces
      for (let x = 80; x < width; x += 140) {
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(x - 3, height * 0.28, 6, 14);
        const glow = ctx.createRadialGradient(x, height * 0.28, 2, x, height * 0.28, 40);
        glow.addColorStop(0, 'rgba(255,220,140,0.35)');
        glow.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, height * 0.28, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      // door frames along top wall
      for (let x = 40; x < width - 40; x += 160) {
        ctx.fillStyle = 'rgba(20,12,8,0.4)';
        ctx.fillRect(x, height * 0.08, 36, height * 0.32);
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, height * 0.08, 36, height * 0.32);
      }
    }

    function drawBuildableHallway(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile;
          const y = r * tile;
          ctx.fillStyle = 'rgba(70,55,45,0.25)';
          ctx.fillRect(x + 3, y + 3, tile - 6, tile - 6);
        }
      }
    }

    function drawPropsHallway(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2;
        const y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(x, y + 16, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (i % 2 === 0) {
          // bench
          ctx.fillStyle = '#5a3a1e';
          ctx.fillRect(x - 18, y + 2, 36, 8);
          ctx.fillRect(x - 16, y + 10, 5, 12);
          ctx.fillRect(x + 11, y + 10, 5, 12);
          ctx.fillStyle = '#3d2914';
          ctx.fillRect(x - 18, y - 6, 36, 10);
        } else {
          // framed poster / door
          ctx.fillStyle = '#2a1810';
          ctx.fillRect(x - 12, y - 20, 24, 36);
          ctx.strokeStyle = '#c9a227';
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 12, y - 20, 24, 36);
          ctx.fillStyle = '#8b2942';
          ctx.fillRect(x - 8, y - 14, 16, 20);
        }
      });
    }

    function drawMarkersHallway(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0];
      const end = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#3d2418';
      ctx.fillRect(start.x - 14, start.y - 22, 16, 42);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(start.x - 10, start.y - 4, 8, 5);
      // elevator call plate at end
      ctx.fillStyle = '#2a2e34';
      ctx.fillRect(end.x - 2, end.y - 26, 28, 48);
      ctx.fillStyle = '#8ab4d8';
      ctx.fillRect(end.x + 4, end.y - 10, 12, 4);
      ctx.fillStyle = '#e8c547';
      ctx.beginPath();
      ctx.arc(end.x + 10, end.y + 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    /* —— Level 3: elevator / elevator lobby —— */
    function drawBackdropElevator(ctx) {
      const metal = ctx.createLinearGradient(0, 0, width, height);
      metal.addColorStop(0, '#3a4048');
      metal.addColorStop(0.5, '#2a3038');
      metal.addColorStop(1, '#1e242c');
      ctx.fillStyle = metal;
      ctx.fillRect(0, 0, width, height);

      // brushed metal lines
      for (let y = 0; y < height; y += 6) {
        ctx.fillStyle = y % 12 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, y, width, 3);
      }

      // elevator bank recesses
      const shaftW = 70;
      for (let i = 0; i < 3; i++) {
        const sx = 60 + i * (shaftW + 50);
        ctx.fillStyle = '#12161c';
        ctx.fillRect(sx, height * 0.12, shaftW, height * 0.55);
        ctx.strokeStyle = '#8ab4d8';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, height * 0.12, shaftW, height * 0.55);
        // doors split
        ctx.fillStyle = '#4a5560';
        ctx.fillRect(sx + 4, height * 0.15, shaftW / 2 - 6, height * 0.5);
        ctx.fillRect(sx + shaftW / 2 + 2, height * 0.15, shaftW / 2 - 6, height * 0.5);
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(sx + shaftW / 2 - 1, height * 0.15, 2, height * 0.5);
        // floor indicator
        ctx.fillStyle = '#1a2028';
        ctx.fillRect(sx + 12, height * 0.08, shaftW - 24, 14);
        ctx.fillStyle = '#6ecf6e';
        ctx.font = 'bold 10px Georgia, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), sx + shaftW / 2, height * 0.08 + 11);
      }

      // polished floor
      const floor = ctx.createLinearGradient(0, height * 0.7, 0, height);
      floor.addColorStop(0, '#3a424c');
      floor.addColorStop(1, '#2a323c');
      ctx.fillStyle = floor;
      ctx.fillRect(0, height * 0.68, width, height * 0.32);
      ctx.fillStyle = 'rgba(140,180,220,0.08)';
      ctx.fillRect(0, height * 0.7, width, 8);
    }

    function drawBuildableElevator(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile;
          const y = r * tile;
          ctx.fillStyle = 'rgba(60,70,80,0.3)';
          ctx.fillRect(x + 4, y + 4, tile - 8, tile - 8);
          ctx.strokeStyle = 'rgba(140,180,220,0.15)';
          ctx.strokeRect(x + 10, y + 10, tile - 20, tile - 20);
        }
      }
    }

    function drawPropsElevator(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2;
        const y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 16, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (i % 2 === 0) {
          // elevator wall / panel
          ctx.fillStyle = '#3a4450';
          ctx.fillRect(x - 14, y - 20, 28, 40);
          ctx.strokeStyle = '#8ab4d8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - 14, y - 20, 28, 40);
          ctx.fillStyle = '#1a2028';
          ctx.fillRect(x - 8, y - 8, 16, 10);
          ctx.fillStyle = '#6ecf6e';
          ctx.fillRect(x - 4, y - 5, 8, 3);
        } else {
          // lobby bench / rail
          ctx.fillStyle = '#5a6570';
          ctx.fillRect(x - 16, y + 4, 32, 6);
          ctx.fillRect(x - 14, y + 10, 4, 10);
          ctx.fillRect(x + 10, y + 10, 4, 10);
          ctx.fillStyle = '#8ab4d8';
          ctx.fillRect(x - 16, y - 2, 32, 3);
        }
      });
    }

    function drawMarkersElevator(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0];
      const end = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#2a3038';
      ctx.fillRect(start.x - 12, start.y - 20, 14, 38);
      ctx.fillStyle = '#8ab4d8';
      ctx.fillRect(start.x - 8, start.y - 6, 6, 3);
      // open elevator cab at end
      ctx.fillStyle = '#12161c';
      ctx.fillRect(end.x - 4, end.y - 30, 36, 56);
      ctx.fillStyle = '#4a5560';
      ctx.fillRect(end.x, end.y - 24, 12, 44);
      ctx.fillRect(end.x + 16, end.y - 24, 12, 44);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(end.x + 13, end.y - 24, 3, 44);
      ctx.fillStyle = '#6ecf6e';
      ctx.font = 'bold 9px Georgia, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↑', end.x + 14, end.y - 34);
    }

    /* —— Level 4: audience seating into stage —— */
    function drawBackdropStage(ctx) {
      const base = ctx.createLinearGradient(0, 0, 0, height);
      base.addColorStop(0, '#6b4423');
      base.addColorStop(0.5, '#5a3a1e');
      base.addColorStop(1, '#4a2e16');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const plankH = 18;
      for (let y = 0, i = 0; y < height; y += plankH, i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,210,150,0.06)' : 'rgba(20,10,5,0.12)';
        ctx.fillRect(0, y, width, plankH - 1);
        ctx.strokeStyle = 'rgba(30, 16, 8, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + plankH - 0.5);
        ctx.lineTo(width, y + plankH - 0.5);
        ctx.stroke();
      }

      // seating rows (arcs of seats)
      for (let row = 0; row < 5; row++) {
        const yy = 40 + row * 36;
        for (let s = 0; s < 10; s++) {
          const xx = 30 + s * 72 + (row % 2) * 20;
          if (xx > width - 40) continue;
          ctx.fillStyle = '#5c1a2c';
          ctx.beginPath();
          ctx.roundRect(xx, yy, 22, 18, 3);
          ctx.fill();
          ctx.fillStyle = '#3d1218';
          ctx.fillRect(xx + 2, yy + 10, 18, 6);
        }
      }

      // stage platform right side glow
      const stageGlow = ctx.createRadialGradient(width * 0.85, height * 0.5, 20, width * 0.85, height * 0.5, 180);
      stageGlow.addColorStop(0, 'rgba(201,162,39,0.2)');
      stageGlow.addColorStop(1, 'rgba(201,162,39,0)');
      ctx.fillStyle = stageGlow;
      ctx.fillRect(width * 0.55, 0, width * 0.45, height);

      const vig = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, width * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(20,8,8,0.4)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }

    function drawBuildableStage(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile;
          const y = r * tile;
          ctx.fillStyle = 'rgba(90,55,30,0.2)';
          ctx.fillRect(x + 4, y + 4, tile - 8, tile - 8);
        }
      }
    }

    function drawPropsStage(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2;
        const y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + 18, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        if (i % 2 === 0) {
          // music stand
          ctx.strokeStyle = '#c9a227';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, y + 16);
          ctx.lineTo(x, y - 10);
          ctx.stroke();
          ctx.fillStyle = '#3d2914';
          ctx.beginPath();
          ctx.moveTo(x - 14, y - 6);
          ctx.lineTo(x + 14, y - 14);
          ctx.lineTo(x + 14, y - 4);
          ctx.lineTo(x - 14, y + 4);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#c9a227';
          ctx.stroke();
        } else {
          // seat / pillar
          ctx.fillStyle = '#4a3a2a';
          ctx.fillRect(x - 10, y - 8, 20, 28);
          ctx.fillStyle = '#c9a227';
          ctx.fillRect(x - 12, y - 12, 24, 6);
          ctx.fillRect(x - 12, y + 16, 24, 5);
        }
      });
    }

    function drawMarkersStage(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0];
      const end = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#3d2418';
      ctx.beginPath();
      ctx.roundRect(start.x - 18, start.y - 20, 20, 40, 4);
      ctx.fill();
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(start.x - 14, start.y - 4, 10, 6);

      ctx.fillStyle = '#2a1218';
      ctx.beginPath();
      ctx.roundRect(end.x - 6, end.y - 28, 34, 56, 4);
      ctx.fill();
      const curtain = ctx.createLinearGradient(end.x, end.y - 24, end.x + 24, end.y + 20);
      curtain.addColorStop(0, '#8b2942');
      curtain.addColorStop(0.5, '#c23b5a');
      curtain.addColorStop(1, '#5c1a2c');
      ctx.fillStyle = curtain;
      ctx.fillRect(end.x, end.y - 22, 22, 48);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(end.x - 4, end.y - 26, 30, 6);
    }


    /* —— Level 5: Encore Call — spotlight stage return —— */
    function drawBackdropEncore(ctx) {
      const base = ctx.createLinearGradient(0, 0, 0, height);
      base.addColorStop(0, '#2a1218');
      base.addColorStop(0.4, '#4a1a28');
      base.addColorStop(1, '#1a0c10');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);
      // wood stage floor
      for (let y = height * 0.45; y < height; y += 14) {
        ctx.fillStyle = (Math.floor(y / 14) % 2 === 0) ? 'rgba(255,200,120,0.07)' : 'rgba(20,8,8,0.15)';
        ctx.fillRect(0, y, width, 13);
      }
      // spotlights
      for (let i = 0; i < 4; i++) {
        const sx = width * (0.15 + i * 0.22);
        const spot = ctx.createRadialGradient(sx, height * 0.08, 4, sx, height * 0.55, 120);
        spot.addColorStop(0, 'rgba(255,240,180,0.35)');
        spot.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.moveTo(sx - 8, height * 0.05);
        ctx.lineTo(sx + 8, height * 0.05);
        ctx.lineTo(sx + 70, height);
        ctx.lineTo(sx - 70, height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(sx - 10, height * 0.02, 20, 8);
      }
      // red curtain wings
      const leftC = ctx.createLinearGradient(0, 0, width * 0.18, 0);
      leftC.addColorStop(0, '#8b2942');
      leftC.addColorStop(1, 'rgba(139,41,66,0)');
      ctx.fillStyle = leftC;
      ctx.fillRect(0, 0, width * 0.2, height);
      const rightC = ctx.createLinearGradient(width, 0, width * 0.82, 0);
      rightC.addColorStop(0, '#8b2942');
      rightC.addColorStop(1, 'rgba(139,41,66,0)');
      ctx.fillStyle = rightC;
      ctx.fillRect(width * 0.8, 0, width * 0.2, height);
      // footlights
      for (let x = 40; x < width - 20; x += 48) {
        ctx.fillStyle = '#e8c547';
        ctx.beginPath();
        ctx.arc(x, height * 0.92, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    function drawBuildableEncore(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile, y = r * tile;
          ctx.fillStyle = 'rgba(100,40,50,0.22)';
          ctx.fillRect(x + 4, y + 4, tile - 8, tile - 8);
          ctx.strokeStyle = 'rgba(255,220,140,0.12)';
          ctx.strokeRect(x + 10, y + 10, tile - 20, tile - 20);
        }
      }
    }
    function drawPropsEncore(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2, y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath(); ctx.ellipse(x, y + 18, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
        if (i % 2 === 0) {
          ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x, y - 12); ctx.stroke();
          ctx.fillStyle = '#3d2418';
          ctx.beginPath();
          ctx.moveTo(x - 12, y - 8); ctx.lineTo(x + 12, y - 16); ctx.lineTo(x + 12, y - 6); ctx.lineTo(x - 12, y + 2);
          ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = '#5c1a2c';
          ctx.beginPath(); ctx.roundRect(x - 12, y - 10, 24, 28, 4); ctx.fill();
          ctx.fillStyle = '#c9a227'; ctx.fillRect(x - 14, y - 14, 28, 5);
        }
      });
    }
    function drawMarkersEncore(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0], end = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#3d2418';
      ctx.beginPath(); ctx.roundRect(start.x - 16, start.y - 18, 18, 36, 4); ctx.fill();
      ctx.fillStyle = '#e8c547'; ctx.fillRect(start.x - 12, start.y - 2, 10, 5);
      // encore banner
      ctx.fillStyle = '#2a1218';
      ctx.beginPath(); ctx.roundRect(end.x - 4, end.y - 30, 36, 58, 4); ctx.fill();
      const cur = ctx.createLinearGradient(end.x, end.y - 24, end.x + 26, end.y + 20);
      cur.addColorStop(0, '#a51c30'); cur.addColorStop(1, '#5c1a2c');
      ctx.fillStyle = cur; ctx.fillRect(end.x, end.y - 22, 24, 48);
      ctx.fillStyle = '#e8c547';
      ctx.font = 'bold 9px Georgia, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ENCORE', end.x + 12, end.y - 34);
    }

    /* —— Level 6: Green Room Crush —— */
    function drawBackdropGreenRoom(ctx) {
      const wall = ctx.createLinearGradient(0, 0, 0, height);
      wall.addColorStop(0, '#3a5a48');
      wall.addColorStop(0.45, '#2a4a38');
      wall.addColorStop(1, '#1a3228');
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, width, height);
      // vanity mirror strip
      for (let x = 30; x < width - 20; x += 90) {
        ctx.fillStyle = '#d8e8f0';
        ctx.fillRect(x, height * 0.08, 50, 70);
        ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3;
        ctx.strokeRect(x, height * 0.08, 50, 70);
        for (let b = 0; b < 6; b++) {
          const bx = x + 6 + (b % 3) * 16;
          const by = height * 0.08 + (b < 3 ? -6 : 72);
          ctx.fillStyle = '#fff8d0';
          ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();
        }
      }
      // carpet
      ctx.fillStyle = '#2a4a3a';
      ctx.fillRect(0, height * 0.55, width, height * 0.45);
      for (let y = height * 0.55; y < height; y += 22) {
        ctx.strokeStyle = 'rgba(100,180,120,0.12)';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      // clothing racks silhouette
      ctx.strokeStyle = 'rgba(200,180,140,0.35)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const rx = 80 + i * 220;
        ctx.beginPath(); ctx.moveTo(rx, height * 0.35); ctx.lineTo(rx + 100, height * 0.35); ctx.stroke();
        for (let h = 0; h < 4; h++) {
          ctx.beginPath();
          ctx.moveTo(rx + 15 + h * 22, height * 0.35);
          ctx.lineTo(rx + 15 + h * 22, height * 0.48);
          ctx.stroke();
        }
      }
    }
    function drawBuildableGreenRoom(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile, y = r * tile;
          ctx.fillStyle = 'rgba(50,90,70,0.25)';
          ctx.fillRect(x + 3, y + 3, tile - 6, tile - 6);
        }
      }
    }
    function drawPropsGreenRoom(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2, y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath(); ctx.ellipse(x, y + 16, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
        if (i % 3 === 0) {
          // vanity stool
          ctx.fillStyle = '#5c3d1e';
          ctx.fillRect(x - 10, y + 4, 20, 6);
          ctx.fillRect(x - 8, y + 10, 4, 10);
          ctx.fillRect(x + 4, y + 10, 4, 10);
          ctx.fillStyle = '#3d8a58';
          ctx.beginPath(); ctx.ellipse(x, y, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
        } else if (i % 3 === 1) {
          // costume trunk
          ctx.fillStyle = '#6b4423';
          ctx.fillRect(x - 16, y - 4, 32, 22);
          ctx.fillStyle = '#c9a227';
          ctx.fillRect(x - 4, y + 4, 8, 6);
          ctx.strokeStyle = '#3d2914'; ctx.strokeRect(x - 16, y - 4, 32, 22);
        } else {
          // hanging costume
          ctx.fillStyle = '#a51c30';
          ctx.fillRect(x - 10, y - 16, 20, 30);
          ctx.fillStyle = '#c9a227';
          ctx.fillRect(x - 2, y - 20, 4, 8);
        }
      });
    }
    function drawMarkersGreenRoom(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0], end = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#2a4a38';
      ctx.fillRect(start.x - 14, start.y - 22, 16, 42);
      ctx.fillStyle = '#c9a227'; ctx.fillRect(start.x - 10, start.y - 4, 8, 5);
      // stage door
      ctx.fillStyle = '#1a3228';
      ctx.fillRect(end.x - 2, end.y - 28, 30, 52);
      ctx.fillStyle = '#3d8a58';
      ctx.fillRect(end.x + 4, end.y - 20, 18, 40);
      ctx.fillStyle = '#e8c547';
      ctx.beginPath(); ctx.arc(end.x + 18, end.y, 3, 0, Math.PI * 2); ctx.fill();
    }

    /* —— Level 7: Loading Dock —— */
    function drawBackdropDock(ctx) {
      const concrete = ctx.createLinearGradient(0, 0, 0, height);
      concrete.addColorStop(0, '#5a5a50');
      concrete.addColorStop(0.5, '#4a4a42');
      concrete.addColorStop(1, '#3a3a34');
      ctx.fillStyle = concrete;
      ctx.fillRect(0, 0, width, height);
      // corrugated wall
      for (let x = 0; x < width; x += 10) {
        ctx.fillStyle = x % 20 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, 0, 8, height * 0.35);
      }
      // yellow hazard stripes
      for (let i = 0; i < 12; i++) {
        const y = height * 0.72 + (i % 2) * 8;
        ctx.fillStyle = i % 2 === 0 ? '#e8c547' : '#1a1a16';
        ctx.fillRect(i * 70, height * 0.78, 50, 14);
      }
      // bay doors
      for (let i = 0; i < 3; i++) {
        const bx = 40 + i * 240;
        ctx.fillStyle = '#2a2a28';
        ctx.fillRect(bx, height * 0.1, 100, height * 0.4);
        ctx.strokeStyle = '#e8c547'; ctx.lineWidth = 2;
        ctx.strokeRect(bx, height * 0.1, 100, height * 0.4);
        for (let sl = 0; sl < 6; sl++) {
          ctx.fillStyle = 'rgba(80,80,70,0.5)';
          ctx.fillRect(bx + 6, height * 0.12 + sl * 28, 88, 20);
        }
      }
      // night sky hint top
      ctx.fillStyle = 'rgba(20,24,40,0.35)';
      ctx.fillRect(0, 0, width, height * 0.08);
    }
    function drawBuildableDock(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile, y = r * tile;
          ctx.fillStyle = 'rgba(70,70,60,0.28)';
          ctx.fillRect(x + 4, y + 4, tile - 8, tile - 8);
          ctx.strokeStyle = 'rgba(232,197,71,0.15)';
          ctx.strokeRect(x + 12, y + 12, tile - 24, tile - 24);
        }
      }
    }
    function drawPropsDock(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2, y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(x, y + 16, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
        if (i % 2 === 0) {
          // crate stack
          ctx.fillStyle = '#8b6340';
          ctx.fillRect(x - 14, y - 4, 28, 22);
          ctx.fillStyle = '#6b4423';
          ctx.fillRect(x - 10, y - 16, 20, 14);
          ctx.strokeStyle = '#3d2914';
          ctx.strokeRect(x - 14, y - 4, 28, 22);
          ctx.strokeRect(x - 10, y - 16, 20, 14);
        } else {
          // pallet / cone
          ctx.fillStyle = '#e8c547';
          ctx.beginPath();
          ctx.moveTo(x, y - 16); ctx.lineTo(x + 12, y + 14); ctx.lineTo(x - 12, y + 14);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#1a1a16';
          ctx.fillRect(x - 10, y - 2, 20, 6);
        }
      });
    }
    function drawMarkersDock(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0], end = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#3a3a34';
      ctx.fillRect(start.x - 12, start.y - 20, 14, 38);
      ctx.fillStyle = '#e8c547'; ctx.fillRect(start.x - 8, start.y - 6, 6, 4);
      // truck bay
      ctx.fillStyle = '#2a2a28';
      ctx.fillRect(end.x - 4, end.y - 28, 38, 52);
      ctx.fillStyle = '#4a4a42';
      ctx.fillRect(end.x + 2, end.y - 20, 26, 40);
      ctx.fillStyle = '#e8c547';
      ctx.font = 'bold 9px Georgia, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', end.x + 14, end.y - 32);
    }

    /* —— Level 8: Midnight Tour Bus —— */
    function drawBackdropTourBus(ctx) {
      // night outside
      const night = ctx.createLinearGradient(0, 0, 0, height);
      night.addColorStop(0, '#0c1424');
      night.addColorStop(0.5, '#1a2438');
      night.addColorStop(1, '#121820');
      ctx.fillStyle = night;
      ctx.fillRect(0, 0, width, height);
      // stars
      for (let i = 0; i < 50; i++) {
        const hx = hash(i, seed + 9);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + (hx % 5) * 0.1) + ')';
        ctx.fillRect(hx % width, (hx >> 8) % Math.floor(height * 0.4), 2, 2);
      }
      // bus interior floor
      ctx.fillStyle = '#2a3038';
      ctx.fillRect(0, height * 0.4, width, height * 0.6);
      // aisle lights
      for (let x = 40; x < width; x += 80) {
        const g = ctx.createRadialGradient(x, height * 0.42, 2, x, height * 0.42, 35);
        g.addColorStop(0, 'rgba(200,220,255,0.25)');
        g.addColorStop(1, 'rgba(200,220,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, height * 0.42, 35, 0, Math.PI * 2); ctx.fill();
      }
      // seat rows left/right of aisle feel
      for (let row = 0; row < 6; row++) {
        const yy = height * 0.48 + row * 28;
        for (let side = 0; side < 2; side++) {
          for (let s = 0; s < 3; s++) {
            const xx = (side === 0 ? 20 : width - 100) + s * 28;
            ctx.fillStyle = '#3a4555';
            ctx.beginPath(); ctx.roundRect(xx, yy, 22, 18, 3); ctx.fill();
            ctx.fillStyle = '#5a6a80';
            ctx.fillRect(xx + 2, yy + 2, 18, 6);
          }
        }
      }
      // windows with night blur
      for (let i = 0; i < 5; i++) {
        const wx = 60 + i * 140;
        ctx.fillStyle = 'rgba(40,60,100,0.45)';
        ctx.fillRect(wx, height * 0.12, 80, height * 0.22);
        ctx.strokeStyle = 'rgba(140,180,220,0.35)';
        ctx.strokeRect(wx, height * 0.12, 80, height * 0.22);
      }
    }
    function drawBuildableTourBus(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile, y = r * tile;
          ctx.fillStyle = 'rgba(50,60,75,0.3)';
          ctx.fillRect(x + 4, y + 4, tile - 8, tile - 8);
        }
      }
    }
    function drawPropsTourBus(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2, y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath(); ctx.ellipse(x, y + 16, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
        if (i % 2 === 0) {
          // luggage
          ctx.fillStyle = '#4a3a2a';
          ctx.fillRect(x - 14, y - 6, 28, 20);
          ctx.fillStyle = '#c9a227';
          ctx.fillRect(x - 4, y + 2, 8, 5);
        } else {
          // seat back
          ctx.fillStyle = '#3a4555';
          ctx.fillRect(x - 12, y - 14, 24, 30);
          ctx.fillStyle = '#5a6a80';
          ctx.fillRect(x - 10, y - 10, 20, 10);
        }
      });
    }
    function drawMarkersTourBus(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0], end = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#1a2438';
      ctx.fillRect(start.x - 14, start.y - 22, 16, 42);
      ctx.fillStyle = '#8ab4d8'; ctx.fillRect(start.x - 10, start.y - 4, 8, 4);
      // driver cab / door
      ctx.fillStyle = '#121820';
      ctx.fillRect(end.x - 4, end.y - 28, 34, 54);
      ctx.fillStyle = '#2a3548';
      ctx.fillRect(end.x + 2, end.y - 20, 22, 40);
      ctx.fillStyle = '#e8c547';
      ctx.font = 'bold 8px Georgia, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BUS', end.x + 12, end.y - 32);
    }

    /* —— Level 9: Closing Night — richest packed house —— */
    function drawBackdropClosing(ctx) {
      const base = ctx.createLinearGradient(0, 0, 0, height);
      base.addColorStop(0, '#1a0810');
      base.addColorStop(0.35, '#4a1228');
      base.addColorStop(1, '#2a0c18');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);
      // packed seating arcs
      for (let row = 0; row < 7; row++) {
        const yy = 24 + row * 32;
        for (let s = 0; s < 14; s++) {
          const xx = 16 + s * 54 + (row % 2) * 16;
          if (xx > width - 30) continue;
          ctx.fillStyle = row % 2 === 0 ? '#6b1838' : '#5c1a2c';
          ctx.beginPath(); ctx.roundRect(xx, yy, 20, 16, 3); ctx.fill();
          // tiny audience heads
          if (hash(s, row + seed) % 3 !== 0) {
            ctx.fillStyle = '#e8b898';
            ctx.beginPath(); ctx.arc(xx + 10, yy + 4, 4, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      // grand stage glow
      const glow = ctx.createRadialGradient(width * 0.75, height * 0.55, 30, width * 0.75, height * 0.55, 220);
      glow.addColorStop(0, 'rgba(255,220,120,0.35)');
      glow.addColorStop(0.5, 'rgba(201,162,39,0.12)');
      glow.addColorStop(1, 'rgba(201,162,39,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(width * 0.4, 0, width * 0.6, height);
      // proscenium arch
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(width * 0.55, height * 0.15);
      ctx.quadraticCurveTo(width * 0.78, height * 0.02, width * 0.98, height * 0.15);
      ctx.stroke();
      // chandelier
      ctx.fillStyle = '#e8c547';
      ctx.beginPath(); ctx.arc(width * 0.5, 28, 8, 0, Math.PI * 2); ctx.fill();
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        ctx.fillStyle = 'rgba(255,240,180,0.7)';
        ctx.beginPath();
        ctx.arc(width * 0.5 + Math.cos(ang) * 18, 28 + Math.sin(ang) * 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      const vig = ctx.createRadialGradient(width / 2, height / 2, height * 0.15, width / 2, height / 2, width * 0.8);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(20,4,10,0.5)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }
    function drawBuildableClosing(ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== TILE_GRASS) continue;
          const x = c * tile, y = r * tile;
          ctx.fillStyle = 'rgba(90,30,45,0.22)';
          ctx.fillRect(x + 4, y + 4, tile - 8, tile - 8);
          ctx.strokeStyle = 'rgba(255,220,120,0.1)';
          ctx.strokeRect(x + 10, y + 10, tile - 20, tile - 20);
        }
      }
    }
    function drawPropsClosing(ctx) {
      blocks.forEach(([c, r], i) => {
        const x = c * tile + tile / 2, y = r * tile + tile / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(x, y + 18, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
        if (i % 3 === 0) {
          // ornate music stand
          ctx.strokeStyle = '#e8c547'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x, y - 12); ctx.stroke();
          ctx.fillStyle = '#3d2418';
          ctx.beginPath();
          ctx.moveTo(x - 14, y - 8); ctx.lineTo(x + 14, y - 16); ctx.lineTo(x + 14, y - 4); ctx.lineTo(x - 14, y + 4);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#c9a227'; ctx.stroke();
        } else if (i % 3 === 1) {
          // balcony pillar
          ctx.fillStyle = '#d4c4a8';
          ctx.fillRect(x - 8, y - 22, 16, 42);
          ctx.fillStyle = '#c9a227';
          ctx.fillRect(x - 12, y - 26, 24, 8);
          ctx.fillRect(x - 12, y + 16, 24, 6);
        } else {
          // flower urn
          ctx.fillStyle = '#c9a227';
          ctx.fillRect(x - 10, y + 2, 20, 14);
          ctx.fillStyle = '#a51c30';
          ctx.beginPath(); ctx.ellipse(x, y - 4, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#3d8a3a';
          ctx.beginPath(); ctx.ellipse(x - 4, y - 8, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
        }
      });
    }
    function drawMarkersClosing(ctx) {
      if (!waypoints.length) return;
      const start = waypoints[0], end = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#3d2418';
      ctx.beginPath(); ctx.roundRect(start.x - 18, start.y - 20, 20, 40, 4); ctx.fill();
      ctx.fillStyle = '#e8c547'; ctx.fillRect(start.x - 14, start.y - 4, 12, 6);
      // grand curtain + podium hint
      ctx.fillStyle = '#1a0810';
      ctx.beginPath(); ctx.roundRect(end.x - 6, end.y - 32, 40, 62, 4); ctx.fill();
      const curtain = ctx.createLinearGradient(end.x, end.y - 26, end.x + 28, end.y + 24);
      curtain.addColorStop(0, '#c41e3a');
      curtain.addColorStop(0.5, '#a51c30');
      curtain.addColorStop(1, '#5c1a2c');
      ctx.fillStyle = curtain;
      ctx.fillRect(end.x, end.y - 24, 26, 52);
      ctx.fillStyle = '#e8c547';
      ctx.fillRect(end.x - 4, end.y - 30, 34, 7);
      ctx.font = 'bold 8px Georgia, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FINALE', end.x + 12, end.y - 36);
    }


    const drawers = [
      { bg: drawBackdropApproach, build: drawBuildableApproach, props: drawPropsApproach, markers: drawMarkersApproach },
      { bg: drawBackdropEntrance, build: drawBuildableEntrance, props: drawPropsEntrance, markers: drawMarkersEntrance },
      { bg: drawBackdropHallway, build: drawBuildableHallway, props: drawPropsHallway, markers: drawMarkersHallway },
      { bg: drawBackdropElevator, build: drawBuildableElevator, props: drawPropsElevator, markers: drawMarkersElevator },
      { bg: drawBackdropStage, build: drawBuildableStage, props: drawPropsStage, markers: drawMarkersStage },
      { bg: drawBackdropEncore, build: drawBuildableEncore, props: drawPropsEncore, markers: drawMarkersEncore },
      { bg: drawBackdropGreenRoom, build: drawBuildableGreenRoom, props: drawPropsGreenRoom, markers: drawMarkersGreenRoom },
      { bg: drawBackdropDock, build: drawBuildableDock, props: drawPropsDock, markers: drawMarkersDock },
      { bg: drawBackdropTourBus, build: drawBuildableTourBus, props: drawPropsTourBus, markers: drawMarkersTourBus },
      { bg: drawBackdropClosing, build: drawBuildableClosing, props: drawPropsClosing, markers: drawMarkersClosing },
    ];
    const d = drawers[Math.min(seed, drawers.length - 1)];

    function drawPlacementHint(ctx, c, r, valid) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return;
      const x = c * tile;
      const y = r * tile;
      ctx.strokeStyle = valid ? theme.hintOk : theme.hintBad;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.roundRect(x + 6, y + 6, tile - 12, tile - 12, 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    return {
      COLS: cols,
      ROWS: rows,
      TILE: tile,
      TILE_GRASS,
      TILE_PATH,
      TILE_BLOCK,
      grid,
      waypoints,
      PATH_CELLS: pathCells,
      blocks,
      width,
      height,
      levelId: level && level.id,
      themeId: theme.id,
      themeIndex: seed,
      draw(ctx) {
        d.bg(ctx);
        d.build(ctx);
        drawThemedPath(ctx);
        d.props(ctx);
        d.markers(ctx);
      },
      drawPlacementHint,
      canBuild(c, r) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
        return grid[r][c] === TILE_GRASS;
      },
    };
  }

  global.PNMap = { createMap, TILE_GRASS, TILE_PATH, TILE_BLOCK, THEMES };
})(typeof window !== 'undefined' ? window : globalThis);
