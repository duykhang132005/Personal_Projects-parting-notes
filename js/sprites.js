/* Parting Notes — smooth 64-bit style sprites (canvas vector) */
(function (global) {
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function ellipse(ctx, cx, cy, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }

  function faceBase(ctx, cx, cy, skin, skinShadow) {
    // head
    const grd = ctx.createRadialGradient(cx - 4, cy - 8, 4, cx, cy, 18);
    grd.addColorStop(0, skin);
    grd.addColorStop(1, skinShadow);
    ctx.fillStyle = grd;
    ellipse(ctx, cx, cy, 16, 18);
    ctx.fill();
    // ears
    ctx.fillStyle = skinShadow;
    ellipse(ctx, cx - 16, cy + 1, 4, 5);
    ctx.fill();
    ellipse(ctx, cx + 16, cy + 1, 4, 5);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#fff';
    ellipse(ctx, cx - 6, cy - 2, 4, 4.5);
    ctx.fill();
    ellipse(ctx, cx + 6, cy - 2, 4, 4.5);
    ctx.fill();
    ctx.fillStyle = '#1a1f16';
    ellipse(ctx, cx - 5, cy - 1.5, 2, 2.5);
    ctx.fill();
    ellipse(ctx, cx + 7, cy - 1.5, 2, 2.5);
    ctx.fill();
    // highlight
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ellipse(ctx, cx - 6, cy - 3, 1.2, 1.2);
    ctx.fill();
    ellipse(ctx, cx + 6, cy - 3, 1.2, 1.2);
    ctx.fill();
  }

  const CRIMSON = '#a51c30';
  const CRIMSON_DARK = '#7a1424';
  const BLACK = '#1a1a1e';
  const BLACK_DARK = '#0c0c0e';
  const WHITE = '#f5f3ef';

  function bodyCoat(ctx, cx, cy, color, colorDark) {
    const grd = ctx.createLinearGradient(cx - 18, cy + 10, cx + 18, cy + 42);
    grd.addColorStop(0, color);
    grd.addColorStop(1, colorDark);
    ctx.fillStyle = grd;
    roundRect(ctx, cx - 18, cy + 12, 36, 30, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 12);
    ctx.lineTo(cx - 12, cy + 28);
    ctx.lineTo(cx - 4, cy + 24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy + 12);
    ctx.lineTo(cx + 12, cy + 28);
    ctx.lineTo(cx + 4, cy + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colorDark;
    roundRect(ctx, cx - 12, cy + 40, 8, 10, 2);
    ctx.fill();
    roundRect(ctx, cx + 4, cy + 40, 8, 10, 2);
    ctx.fill();
  }

  function bodyDress(ctx, cx, cy) {
    const grd = ctx.createLinearGradient(cx - 20, cy + 8, cx + 20, cy + 48);
    grd.addColorStop(0, BLACK);
    grd.addColorStop(1, BLACK_DARK);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 10);
    ctx.lineTo(cx + 10, cy + 10);
    ctx.lineTo(cx + 22, cy + 48);
    ctx.lineTo(cx - 22, cy + 48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = BLACK;
    roundRect(ctx, cx - 22, cy + 12, 10, 18, 4);
    ctx.fill();
    roundRect(ctx, cx + 12, cy + 12, 10, 18, 4);
    ctx.fill();
    ctx.fillStyle = CRIMSON;
    roundRect(ctx, cx - 14, cy + 26, 28, 5, 2);
    ctx.fill();
    ctx.fillStyle = CRIMSON_DARK;
    roundRect(ctx, cx - 14, cy + 29, 28, 2, 1);
    ctx.fill();
    ctx.strokeStyle = CRIMSON;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 12);
    ctx.quadraticCurveTo(cx, cy + 18, cx + 8, cy + 12);
    ctx.stroke();
  }

  function bodyTux(ctx, cx, cy) {
    const grd = ctx.createLinearGradient(cx - 18, cy + 10, cx + 18, cy + 42);
    grd.addColorStop(0, BLACK);
    grd.addColorStop(1, BLACK_DARK);
    ctx.fillStyle = grd;
    roundRect(ctx, cx - 18, cy + 12, 36, 30, 6);
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 12);
    ctx.lineTo(cx - 10, cy + 30);
    ctx.lineTo(cx + 10, cy + 30);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 14);
    ctx.lineTo(cx, cy + 17);
    ctx.lineTo(cx - 12, cy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy + 14);
    ctx.lineTo(cx, cy + 17);
    ctx.lineTo(cx + 12, cy + 20);
    ctx.closePath();
    ctx.fill();
    ellipse(ctx, cx, cy + 17, 3, 2.5);
    ctx.fill();
    ctx.fillStyle = CRIMSON;
    roundRect(ctx, cx + 6, cy + 22, 7, 5, 1);
    ctx.fill();
    ctx.fillStyle = BLACK_DARK;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 36);
    ctx.lineTo(cx - 28, cy + 50);
    ctx.lineTo(cx - 10, cy + 42);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 18, cy + 36);
    ctx.lineTo(cx + 28, cy + 50);
    ctx.lineTo(cx + 10, cy + 42);
    ctx.closePath();
    ctx.fill();
    roundRect(ctx, cx - 12, cy + 40, 8, 10, 2);
    ctx.fill();
    roundRect(ctx, cx + 4, cy + 40, 8, 10, 2);
    ctx.fill();
  }

  function hairDome(ctx, cx, cy, color, colorDark, style) {
    ctx.fillStyle = color;
    if (style === 'short') {
      ellipse(ctx, cx, cy - 14, 15, 10);
      ctx.fill();
      ctx.fillStyle = colorDark;
      ellipse(ctx, cx - 8, cy - 12, 6, 5);
      ctx.fill();
    } else if (style === 'gray') {
      // fuller older cut
      ellipse(ctx, cx, cy - 12, 17, 12);
      ctx.fill();
      ctx.fillStyle = colorDark;
      ellipse(ctx, cx - 10, cy - 8, 5, 8);
      ctx.fill();
      ellipse(ctx, cx + 10, cy - 8, 5, 8);
      ctx.fill();
      // soft waves
      ctx.fillStyle = color;
      ellipse(ctx, cx - 6, cy - 18, 7, 5);
      ctx.fill();
      ellipse(ctx, cx + 5, cy - 18, 7, 5);
      ctx.fill();
    } else {
      // soprano voluminous
      ellipse(ctx, cx, cy - 14, 18, 12);
      ctx.fill();
      ctx.fillStyle = colorDark;
      ellipse(ctx, cx - 11, cy - 10, 7, 8);
      ctx.fill();
      ellipse(ctx, cx + 11, cy - 10, 7, 8);
      ctx.fill();
      ctx.fillStyle = color;
      ellipse(ctx, cx, cy - 20, 10, 6);
      ctx.fill();
    }
  }

  function drawSoprano(ctx, cx, cy) {
    bodyDress(ctx, cx, cy);
    faceBase(ctx, cx, cy - 6, '#f2cbb0', '#e0a888');
    hairDome(ctx, cx, cy - 6, '#3d2914', '#2a1a0c', 'volume');
    ctx.fillStyle = CRIMSON;
    ellipse(ctx, cx, cy + 6, 5, 2.2);
    ctx.fill();
    ctx.fillStyle = '#d6456a';
    ellipse(ctx, cx, cy + 5.2, 3.5, 1.1);
    ctx.fill();
  }

  function drawAlto(ctx, cx, cy) {
    bodyDress(ctx, cx, cy);
    faceBase(ctx, cx, cy - 6, '#e8b898', '#d4a07e');
    hairDome(ctx, cx, cy - 6, '#d8d4cc', '#9a968e', 'gray');
    ctx.strokeStyle = '#b08070';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 4, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  function drawTenor(ctx, cx, cy) {
    bodyTux(ctx, cx, cy);
    faceBase(ctx, cx, cy - 6, '#e8b898', '#d4a07e');
    hairDome(ctx, cx, cy - 6, '#5c3d1e', '#3d2914', 'short');
    ctx.strokeStyle = 'rgba(180,120,90,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 12, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.strokeStyle = '#b08070';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 5, 3.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  function drawBass(ctx, cx, cy) {
    bodyTux(ctx, cx, cy);
    faceBase(ctx, cx, cy - 6, '#d4a882', '#c09068');
    hairDome(ctx, cx, cy - 6, '#2a1a0c', '#1a1008', 'short');
    const beard = ctx.createRadialGradient(cx, cy + 4, 2, cx, cy + 8, 16);
    beard.addColorStop(0, '#5c3d1e');
    beard.addColorStop(1, '#2a1a0c');
    ctx.fillStyle = beard;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 2);
    ctx.quadraticCurveTo(cx - 16, cy + 18, cx, cy + 22);
    ctx.quadraticCurveTo(cx + 16, cy + 18, cx + 14, cy + 2);
    ctx.quadraticCurveTo(cx, cy + 10, cx - 14, cy + 2);
    ctx.fill();
    ctx.fillStyle = '#3d2914';
    ellipse(ctx, cx - 4, cy + 5, 5, 2.5);
    ctx.fill();
    ellipse(ctx, cx + 4, cy + 5, 5, 2.5);
    ctx.fill();
  }

  const PART_DRAW = {
    soprano: drawSoprano,
    alto: drawAlto,
    tenor: drawTenor,
    bass: drawBass,
  };

  function drawPart(ctx, typeId, cx, cy, selected, scaleOpt) {
    const scale = scaleOpt || 1;
    // Choir Andy shop/dict portrait — smaller than boss sprite.
    if (typeId === 'andy') {
      if (typeof drawAndyClark === 'function') {
        drawAndyClark(ctx, cx, cy - 2, { scale: 0.72 * scale, flash: false });
      }
      if (selected) {
        ctx.save();
        ctx.strokeStyle = 'rgba(243,239,228,0.85)';
        ctx.lineWidth = 2;
        roundRect(ctx, cx - 22, cy - 36, 44, 72, 10);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    const fn = PART_DRAW[typeId];
    if (!fn) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    fn(ctx, 0, -8);
    if (selected) {
      ctx.strokeStyle = 'rgba(243,239,228,0.85)';
      ctx.lineWidth = 2 / scale;
      roundRect(ctx, -22, -36, 44, 72, 10);
      ctx.stroke();
    }
    ctx.restore();
  }


  const PART_COLORS = {
    soprano: { main: '#1a1a1e', dark: '#0c0c0e', mark: '#a51c30' },
    alto: { main: '#222226', dark: '#101014', mark: '#c41e3a' },
    tenor: { main: '#1a1a1e', dark: '#0c0c0e', mark: '#f5f3ef' },
    bass: { main: '#141418', dark: '#08080a', mark: '#a51c30' },
    andy: { main: '#1a1a1e', dark: '#0a0a0c', mark: '#e8c547' },
  };

  /** Compact abstract token for the playfield (shop keeps full portraits). */
  function drawPartField(ctx, typeId, cx, cy, selected) {
    const cols = PART_COLORS[typeId] || PART_COLORS.soprano;
    const letter = (typeId || '?')[0].toUpperCase();

    ctx.save();
    ctx.translate(cx, cy);

    // soft shadow
    ctx.fillStyle = 'rgba(26,31,22,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // body gem / robe diamond
    const g = ctx.createLinearGradient(-10, -8, 10, 16);
    g.addColorStop(0, cols.main);
    g.addColorStop(1, cols.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(26,31,22,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // head disc
    ctx.fillStyle = '#f0c8a8';
    ctx.beginPath();
    ctx.arc(0, -10, 7, 0, Math.PI * 2);
    ctx.fill();

    // part accent
    if (typeId === 'soprano') {
      ctx.fillStyle = cols.mark;
      ctx.beginPath();
      ctx.ellipse(0, -7, 3, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d2914';
      ctx.beginPath();
      ctx.arc(0, -14, 6, Math.PI, 0);
      ctx.fill();
    } else if (typeId === 'alto') {
      ctx.fillStyle = cols.mark;
      ctx.beginPath();
      ctx.arc(0, -14, 6.5, Math.PI, 0);
      ctx.fill();
    } else if (typeId === 'bass') {
      ctx.fillStyle = cols.mark;
      ctx.beginPath();
      ctx.ellipse(0, -6, 5, 3.5, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#2a1a0c';
      ctx.beginPath();
      ctx.arc(0, -14, 5.5, Math.PI, 0);
      ctx.fill();
    } else if (typeId === 'andy') {
      // dark coat — short hair + gold baton tip accent
      ctx.fillStyle = '#2a1a0c';
      ctx.beginPath();
      ctx.arc(0, -14, 5.5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = cols.mark;
      ctx.beginPath();
      ctx.arc(8, -10, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // tenor — clean short hair
      ctx.fillStyle = '#5c3d1e';
      ctx.beginPath();
      ctx.arc(0, -14, 5.5, Math.PI, 0);
      ctx.fill();
    }

    // crimson sash slash across robe (Andy: dark coat, gold slash)
    ctx.strokeStyle = typeId === 'andy' ? '#c9a227' : '#a51c30';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(8, -2);
    ctx.stroke();
    if (typeId === 'tenor' || typeId === 'bass') {
      ctx.fillStyle = '#f5f3ef';
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
    } else if (typeId === 'andy') {
      // white shirt triangle on dark coat
      ctx.fillStyle = '#f5f3ef';
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(-3.5, 5);
      ctx.lineTo(3.5, 5);
      ctx.closePath();
      ctx.fill();
    }

    // letter badge (crimson)
    ctx.fillStyle = '#a51c30';
    ctx.beginPath();
    ctx.arc(0, 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5f3ef';
    ctx.font = 'bold 10px Georgia, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 0, 4.5);

    if (selected) {
      ctx.strokeStyle = 'rgba(243,239,228,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawPartFieldGhost(ctx, typeId, cx, cy, valid) {
    ctx.globalAlpha = 0.4;
    drawPartField(ctx, typeId, cx, cy, false);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = valid ? 'rgba(243,239,228,0.7)' : 'rgba(139,41,66,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawNoteShape(ctx, typeId, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    if (typeId === 'whole') {
      const g = ctx.createRadialGradient(-4, -2, 2, 0, 0, 16);
      g.addColorStop(0, '#c44d6a');
      g.addColorStop(1, '#8b2942');
      ctx.fillStyle = g;
      ellipse(ctx, 0, 0, 16, 12);
      ctx.fill();
      ctx.fillStyle = '#f3efe4';
      ellipse(ctx, 0, 0, 9, 6);
      ctx.fill();
      ctx.strokeStyle = '#5c1a2c';
      ctx.lineWidth = 2;
      ellipse(ctx, 0, 0, 16, 12);
      ctx.stroke();
    } else if (typeId === 'half') {
      ctx.strokeStyle = '#1e3f62';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, 4);
      ctx.lineTo(10, -22);
      ctx.stroke();
      const g = ctx.createRadialGradient(-2, 2, 1, 0, 2, 12);
      g.addColorStop(0, '#5a8ec4');
      g.addColorStop(1, '#2f5d8c');
      ctx.fillStyle = g;
      ellipse(ctx, 0, 4, 12, 9);
      ctx.fill();
      ctx.fillStyle = '#f3efe4';
      ellipse(ctx, 0, 4, 7, 5);
      ctx.fill();
    } else if (typeId === 'eighth') {
      ctx.fillStyle = '#e8c547';
      ctx.beginPath();
      ctx.moveTo(8, -22);
      ctx.quadraticCurveTo(22, -18, 20, -6);
      ctx.lineTo(14, -8);
      ctx.quadraticCurveTo(16, -14, 8, -16);
      ctx.fill();
      ctx.strokeStyle = '#1a1f16';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, 4);
      ctx.lineTo(8, -22);
      ctx.stroke();
      const g = ctx.createRadialGradient(-2, 4, 1, 0, 4, 11);
      g.addColorStop(0, '#f0d56a');
      g.addColorStop(1, '#c9a227');
      ctx.fillStyle = g;
      ellipse(ctx, 0, 6, 11, 8);
      ctx.fill();
    } else {
      // quarter
      ctx.strokeStyle = '#1a1f16';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, 4);
      ctx.lineTo(8, -22);
      ctx.stroke();
      const g = ctx.createRadialGradient(-2, 4, 1, 0, 4, 11);
      g.addColorStop(0, '#3d3428');
      g.addColorStop(1, '#1a1f16');
      ctx.fillStyle = g;
      ellipse(ctx, 0, 6, 11, 8);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawJazzSparkles(ctx, cx, cy, t) {
    const time = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
    for (let i = 0; i < 6; i++) {
      const a = time * 2.2 + i * 1.05;
      const r = 14 + (i % 3) * 4;
      const sx = cx + Math.cos(a) * r;
      const sy = cy - 4 + Math.sin(a * 1.3) * (r * 0.55);
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(time * 5 + i));
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = i % 2 === 0 ? '#fff8d0' : '#e8c547';
      ctx.beginPath();
      // tiny 4-point star
      const s = 2.2 + (i % 2);
      ctx.moveTo(sx, sy - s);
      ctx.lineTo(sx + s * 0.35, sy - s * 0.35);
      ctx.lineTo(sx + s, sy);
      ctx.lineTo(sx + s * 0.35, sy + s * 0.35);
      ctx.lineTo(sx, sy + s);
      ctx.lineTo(sx - s * 0.35, sy + s * 0.35);
      ctx.lineTo(sx - s, sy);
      ctx.lineTo(sx - s * 0.35, sy - s * 0.35);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // soft shimmer wash
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
    g.addColorStop(0, 'rgba(255,240,180,0.28)');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFolkTint(ctx, typeId, cx, cy) {
    // redraw shape in warm browns over a subtle wood wash
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#8b6340';
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function recolorFolkNote(ctx, typeId, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    if (typeId === 'whole') {
      const g = ctx.createRadialGradient(-4, -2, 2, 0, 0, 16);
      g.addColorStop(0, '#a67c52');
      g.addColorStop(1, '#5c3d1e');
      ctx.fillStyle = g;
      ellipse(ctx, 0, 0, 16, 12);
      ctx.fill();
      ctx.fillStyle = '#e8d4b8';
      ellipse(ctx, 0, 0, 9, 6);
      ctx.fill();
      ctx.strokeStyle = '#3d2914';
      ctx.lineWidth = 2;
      ellipse(ctx, 0, 0, 16, 12);
      ctx.stroke();
    } else if (typeId === 'half') {
      ctx.strokeStyle = '#3d2914';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, 4);
      ctx.lineTo(10, -22);
      ctx.stroke();
      const g = ctx.createRadialGradient(-2, 2, 1, 0, 2, 12);
      g.addColorStop(0, '#c4a06a');
      g.addColorStop(1, '#6b4423');
      ctx.fillStyle = g;
      ellipse(ctx, 0, 4, 12, 9);
      ctx.fill();
      ctx.fillStyle = '#f0e0c8';
      ellipse(ctx, 0, 4, 7, 5);
      ctx.fill();
    } else if (typeId === 'eighth') {
      ctx.fillStyle = '#a67c52';
      ctx.beginPath();
      ctx.moveTo(8, -22);
      ctx.quadraticCurveTo(22, -18, 20, -6);
      ctx.lineTo(14, -8);
      ctx.quadraticCurveTo(16, -14, 8, -16);
      ctx.fill();
      ctx.strokeStyle = '#3d2914';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, 4);
      ctx.lineTo(8, -22);
      ctx.stroke();
      const g = ctx.createRadialGradient(-2, 4, 1, 0, 4, 11);
      g.addColorStop(0, '#c9a066');
      g.addColorStop(1, '#6b4423');
      ctx.fillStyle = g;
      ellipse(ctx, 0, 6, 11, 8);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#3d2914';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, 4);
      ctx.lineTo(8, -22);
      ctx.stroke();
      const g = ctx.createRadialGradient(-2, 4, 1, 0, 4, 11);
      g.addColorStop(0, '#8b6340');
      g.addColorStop(1, '#3d2914');
      ctx.fillStyle = g;
      ellipse(ctx, 0, 6, 11, 8);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Conductor boss — black tails, white shirt/bow, baton raised. Larger than notes. */
  function drawAndyClark(ctx, cx, cy, opts) {
    const scale = (opts && opts.scale) || 1.35;
    const flash = opts && opts.flash;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 28, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs / tails
    ctx.fillStyle = '#0c0c0e';
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(-18, 30);
    ctx.lineTo(-6, 30);
    ctx.lineTo(-2, 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(18, 30);
    ctx.lineTo(6, 30);
    ctx.lineTo(2, 12);
    ctx.closePath();
    ctx.fill();

    // coat body
    const coat = ctx.createLinearGradient(-16, -4, 16, 24);
    coat.addColorStop(0, '#222226');
    coat.addColorStop(1, '#0c0c0e');
    ctx.fillStyle = coat;
    roundRect(ctx, -14, -2, 28, 22, 4);
    ctx.fill();

    // white shirt / bow
    ctx.fillStyle = '#f5f3ef';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-7, 12);
    ctx.lineTo(7, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1a1e';
    // bow tie
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(-2, 4);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(2, 4);
    ctx.lineTo(8, 6);
    ctx.closePath();
    ctx.fill();
    ellipse(ctx, 0, 4, 2.2, 2);
    ctx.fill();

    // head
    faceBase(ctx, 0, -14, '#e8b898', '#d4a07e');
    hairDome(ctx, 0, -14, '#2a1a0c', '#1a1008', 'short');

    // raised baton arm
    ctx.strokeStyle = '#e8b898';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(12, 4);
    ctx.lineTo(20, -18);
    ctx.stroke();
    // baton
    ctx.strokeStyle = flash ? '#fff8d0' : '#f5f3ef';
    ctx.lineWidth = flash ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(18, -16);
    ctx.lineTo(26, -32);
    ctx.stroke();
    ctx.fillStyle = flash ? '#e8c547' : '#c9a227';
    ellipse(ctx, 26, -32, 3, 3);
    ctx.fill();
    if (flash) {
      const glow = ctx.createRadialGradient(26, -32, 1, 26, -32, 18);
      glow.addColorStop(0, 'rgba(255,240,180,0.7)');
      glow.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(26, -32, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // other arm
    ctx.strokeStyle = '#e8b898';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-12, 4);
    ctx.lineTo(-16, 14);
    ctx.stroke();

    ctx.restore();
  }

  // Shop/portrait entry for Choir Andy (drawPart special-cases, but keep table complete).
  PART_DRAW.andy = function (ctx, cx, cy) {
    drawAndyClark(ctx, cx, cy + 8, { scale: 0.72, flash: false });
  };

  function drawNote(ctx, typeId, cx, cy, style) {
    const st = style || 'normal';
    if (typeId === 'andy') {
      drawAndyClark(ctx, cx, cy, { flash: false });
      return;
    }
    if (st === 'folk') {
      recolorFolkNote(ctx, typeId || 'quarter', cx, cy);
    } else {
      drawNoteShape(ctx, typeId || 'quarter', cx, cy);
    }
    if (st === 'jazz') {
      drawJazzSparkles(ctx, cx, cy);
    }
  }

  global.PNSprites = {
    drawPart,
    drawPartField,
    drawPartFieldGhost,
    drawNote,
    drawAndyClark,
    PART_DRAW,
  };
})(typeof window !== 'undefined' ? window : globalThis);
