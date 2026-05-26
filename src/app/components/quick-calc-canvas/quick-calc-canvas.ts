import {
  Component, Input, OnChanges, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ── Rotation state — updated by component before each draw ────────
let _az = 225 * Math.PI / 180; // azimuth  (225° matches classic isometric look)
let _el = 30  * Math.PI / 180; // elevation

type Pt = { x: number; y: number };

function iso(xi: number, yi: number, zi: number): Pt {
  return {
    x:  -xi * Math.sin(_az) + yi * Math.cos(_az),
    y:  -xi * Math.cos(_az) * Math.sin(_el) - yi * Math.sin(_az) * Math.sin(_el) - zi * Math.cos(_el)
  };
}
function at(o: Pt, xi: number, yi: number, zi: number): Pt {
  const p = iso(xi, yi, zi);
  return { x: o.x + p.x, y: o.y + p.y };
}

// ── Scale + centered origin — derived from actual projected bounding box ──
function isoFit(cw: number, ch: number, W: number, D: number, H: number, pad = 32) {
  const pts = [
    iso(0,0,0), iso(W,0,0), iso(0,D,0), iso(W,D,0),
    iso(0,0,H), iso(W,0,H), iso(0,D,H), iso(W,D,H)
  ];
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min(
    (cw - pad * 2) / Math.max(x1 - x0, 0.001),
    (ch - pad * 2 - 16) / Math.max(y1 - y0, 0.001),
    50
  );
  const ox = cw / 2 - (x0 + x1) / 2 * s;
  const oy = ch / 2 - (y0 + y1) / 2 * s + 6;
  return { s, ox, oy };
}

// ── Deterministic jitter (no flickering) ─────────────────────────
function jitter(i: number, range: number): number {
  return ((i * 1664525 + 1013904223) % (range * 2 + 1)) - range;
}

// ── Texture: concrete aggregate dots ─────────────────────────────
function texConcrete(ctx: CanvasRenderingContext2D, pts: Pt[], gap = 9) {
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath(); ctx.clip();
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  let idx = 0;
  for (let gx = x0; gx < x1; gx += gap) {
    for (let gy = y0; gy < y1; gy += gap) {
      const jx = jitter(idx * 3, 3), jy = jitter(idx * 7, 3);
      const r = 0.6 + (idx % 3) * 0.5;
      const lum = 110 + (idx % 6) * 8;
      ctx.beginPath();
      ctx.arc(gx + jx, gy + jy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
      ctx.fill();
      idx++;
    }
  }
  ctx.restore();
}

// ── Texture: earth / soil ─────────────────────────────────────────
function texEarth(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath(); ctx.clip();
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  // Strata bands
  const bands = 5;
  const colors = ['#C8A050','#B89040','#D4B060','#A87830','#C0A048'];
  const bh = (y1 - y0) / bands;
  for (let b = 0; b < bands; b++) {
    ctx.fillStyle = colors[b % colors.length] + '55';
    ctx.fillRect(x0, y0 + b * bh, x1 - x0, bh);
  }
  // Pebbles
  let idx = 0;
  for (let gx = x0 + 4; gx < x1; gx += 11) {
    for (let gy = y0 + 4; gy < y1; gy += 10) {
      const jx = jitter(idx * 5, 4), jy = jitter(idx * 9, 4);
      const r = 1 + (idx % 3) * 0.6;
      ctx.beginPath();
      ctx.ellipse(gx + jx, gy + jy, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = idx % 4 === 0 ? '#888' : '#9A7A40';
      ctx.fill();
      idx++;
    }
  }
  ctx.restore();
}

// ── Texture: roof tiles ───────────────────────────────────────────
function texRoofTiles(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath(); ctx.clip();
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const tw = Math.max((x1 - x0) / 8, 8), th = Math.max((y1 - y0) / 6, 6);
  for (let row = 0; row * th < y1 - y0; row++) {
    const off = (row % 2) * (tw / 2);
    for (let col = -1; col * tw < x1 - x0; col++) {
      const tx = x0 + col * tw + off, ty = y0 + row * th;
      ctx.fillStyle = row % 2 === 0 ? '#7A2E0E' : '#8B3412';
      ctx.fillRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
      ctx.strokeStyle = '#5A200A';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
    }
  }
  ctx.restore();
}

// ── Primitives ───────────────────────────────────────────────────
function poly(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string, stroke = '#0003') {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 0.8; ctx.stroke();
}

function lbl(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 9) {
  ctx.save();
  ctx.font = `bold ${size}px 'Segoe UI',sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 8;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(x - w / 2, y - size / 2 - 2, w, size + 4);
  ctx.fillStyle = '#444'; ctx.fillText(text, x, y);
  ctx.restore();
}

function dimLine(ctx: CanvasRenderingContext2D, p1: Pt, p2: Pt, text: string) {
  ctx.save();
  ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 0.7;
  ctx.setLineDash([3, 2]);
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  lbl(ctx, text, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

function titleLbl(ctx: CanvasRenderingContext2D, cw: number, text: string) {
  ctx.save();
  ctx.font = 'bold 9px "Segoe UI",sans-serif';
  ctx.fillStyle = '#8B4513'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(text, cw / 2, ctx.canvas.height - 4);
  ctx.restore();
}

function fd(v: number | undefined): string {
  if (!v || v === 0) return '?';
  return v < 1 ? `${(v * 100).toFixed(0)} cm` : `${v.toFixed(2)} m`;
}

function bg(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = '#FAFAF8'; ctx.fillRect(0, 0, cw, ch);
}

// ── Isometric box with texture support ───────────────────────────
type BoxColors = { top: string; right: string; left: string };
const CONCRETE: BoxColors = { top: '#C8C8C8', right: '#A8A8A8', left: '#888888' };
const FOOTING:  BoxColors = { top: '#C8B880', right: '#A89860', left: '#887840' };
const SOIL:     BoxColors = { top: '#9B7B2A', right: '#7A5C18', left: '#5C4010' };
const ZINC:     BoxColors = { top: '#8B4513', right: '#6B3210', left: '#4E2308' };

function box3D(
  ctx: CanvasRenderingContext2D, o: Pt,
  W: number, D: number, H: number,
  c: BoxColors, texFn?: (ctx: CanvasRenderingContext2D, pts: Pt[]) => void,
  lW = '', lD = '', lH = ''
) {
  const p000=at(o,0,0,0), p100=at(o,W,0,0), p010=at(o,0,D,0), p110=at(o,W,D,0);
  const p001=at(o,0,0,H), p101=at(o,W,0,H), p011=at(o,0,D,H), p111=at(o,W,D,H);

  const faceLeft  = [p000, p100, p101, p001];
  const faceRight = [p100, p110, p111, p101];
  const faceTop   = [p001, p101, p111, p011];

  poly(ctx, faceLeft,  c.left);
  if (texFn) texFn(ctx, faceLeft);
  poly(ctx, faceRight, c.right);
  if (texFn) texFn(ctx, faceRight);
  poly(ctx, faceTop,   c.top);
  if (texFn) texFn(ctx, faceTop);

  // Re-draw edges on top of texture
  ctx.save(); ctx.strokeStyle = '#0003'; ctx.lineWidth = 0.8;
  [[p000,p100],[p100,p110],[p100,p101],[p001,p101],[p101,p111],[p001,p011],[p011,p111]]
    .forEach(([a,b]) => { ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); });
  ctx.restore();

  if (lW) dimLine(ctx, p000, p100, lW);
  if (lD) dimLine(ctx, p100, p110, lD);
  if (lH) lbl(ctx, lH, (p000.x + p001.x) / 2 - 14, (p000.y + p001.y) / 2);

  return { p000, p100, p010, p110, p001, p101, p011, p111 };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Draw functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawColumna(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.ancho||0.3), D = +(t.fondo||0.3), H = +(t.altura||3);
  bg(ctx, cw, ch);
  const { s, ox, oy } = isoFit(cw, ch, W, D, H);
  const o = { x: ox, y: oy };
  const pts = box3D(ctx, o, W*s, D*s, H*s, CONCRETE, texConcrete, fd(W), fd(D), fd(H));

  // Varillas de acero longitudinal en las cuatro esquinas
  ctx.save(); ctx.strokeStyle = '#444'; ctx.lineWidth = 1.8;
  const rbOffset = 0.1;
  [ [rbOffset, rbOffset], [1-rbOffset, rbOffset], [rbOffset, 1-rbOffset], [1-rbOffset, 1-rbOffset] ]
    .forEach(([fx, fy]) => {
      const bot = at(o, W*s*fx, D*s*fy, 0);
      const dz  = iso(0, 0, H*s);
      ctx.beginPath();
      ctx.moveTo(bot.x, bot.y);
      ctx.lineTo(bot.x + dz.x, bot.y + dz.y);
      ctx.stroke();
      // Dot at bottom
      ctx.beginPath(); ctx.arc(bot.x, bot.y, 2.5, 0, Math.PI*2);
      ctx.fillStyle = '#444'; ctx.fill();
    });

  // Estribos (anillos horizontales)
  const stirrups = 4;
  for (let k = 1; k <= stirrups; k++) {
    const hz = H*s * k / (stirrups + 1);
    const rb = 0.08;
    const corners = [
      at(o, W*s*rb, D*s*rb, hz), at(o, W*s*(1-rb), D*s*rb, hz),
      at(o, W*s*(1-rb), D*s*(1-rb), hz), at(o, W*s*rb, D*s*(1-rb), hz),
    ];
    ctx.beginPath(); ctx.strokeStyle = '#666'; ctx.lineWidth = 0.8;
    corners.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
    ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
  titleLbl(ctx, cw, `COLUMNA · ${fd(W)} × ${fd(D)} × ${fd(H)}`);
}

function drawViga(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||4), D = +(t.ancho||0.3), H = +(t.altura||0.4);
  bg(ctx, cw, ch);
  const { s, ox, oy } = isoFit(cw, ch, W, D, H);
  const o = { x: ox, y: oy };
  box3D(ctx, o, W*s, D*s, H*s, CONCRETE, texConcrete, fd(W), fd(D), fd(H));

  // Barras longitudinales en la base
  ctx.save(); ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
  [[0.15, 0.2], [0.85, 0.2], [0.15, 0.8], [0.85, 0.8]].forEach(([fx, fy]) => {
    const a = at(o, 0, D*s*fy, H*s*fx === H*s*0.15 ? H*s*0.2 : H*s*0.2);
    const start = at(o, 0,     D*s*fy, H*s*0.18);
    const end   = at(o, W*s,   D*s*fy, H*s*0.18);
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  });
  ctx.restore();
  titleLbl(ctx, cw, `VIGA · L=${fd(W)} b=${fd(D)} h=${fd(H)}`);
}

function drawLosa(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||5), D = +(t.ancho||4), H = +(t.espesor||0.12);
  bg(ctx, cw, ch);
  const { s, ox, oy } = isoFit(cw, ch, W, D, Math.max(H, 0.15));
  box3D(ctx, { x: ox, y: oy }, W*s, D*s, Math.max(H*s, 6), CONCRETE, texConcrete, fd(W), fd(D), fd(H));

  // Malla de refuerzo en la cara superior
  const o = { x: ox, y: oy }, nW = 5, nD = 4;
  ctx.save(); ctx.strokeStyle = '#666'; ctx.lineWidth = 0.7;
  for (let i = 1; i < nW; i++) {
    const a = at(o, W*s*i/nW, 0, Math.max(H*s,6));
    const b = at(o, W*s*i/nW, D*s, Math.max(H*s,6));
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (let j = 1; j < nD; j++) {
    const a = at(o, 0, D*s*j/nD, Math.max(H*s,6));
    const b = at(o, W*s, D*s*j/nD, Math.max(H*s,6));
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.restore();
  titleLbl(ctx, cw, `LOSA · ${fd(W)} × ${fd(D)}  e=${fd(H)}`);
}

function drawZapata(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||1.2), D = +(t.ancho||1.2), H = +(t.altura||0.4);
  bg(ctx, cw, ch);
  const Heff = H + W * 0.45;
  const { s, ox, oy } = isoFit(cw, ch, W, D, Heff, 28);
  const o = { x: ox, y: oy };
  const pts = box3D(ctx, o, W*s, D*s, H*s, FOOTING, texConcrete, fd(W), fd(D), fd(H));

  // Barras longitudinales en la base de la zapata
  ctx.save(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2;
  const n = 3;
  for (let i = 1; i < n; i++) {
    const a = at(o, 0, D*s*i/n, H*s*0.25); const b = at(o, W*s, D*s*i/n, H*s*0.25);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const c = at(o, W*s*i/n, 0, H*s*0.25); const d = at(o, W*s*i/n, D*s, H*s*0.25);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
  }
  ctx.restore();

  // Column stub on top
  const cs = W*0.25*s, cd = D*0.25*s, csh = W*0.38*s;
  const stubO = at(o, W*s*0.375, D*s*0.375, H*s);
  box3D(ctx, stubO, cs, cd, csh, CONCRETE, texConcrete);
  titleLbl(ctx, cw, `ZAPATA · ${fd(W)} × ${fd(D)}  h=${fd(H)}`);
}

function drawExcavacion(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||4), D = +(t.ancho||3), H = +(t.profundidad||1.5);
  bg(ctx, cw, ch);
  const { s, ox, oy } = isoFit(cw, ch, W, D, H + 0.35, 26);
  const o = { x: ox, y: oy };

  // Earth surface ring
  const ep = [
    at(o, -0.3*s, -0.3*s, 0), at(o, W*s+0.3*s, -0.3*s, 0),
    at(o, W*s+0.3*s, D*s+0.3*s, 0), at(o, -0.3*s, D*s+0.3*s, 0)
  ];
  ctx.save(); ctx.globalAlpha = 0.4;
  poly(ctx, ep, '#9B7B2A');
  texEarth(ctx, ep);
  ctx.globalAlpha = 1; ctx.restore();

  // Pit walls
  const p0=at(o,0,0,0), p1=at(o,W*s,0,0), p2=at(o,0,D*s,0), p3=at(o,W*s,D*s,0);
  const q0=at(o,0,0,-H*s), q1=at(o,W*s,0,-H*s), q2=at(o,0,D*s,-H*s), q3=at(o,W*s,D*s,-H*s);

  const wallL = [p0, p1, q1, q0];
  const wallR = [p1, p3, q3, q1];
  const bottom= [q0, q1, q3, q2];

  poly(ctx, wallL, '#D4B04A'); texEarth(ctx, wallL);
  poly(ctx, wallR, '#B89030'); texEarth(ctx, wallR);
  poly(ctx, bottom, '#C8A040'); texEarth(ctx, bottom);
  poly(ctx, [p0, p1, p3, p2], '#9B7B2A99');

  dimLine(ctx, p0, p1, fd(W)); dimLine(ctx, p1, p3, fd(D));
  lbl(ctx, fd(H), (p0.x + q0.x) / 2 - 16, (p0.y + q0.y) / 2);
  titleLbl(ctx, cw, `EXCAVACIÓN · ${fd(W)} × ${fd(D)}  prof.=${fd(H)}`);
}

function drawMamposteria(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||4), H = +(t.altura||2.4), D = 0.19;
  bg(ctx, cw, ch);
  const Weff = W, Deff = D * 2;
  const { s, ox, oy } = isoFit(cw, ch, Weff, Deff, H, 24);
  const o = { x: ox, y: oy };

  const bW = 0.39 * s, bH = 0.19 * s, bD = D * s;
  const cols = Math.ceil(W * s / bW);
  const rows = Math.ceil(H * s / bH);

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (bW / 2);
    for (let c = 0; c < cols; c++) {
      const bx = c * bW + off - (off > 0 && c === 0 ? bW/2 : 0);
      if (bx + bW < 0 || bx > W*s) continue;
      const bz = r * bH;
      const blockO = at(o, bx, 0, bz);
      const bColors: BoxColors = {
        top:   r % 2 === 0 ? '#D4C4A0' : '#C8B898',
        right: r % 2 === 0 ? '#B8A880' : '#A89870',
        left:  r % 2 === 0 ? '#9A8C68' : '#8A7C58'
      };
      // Clip to wall boundary
      const actualW = Math.min(bW, W*s - bx) - 1;
      if (actualW > 2) box3D(ctx, blockO, actualW, bD, bH - 1, bColors);
    }
  }

  // Outer dimensions
  const p0 = at(o, 0, 0, 0), p1 = at(o, W*s, 0, 0), p3 = at(o, W*s, bD, 0);
  const p01 = at(o, 0, 0, H*s);
  dimLine(ctx, p0, p1, fd(W));
  lbl(ctx, fd(H), (p0.x + p01.x) / 2 - 14, (p0.y + p01.y) / 2);
  titleLbl(ctx, cw, `MAMPOSTERÍA · ${fd(W)} × ${fd(H)}`);
}

function drawContrapiso(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||4), D = +(t.ancho||3), H = 0.1;
  bg(ctx, cw, ch);
  const { s, ox, oy } = isoFit(cw, ch, W, D, Math.max(H, 0.2));
  box3D(ctx, { x: ox, y: oy }, W*s, D*s, Math.max(H*s, 5),
    { top: '#D8D0B0', right: '#C0B888', left: '#A8A070' }, texConcrete, fd(W), fd(D), '10cm');
  titleLbl(ctx, cw, `CONTRAPISO · ${fd(W)} × ${fd(D)}`);
}

function drawCubierta(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||8), D = +(t.ancho||6);
  const ridgeH = D * 0.35;
  bg(ctx, cw, ch);
  const { s, ox, oy } = isoFit(cw, ch, W, D, ridgeH + 0.2, 26);
  const o = { x: ox, y: oy };
  box3D(ctx, o, W*s, D*s, 5, { top:'#C0C0C0', right:'#A8A8A8', left:'#909090' }, texConcrete);

  const p0 = at(o, 0, 0, 5), p1 = at(o, W*s, 0, 5);
  const p2 = at(o, 0, D*s, 5), p3 = at(o, W*s, D*s, 5);
  const r1 = at(o, 0, D*s/2, 5+ridgeH*s), r2 = at(o, W*s, D*s/2, 5+ridgeH*s);

  const slopeFront = [p0, p1, r2, r1];
  const slopeBack  = [p2, p3, r2, r1];

  poly(ctx, slopeFront, '#7A2E0E'); texRoofTiles(ctx, slopeFront);
  poly(ctx, slopeBack,  '#5A200A'); texRoofTiles(ctx, slopeBack);
  poly(ctx, [p0, p2, r1], '#6A2808');
  poly(ctx, [p1, p3, r2], '#6A2808');

  // Ridge beam
  ctx.save(); ctx.strokeStyle = '#3A1004'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.stroke();
  ctx.restore();

  dimLine(ctx, p0, p1, fd(W)); dimLine(ctx, p1, p3, fd(D));
  titleLbl(ctx, cw, `CUBIERTA · ${fd(W)} × ${fd(D)}`);
}

function drawEscalera(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const steps = Math.max(2, +(t.huellas||10)), ancho = +(t.ancho||1.2);
  bg(ctx, cw, ch);
  // 3D isometric staircase
  const stepW = 0.28, stepH = 0.18, stepD = ancho;
  const W = steps * stepW, H = steps * stepH;
  const { s, ox, oy } = isoFit(cw, ch, W, stepD, H, 24);
  const o = { x: ox, y: oy };

  for (let i = 0; i < steps; i++) {
    const bx = i * stepW * s, bz = i * stepH * s;
    const stepO = at(o, bx, 0, bz);
    const shade = 160 + (i % 2) * 20;
    box3D(ctx, stepO, stepW*s, stepD*s, stepH*s, {
      top:   `rgb(${shade},${shade-12},${shade-24})`,
      right: `rgb(${shade-20},${shade-32},${shade-44})`,
      left:  `rgb(${shade-35},${shade-47},${shade-59})`,
    }, texConcrete);
  }

  const p0 = at(o, 0, 0, 0), p1 = at(o, W*s, 0, H*s);
  lbl(ctx, `${steps} huellas`, (p0.x + p1.x)/2, oy - H*s*Math.cos(_el)/2);
  lbl(ctx, fd(ancho), at(o, W*s/2, stepD*s, H*s/2).x + 20, at(o, W*s/2, stepD*s, H*s/2).y);
  titleLbl(ctx, cw, `ESCALERA · ${steps} huellas · ancho=${fd(ancho)}`);
}

function drawMuroPerimetral(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||10), H = +(t.alto||2.4), D = 0.2;
  bg(ctx, cw, ch);
  const { s, ox, oy } = isoFit(cw, ch, W, D*3, H);
  box3D(ctx, { x: ox, y: oy }, W*s, Math.max(D*3*s, 8), H*s,
    { top:'#D8C8A8', right:'#C0B088', left:'#A89870' }, texConcrete, fd(W), '', fd(H));
  titleLbl(ctx, cw, `MURO PERIMETRAL · ${fd(W)} × ${fd(H)}`);
}

function drawPilotefn(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const diam = +(t.diametro||0.4), prof = +(t.profundidad||t.largo||8);
  bg(ctx, cw, ch);
  const cx2 = cw/2, r = Math.min(cw*0.1, ch*0.07, 24);
  const sh = Math.min(ch*0.55, prof*14), topY = ch*0.16;

  // Earth layers
  const layerColors = ['#9B7B2A','#8A6A20','#B08030','#7A5A18'];
  for (let l = 0; l < 4; l++) {
    ctx.fillStyle = layerColors[l]+'88';
    ctx.fillRect(0, topY+16+l*(sh/4), cw, sh/4);
  }
  ctx.strokeStyle = '#6A480A'; ctx.lineWidth = 0.5;
  for (let l = 1; l < 4; l++) {
    ctx.beginPath(); ctx.moveTo(0, topY+16+l*(sh/4)); ctx.lineTo(cw, topY+16+l*(sh/4)); ctx.stroke();
  }

  // Ground line
  ctx.fillStyle = '#9B7B2A44'; ctx.fillRect(0, topY, cw, 16);

  // Pile concrete body
  const grad = ctx.createLinearGradient(cx2-r, 0, cx2+r, 0);
  grad.addColorStop(0, '#C0C0C0'); grad.addColorStop(0.5, '#E0E0E0'); grad.addColorStop(1, '#A0A0A0');
  ctx.fillStyle = grad;
  ctx.fillRect(cx2-r, topY+8, r*2, sh);

  // Top cap
  ctx.beginPath(); ctx.ellipse(cx2, topY+8, r, r*0.36, 0, 0, Math.PI*2);
  ctx.fillStyle = '#D8D8D8'; ctx.fill();
  ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.stroke();

  // Rebar
  ctx.save(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  [-r*0.55, r*0.55].forEach(dx => {
    ctx.beginPath(); ctx.moveTo(cx2+dx, topY+4); ctx.lineTo(cx2+dx, topY+8+sh); ctx.stroke();
  });
  ctx.restore();

  // Tip
  ctx.beginPath(); ctx.moveTo(cx2-r, topY+8+sh);
  ctx.lineTo(cx2, topY+8+sh+r*0.8); ctx.lineTo(cx2+r, topY+8+sh);
  ctx.fillStyle = '#A8A8A8'; ctx.fill();

  lbl(ctx, `Ø${fd(diam)}`, cx2+r+18, topY+14);
  lbl(ctx, fd(prof), cx2-r-22, topY+sh/2+8);
  titleLbl(ctx, cw, `PILOTE · Ø${fd(diam)}  prof.=${fd(prof)}`);
}

function drawPuerta(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.ancho||0.9), H = +(t.alto||2.1);
  bg(ctx, cw, ch);
  const pad = 28, sh = ch-pad*2-14, sw = sh*(W/H);
  const ox = (cw-sw)/2, oy = pad+6;
  // Frame shadow
  ctx.fillStyle = '#0002'; ctx.fillRect(ox-3, oy-3, sw+12, sh+8);
  ctx.fillStyle = '#C8A060'; ctx.fillRect(ox-5, oy-5, sw+10, sh+5);
  ctx.fillStyle = '#E8C870'; ctx.fillRect(ox+2, oy+2, sw-4, sh-2);
  // Wood grain lines
  ctx.save(); ctx.strokeStyle = '#C8A840'; ctx.lineWidth = 0.5;
  for (let g = 0; g < sw-12; g += 8) { ctx.beginPath(); ctx.moveTo(ox+8+g, oy+6); ctx.lineTo(ox+8+g, oy+sh-4); ctx.stroke(); }
  ctx.restore();
  // Panels
  ctx.strokeStyle = '#B09050'; ctx.lineWidth = 1.5;
  ctx.strokeRect(ox+8, oy+8, sw-16, (sh-20)*0.42);
  ctx.strokeRect(ox+8, oy+8+(sh-20)*0.48, sw-16, (sh-20)*0.48);
  // Knob
  ctx.beginPath(); ctx.arc(ox+sw-14, oy+sh*0.5, 5, 0, Math.PI*2);
  const kg = ctx.createRadialGradient(ox+sw-15, oy+sh*0.5-1, 1, ox+sw-14, oy+sh*0.5, 5);
  kg.addColorStop(0, '#EEE'); kg.addColorStop(1, '#888');
  ctx.fillStyle = kg; ctx.fill();
  lbl(ctx, fd(W), ox+sw/2, oy+sh+14); lbl(ctx, fd(H), ox-18, oy+sh/2);
  titleLbl(ctx, cw, `PUERTA · ${fd(W)} × ${fd(H)}`);
}

function drawVentana(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.ancho||1.2), H = +(t.alto||1.0);
  bg(ctx, cw, ch);
  const pad = 28;
  const sw = Math.min(cw-pad*2, (ch-52)*(W/H)), sh = sw*(H/W);
  const ox = (cw-sw)/2, oy = (ch-sh)/2 + 4;
  // Frame
  ctx.fillStyle = '#B0B0B0'; ctx.fillRect(ox-6, oy-6, sw+12, sh+12);
  ctx.fillStyle = '#909090'; ctx.fillRect(ox-5, oy-5, sw+10, sh+10);
  // Glass panes with reflection
  const cols = Math.max(1, Math.round(W/0.5)), rows = Math.max(1, Math.round(H/0.5));
  const pw = sw/cols, ph = sh/rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const gx = ox + c*pw + 1, gy = oy + r*ph + 1;
      const gw = pw - 2, gh = ph - 2;
      // Glass base
      ctx.fillStyle = 'rgba(140,200,230,0.55)'; ctx.fillRect(gx, gy, gw, gh);
      // Reflection highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(gx+2, gy+2, gw*0.35, gh*0.35);
    }
  ctx.strokeStyle = '#707070'; ctx.lineWidth = 2; ctx.strokeRect(ox-6, oy-6, sw+12, sh+12);
  lbl(ctx, fd(W), ox+sw/2, oy+sh+16); lbl(ctx, fd(H), ox-20, oy+sh/2);
  titleLbl(ctx, cw, `VENTANA · ${fd(W)} × ${fd(H)}`);
}

function drawTuberia(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const diam = +(t.diametro||0.05), largo = +(t.largo||t.longitud||3);
  bg(ctx, cw, ch);
  const W = largo, D = diam*5, H = diam*5;
  const { s, ox, oy } = isoFit(cw, ch, W, D, H);
  const o = { x: ox, y: oy };
  box3D(ctx, o, W*s, D*s, H*s,
    { top:'#90B8D4', right:'#6898B8', left:'#4878A0' }, undefined, fd(largo), '', fd(diam));
  // Hollow end (left face center)
  const fc = at(o, 0, D*s/2, H*s/2);
  const r = D*s*0.4;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(fc.x, fc.y, r, r*0.55, 0, 0, Math.PI*2);
  ctx.fillStyle = '#1E3050'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(fc.x, fc.y, r*0.55, r*0.30, 0, 0, Math.PI*2);
  ctx.fillStyle = '#080C14'; ctx.fill();
  ctx.restore();
  titleLbl(ctx, cw, `TUBERÍA · Ø${fd(diam)}  L=${fd(largo)}`);
}

function drawArea2D(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any, name: string, fill: string) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||t.ancho||4), H = +(t.alto||t.ancho||t.largo||3);
  bg(ctx, cw, ch);
  const pad = 28;
  const sw = Math.min(cw-pad*2, (ch-52)*(W/H)), sh = sw*(H/W);
  const ox = (cw-sw)/2, oy = (ch-sh)/2 + 4;
  ctx.fillStyle = fill; ctx.fillRect(ox, oy, sw, sh);
  ctx.strokeStyle = '#0004'; ctx.lineWidth = 1; ctx.strokeRect(ox, oy, sw, sh);
  lbl(ctx, fd(W), ox+sw/2, oy+sh+13); lbl(ctx, fd(H), ox-16, oy+sh/2);
  titleLbl(ctx, cw, `${name} · ${fd(W)} × ${fd(H)}`);
}

function drawCeramica(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||4), H = +(t.ancho||3);
  bg(ctx, cw, ch);
  const pad = 28;
  const sw = Math.min(cw-pad*2, (ch-52)*(W/H)), sh = sw*(H/W);
  const ox = (cw-sw)/2, oy = (ch-sh)/2 + 4;
  const fmtStr: string = p.formato ?? '60x60';
  const tileCm = parseInt(fmtStr) || 60;
  const tilePx = sw / (W * 100 / tileCm);

  // Tile fill with alternating shades
  let idx = 0;
  for (let x = ox; x < ox+sw; x += tilePx) {
    for (let y = oy; y < oy+sh; y += tilePx) {
      const shade = (idx % 2 === 0) ? '#F5F0E8' : '#EDE8DC';
      ctx.fillStyle = shade;
      ctx.fillRect(x+0.5, y+0.5, Math.min(tilePx-1, ox+sw-x-0.5), Math.min(tilePx-1, oy+sh-y-0.5));
      idx++;
    }
    idx++;
  }
  ctx.strokeStyle = '#C8B890'; ctx.lineWidth = 0.8;
  for (let x = ox; x <= ox+sw; x += tilePx) { ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy+sh); ctx.stroke(); }
  for (let y = oy; y <= oy+sh; y += tilePx) { ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox+sw, y); ctx.stroke(); }
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5; ctx.strokeRect(ox, oy, sw, sh);
  lbl(ctx, fd(W), ox+sw/2, oy+sh+13); lbl(ctx, fd(H), ox-16, oy+sh/2);
  titleLbl(ctx, cw, `CERÁMICA ${fmtStr}cm · ${fd(W)} × ${fd(H)}`);
}

function drawEnlucido(ctx: CanvasRenderingContext2D, cw: number, ch: number, p: any) {
  const t = p.tramos?.[0] ?? {};
  const W = +(t.largo||4), H = +(t.alto||2.4);
  bg(ctx, cw, ch);
  const pad = 28, sw = Math.min(cw-pad*2, (ch-52)*(W/H)), sh = sw*(H/W);
  const ox = (cw-sw)/2, oy = (ch-sh)/2 + 4;
  ctx.fillStyle = '#F2E8D4'; ctx.fillRect(ox, oy, sw, sh);
  // Stipple texture (deterministic)
  let idx = 0;
  for (let gx = ox+4; gx < ox+sw; gx += 7) {
    for (let gy = oy+4; gy < oy+sh; gy += 6) {
      const jx = jitter(idx*5, 2), jy = jitter(idx*7, 2);
      ctx.fillStyle = idx%3===0?'#D8C8A0':idx%3===1?'#E8D8B0':'#C8B890';
      ctx.fillRect(gx+jx, gy+jy, 1.5, 1.5);
      idx++;
    }
  }
  ctx.strokeStyle = '#C8B890'; ctx.lineWidth = 1; ctx.strokeRect(ox, oy, sw, sh);
  lbl(ctx, fd(W), ox+sw/2, oy+sh+13); lbl(ctx, fd(H), ox-16, oy+sh/2);
  titleLbl(ctx, cw, `ENLUCIDO · ${fd(W)} × ${fd(H)}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function drawForKey(ctx: CanvasRenderingContext2D, cw: number, ch: number, qKey: string, params: any) {
  switch (qKey) {
    case 'columna':              drawColumna(ctx, cw, ch, params); break;
    case 'viga':                 drawViga(ctx, cw, ch, params); break;
    case 'losa':                 drawLosa(ctx, cw, ch, params); break;
    case 'zapata': case 'zapata-muro': case 'zapata-columna':
    case 'losa-fundacion': case 'cisterna': drawZapata(ctx, cw, ch, params); break;
    case 'exc-cielo': case 'exc-cimientos': case 'desbanque':
    case 'capa-vegetal': case 'relleno':    drawExcavacion(ctx, cw, ch, params); break;
    case 'mamposteria':          drawMamposteria(ctx, cw, ch, params); break;
    case 'contrapiso':           drawContrapiso(ctx, cw, ch, params); break;
    case 'enlucido': case 'revestimiento': drawEnlucido(ctx, cw, ch, params); break;
    case 'ceramica':             drawCeramica(ctx, cw, ch, params); break;
    case 'pintura':              drawArea2D(ctx, cw, ch, params, 'PINTURA', '#FFFDE0'); break;
    case 'cubierta': case 'estructura-metalica': drawCubierta(ctx, cw, ch, params); break;
    case 'cielo-raso':           drawArea2D(ctx, cw, ch, params, 'CIELO RASO', '#F0F0F8'); break;
    case 'impermeabilizacion':   drawArea2D(ctx, cw, ch, params, 'IMPERMEAB.', '#C8DFF0'); break;
    case 'puerta':               drawPuerta(ctx, cw, ch, params); break;
    case 'ventana': case 'carpinteria-aluminio': drawVentana(ctx, cw, ch, params); break;
    case 'tuberia':              drawTuberia(ctx, cw, ch, params); break;
    case 'escalera':             drawEscalera(ctx, cw, ch, params); break;
    case 'muro-perimetral':      drawMuroPerimetral(ctx, cw, ch, params); break;
    case 'pilotes':              drawPilotefn(ctx, cw, ch, params); break;
    case 'acera':                drawArea2D(ctx, cw, ch, params, 'ACERA', '#D8D8C8'); break;
    case 'piso-flotante':        drawArea2D(ctx, cw, ch, params, 'PISO FLOTANTE', '#D8C8A0'); break;
    case 'closet':               drawArea2D(ctx, cw, ch, params, 'CLOSET', '#ECD8B8'); break;
    default: {
      ctx.clearRect(0,0,cw,ch); ctx.fillStyle='#FAFAF8'; ctx.fillRect(0,0,cw,ch);
      ctx.save(); ctx.font='bold 11px "Segoe UI",sans-serif'; ctx.fillStyle='#BBBBBB';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(qKey.toUpperCase(),cw/2,ch/2); ctx.restore();
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@Component({
  selector: 'app-quick-calc-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #wrapper
         style="width:100%;height:100%;position:relative;background:#FAFAF8;border-radius:8px;overflow:hidden;border:1px solid #E0D8D0;user-select:none"
         (mousedown)="onMouseDown($event)"
         (mousemove)="onMouseMove($event)"
         (mouseup)="onMouseUp()"
         (mouseleave)="onMouseUp()"
         [style.cursor]="isDragging ? 'grabbing' : 'grab'">
      <canvas #canvas style="display:block;width:100%;height:100%"></canvas>
    </div>
  `,
})
export class QuickCalcCanvasComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() qKey = '';
  @Input() params: Record<string, any> = {};

  @ViewChild('canvas')  canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wrapper') wrapperRef!: ElementRef<HTMLDivElement>;

  azimuth   = 225 * Math.PI / 180;
  elevation = 30  * Math.PI / 180;
  isDragging = false;
  private lastMx = 0;
  private lastMy = 0;
  private ro?: ResizeObserver;

  ngAfterViewInit() {
    this.ro = new ResizeObserver(() => this.redraw());
    this.ro.observe(this.wrapperRef.nativeElement);
    this.redraw();
  }

  ngOnChanges(_: SimpleChanges) { setTimeout(() => this.redraw(), 0); }
  ngOnDestroy() { this.ro?.disconnect(); }

  onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.lastMx = e.clientX;
    this.lastMy = e.clientY;
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMx;
    const dy = e.clientY - this.lastMy;
    this.lastMx = e.clientX;
    this.lastMy = e.clientY;
    this.azimuth  += dx * 0.012;
    this.elevation = Math.max(0.08, Math.min(Math.PI / 2 - 0.08, this.elevation - dy * 0.012));
    this.redraw();
  }

  onMouseUp() { this.isDragging = false; }

  private redraw() {
    const canvas  = this.canvasRef?.nativeElement;
    const wrapper = this.wrapperRef?.nativeElement;
    if (!canvas || !wrapper) return;
    const w = wrapper.clientWidth  || 280;
    const h = wrapper.clientHeight || 340;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    _az = this.azimuth;
    _el = this.elevation;
    drawForKey(ctx, w, h, this.qKey, this.params);
  }
}
