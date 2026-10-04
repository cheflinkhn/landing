#!/usr/bin/env node
// Builds the hero's street: a hand-drawn row of food businesses (café, taquería,
// bistro, bar, lounge, pizzeria, sushi bar…) seen in a loose oblique projection,
// after the illustrated towns on sites like val.town. Writes
// src/assets/street-scene.svg, which StreetScene.astro inlines and
// scripts/og/og.html embeds in the social card.
//
//   node scripts/street-scene/build.mjs
//
// World space: X runs along the street (left → right), Z is depth back from the
// kerb (towards the buildings), Y is up. Depth recedes up and to the right, so
// every building shows its front, its right flank and its roof. Things further
// right or nearer the viewer are drawn later and cover what is behind them.
// The "hand-drawn" look is three cheap tricks: fills printed slightly off their
// outlines, hatching on every shaded face, and a turbulence filter that wobbles
// all the lines a little.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/assets/street-scene.svg');

// ---- projection -----------------------------------------------------------
// The block is drawn much wider than any viewport and shown like a cover image
// (fixed height, cropped evenly on both sides), so it always runs edge to edge.
// The eight venues around x = 0…1440 are the heart of it; the rest is bleed.
const X0 = -600, W = 2640, H = 300;  // viewBox: x from X0 to X0 + W
const X1 = X0 + W;
const KERB_Y = 252;            // screen y of the kerb (world Z = 0, Y = 0)
const DZX = 0.74, DZY = 0.54;  // one unit of depth moves this far right and up
const WALL_Z = 44;             // the building line sits this far behind the kerb
const P = (x, y = 0, z = 0) => [x + DZX * z, KERB_Y - DZY * z - y];
const r1 = (n) => Math.round(n * 10) / 10;
const pts = (list) => list.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');

// ---- palette ---------------------------------------------------------------
const INK = '#3A2E25';
const C = {
  paper: '#FFFDF8', cream: '#F6ECDC', glass: '#DCE9EF', glassHi: '#F2F8FA',
  sage: '#C5D0B2', terracotta: '#E2A585', mustard: '#EACD86', plaster: '#F3E8D6',
  brick: '#CF8664', blue: '#BCCDD8', peach: '#F2DCC4', bone: '#EFE5D3',
  wood: '#9C6A45', woodDark: '#7A4E31', slat: '#B98457',
  brand: '#F97216', accent: '#C2410C', green: '#5B8C4A', leaf: '#8FB573', leafDark: '#6E9A5A',
  indigo: '#4F6D8F', chalk: '#3E5A3A', lamp: '#F6D47A',
  pavement: '#EFE5D6', slab: '#DDCFBB', kerb: '#D8C8B2', road: '#E7DDD0', roadLine: '#F7F0E6',
  skin: '#F0C8A0', skin2: '#C98B5E', hairDark: '#3A2A1E', hair: '#A05A2C',
};
// Darken (k > 0) or lighten (k < 0) a hex colour by a fraction.
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 - k))));
  return `#${((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
};

// ---- primitives ------------------------------------------------------------
const out = [];
const FILL_OFF = [1.4, 1.0]; // fills sit a hair off their lines, like loose colouring
const emit = (s) => out.push(s);

// A closed shape: fill (offset) then line. `hatch` lays a hatch pattern over the fill.
function shape(points, fill, { stroke = INK, sw = 1.4, hatch = null, noOffset = false, dash = null } = {}) {
  const d = pts(points);
  if (fill && fill !== 'none') {
    const t = noOffset ? '' : ` transform="translate(${FILL_OFF[0]} ${FILL_OFF[1]})"`;
    emit(`<polygon points="${d}" fill="${fill}"${t}/>`);
    if (hatch) emit(`<polygon points="${d}" fill="url(#${hatch})"${t}/>`);
  }
  if (stroke) emit(`<polygon points="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
}
function line(points, { stroke = INK, sw = 1.3, dash = null } = {}) {
  emit(`<polyline points="${pts(points)}" fill="none" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
}
function path(d, { fill = 'none', stroke = INK, sw = 1.4, hatch = null } = {}) {
  if (fill !== 'none') {
    emit(`<path d="${d}" fill="${fill}" transform="translate(${FILL_OFF[0]} ${FILL_OFF[1]})"/>`);
    if (hatch) emit(`<path d="${d}" fill="url(#${hatch})" transform="translate(${FILL_OFF[0]} ${FILL_OFF[1]})"/>`);
  }
  if (stroke) emit(`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`);
}
// A circle drawn as a wobbly closed path (screen space).
function blob(cx, cy, r, fill, opts = {}) {
  const n = opts.n || 14, amp = opts.amp ?? 0.08;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + amp * Math.sin(i * 2.7 + (opts.seed || 0)));
    d += `${i ? 'L' : 'M'}${r1(cx + rr * Math.cos(a))} ${r1(cy + rr * Math.sin(a))}`;
  }
  path(d + 'Z', { fill, ...opts });
}
// A circle lying on a horizontal plane (table tops, parasols), projected.
function disc(x, y, z, r, fill, opts = {}) {
  const n = 18, p = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; p.push(P(x + r * Math.cos(a), y, z + r * Math.sin(a))); }
  shape(p, fill, opts);
}
// Front-face rectangle (in the X/Y plane at depth z).
function rectF(x, y, w, h, z, fill, opts) { shape([P(x, y, z), P(x + w, y, z), P(x + w, y + h, z), P(x, y + h, z)], fill, opts); }
// Flank rectangle (in the Z/Y plane at X = x).
function rectS(x, y, z, d, h, fill, opts) { shape([P(x, y, z), P(x, y, z + d), P(x, y + h, z + d), P(x, y + h, z)], fill, opts); }
// Horizontal rectangle (in the X/Z plane at height y).
function rectT(x, z, w, d, y, fill, opts) { shape([P(x, y, z), P(x + w, y, z), P(x + w, y, z + d), P(x, y, z + d)], fill, opts); }
function text(x, y, str, { size = 17, fill = INK, anchor = 'middle', weight = 700, spacing = 1.5, rotate = 0 } = {}) {
  const tr = rotate ? ` transform="rotate(${rotate} ${r1(x)} ${r1(y)})"` : '';
  emit(`<text x="${r1(x)}" y="${r1(y)}" font-family="Kalam, 'Comic Sans MS', cursive" font-weight="${weight}" font-size="${size}" letter-spacing="${spacing}" text-anchor="${anchor}" fill="${fill}"${tr}>${str}</text>`);
}

// ---- building parts --------------------------------------------------------
const Z = WALL_Z;
function awning(x, w, y, colors, { drop = 9, reach = 16, scallop = true } = {}) {
  const z0 = Z, z1 = Z - reach, y1 = y - drop;
  const stripes = Math.max(2, Math.round(w / 13));
  for (let i = 0; i < stripes; i++) {
    const a = x + (w * i) / stripes, b = x + (w * (i + 1)) / stripes;
    shape([P(a, y, z0), P(b, y, z0), P(b, y1, z1), P(a, y1, z1)], colors[i % colors.length], { stroke: null, noOffset: true });
  }
  shape([P(x, y, z0), P(x + w, y, z0), P(x + w, y1, z1), P(x, y1, z1)], null, { sw: 1.4 });
  // gusset on the right
  shape([P(x + w, y, z0), P(x + w, y1, z1), P(x + w, y1, z0)], shade(colors[0], 0.18), { hatch: 'hatch' });
  if (scallop) {
    const n = Math.round(w / 11);
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = P(x + (w * i) / n, y1, z1), b = P(x + (w * (i + 1)) / n, y1, z1);
      d += `${i ? '' : `M${r1(a[0])} ${r1(a[1])}`}Q${r1((a[0] + b[0]) / 2)} ${r1(a[1] + 5)} ${r1(b[0])} ${r1(b[1])}`;
    }
    path(d, { sw: 1.3 });
  }
  // the shadow it throws on the wall
  shape([P(x, y, z0), P(x + w, y, z0), P(x + w, y - 10, z0), P(x, y - 10, z0)], 'rgba(58,46,37,0.10)', { stroke: null, noOffset: true });
}
function shopWindow(x, y, w, h, { mullions = 1, transom = false } = {}) {
  rectF(x, y, w, h, Z, C.glass);
  // a diagonal gleam
  line([P(x + w * 0.18, y + h * 0.9, Z), P(x + w * 0.42, y + h * 0.15, Z)], { stroke: C.glassHi, sw: 3 });
  for (let i = 1; i <= mullions; i++) line([P(x + (w * i) / (mullions + 1), y, Z), P(x + (w * i) / (mullions + 1), y + h, Z)], { sw: 1.2 });
  if (transom) line([P(x, y + h * 0.72, Z), P(x + w, y + h * 0.72, Z)], { sw: 1.2 });
}
function sill(x, y, w, h, fill) { rectF(x, y, w, h, Z, fill); }
function door(x, w, h, fill, { glass = true, arch = false } = {}) {
  if (arch) {
    const a = P(x, 0, Z), b = P(x + w, 0, Z), r = w / 2, top = P(x + r, h - r, Z);
    path(`M${a[0]} ${a[1]}L${a[0]} ${top[1]}A${r} ${r} 0 0 1 ${b[0]} ${top[1]}L${b[0]} ${b[1]}Z`, { fill });
  } else rectF(x, 0, w, h, Z, fill);
  if (glass) rectF(x + w * 0.2, h * 0.45, w * 0.6, h * 0.4, Z, C.glass, { sw: 1.1 });
  const k = P(x + w * 0.82, h * 0.42, Z); blob(k[0], k[1], 1.6, INK, { stroke: null, n: 6 });
  // a step
  rectT(x - 3, Z - 6, w + 6, 6, 0, shade(C.pavement, 0.08), { sw: 1 });
}
function upperWindow(x, y, w, h, { shutters = null, box = null, arch = false } = {}) {
  if (arch) {
    const a = P(x, y, Z), b = P(x + w, y, Z), r = w / 2, top = P(x + r, y + h - r, Z);
    path(`M${a[0]} ${a[1]}L${a[0]} ${top[1]}A${r} ${r} 0 0 1 ${b[0]} ${top[1]}L${b[0]} ${b[1]}Z`, { fill: C.glass });
  } else rectF(x, y, w, h, Z, C.glass);
  line([P(x + w / 2, y, Z), P(x + w / 2, y + h, Z)], { sw: 1.1 });
  line([P(x, y + h / 2, Z), P(x + w, y + h / 2, Z)], { sw: 1.1 });
  if (shutters) { rectF(x - 9, y, 8, h, Z, shutters, { hatch: 'hatchFine' }); rectF(x + w + 1, y, 8, h, Z, shutters, { hatch: 'hatchFine' }); }
  if (box) {
    rectF(x - 2, y - 7, w + 4, 7, Z, C.wood);
    for (let i = 0; i < 4; i++) { const p = P(x + 2 + (i * (w - 2)) / 3.2, y + 3, Z); blob(p[0], p[1], 3.2, i % 2 ? C.brand : '#E8A4B8', { stroke: INK, sw: 1, n: 7, seed: i }); }
    for (let i = 0; i < 3; i++) { const p = P(x + 6 + (i * (w - 8)) / 2.2, y + 1, Z); blob(p[0], p[1], 2.8, C.leaf, { stroke: INK, sw: 1, n: 7, seed: i + 3 }); }
  }
}
function fascia(x, y, w, h, fill, label, { size = 17, textFill = INK } = {}) {
  rectF(x, y, w, h, Z, fill);
  const c = P(x + w / 2, y + h / 2 - size * 0.36, Z);
  text(c[0], c[1], label, { size, fill: textFill });
}
function balcony(x, w, y, depth = 11) {
  rectT(x, Z - depth, w, depth, y, shade(C.bone, 0.06), { sw: 1.2 });
  rectF(x, y - 4, w, 4, Z - depth, shade(C.bone, 0.18), { sw: 1.2 });
  const n = Math.round(w / 9);
  for (let i = 0; i <= n; i++) line([P(x + (w * i) / n, y, Z - depth), P(x + (w * i) / n, y + 22, Z - depth)], { sw: 1.1 });
  line([P(x, y + 22, Z - depth), P(x + w, y + 22, Z - depth)], { sw: 1.6 });
  line([P(x + w, y, Z - depth), P(x + w, y, Z)], { sw: 1.1 }); line([P(x + w, y + 22, Z - depth), P(x + w, y + 22, Z)], { sw: 1.1 });
}
function planter(x, z, w, { tall = false } = {}) {
  const d = 10, h = 11;
  rectT(x, z, w, d, h, shade(C.wood, -0.1), { sw: 1.1 });
  rectF(x, 0, w, h, z, C.wood, { sw: 1.2 });
  rectS(x + w, 0, z, d, h, shade(C.wood, 0.2), { hatch: 'hatch', sw: 1.2 });
  const cx = P(x + w / 2, h, z + d / 2);
  if (tall) {
    for (let i = -1; i <= 1; i++) line([cx, [cx[0] + i * 7, cx[1] - 30 - Math.abs(i) * -4]], { stroke: C.green, sw: 1.6 });
    for (let i = -1; i <= 1; i++) blob(cx[0] + i * 8, cx[1] - 30 + Math.abs(i) * 5, 6, C.leaf, { n: 8, seed: i, sw: 1.1 });
  } else {
    blob(cx[0], cx[1] - 7, 10, C.leaf, { n: 10, seed: x, sw: 1.2 });
    blob(cx[0] - 7, cx[1] - 3, 6, C.leafDark, { n: 8, seed: x + 1, sw: 1.1 });
    blob(cx[0] + 8, cx[1] - 4, 5.5, C.leafDark, { n: 8, seed: x + 2, sw: 1.1 });
  }
}
function tree(x, z, { r = 28, trunk = 44 } = {}) {
  const base = P(x, 0, z);
  blob(base[0] + 2, base[1] + 1, 7, 'rgba(58,46,37,0.10)', { stroke: null, n: 10 });
  shape([P(x - 3, 0, z), P(x + 3, 0, z), P(x + 2, trunk, z), P(x - 2, trunk, z)], C.woodDark, { sw: 1.3 });
  const c = P(x, trunk + r * 0.8, z);
  blob(c[0], c[1], r, C.leaf, { n: 16, amp: 0.1, seed: x, sw: 1.5 });
  blob(c[0] + r * 0.25, c[1] + r * 0.28, r * 0.55, C.leafDark, { stroke: null, n: 12, amp: 0.12, seed: x + 2 });
  blob(c[0] - r * 0.3, c[1] - r * 0.25, r * 0.3, '#A9C98E', { stroke: null, n: 10, seed: x + 4 });
  // a tree pit
  rectT(x - 12, z - 10, 24, 20, 0, null, { sw: 1.1 });
}
function lamppost(x, z) {
  const b = P(x, 0, z), t = P(x, 112, z);
  rectT(x - 4, z - 4, 8, 8, 0, shade(C.kerb, 0.1), { sw: 1.1 });
  line([b, t], { sw: 2.2 });
  path(`M${t[0]} ${t[1]}q0 -10 10 -10`, { sw: 2 });
  shape([[t[0] + 5, t[1] - 10], [t[0] + 15, t[1] - 10], [t[0] + 13, t[1] + 2], [t[0] + 7, t[1] + 2]], C.lamp, { sw: 1.3 });
}
function table(x, z, { r = 11, chairs = [0, Math.PI] } = {}) {
  const sh = P(x, 0, z); blob(sh[0] + 1, sh[1], r + 2, 'rgba(58,46,37,0.08)', { stroke: null, n: 10 });
  for (const a of chairs) {
    const cx = x + Math.cos(a) * (r + 9), cz = z + Math.sin(a) * (r + 9);
    rectT(cx - 5, cz - 5, 10, 10, 11, C.wood, { sw: 1.1 });
    // legs and back
    line([P(cx - 4, 11, cz - 4), P(cx - 4, 0, cz - 4)], { sw: 1.1 }); line([P(cx + 4, 11, cz - 4), P(cx + 4, 0, cz - 4)], { sw: 1.1 });
    const bx = cx + Math.cos(a) * 5, bz = cz + Math.sin(a) * 5;
    line([P(bx, 11, bz), P(bx, 24, bz)], { sw: 1.3 });
  }
  line([P(x, 0, z), P(x, 20, z)], { sw: 2 });
  disc(x, 20, z, r, C.paper, { sw: 1.3 });
  // a cup and a plate
  const c = P(x - 4, 20, z + 2); blob(c[0], c[1] - 2, 2.4, C.paper, { sw: 1, n: 7 });
  disc(x + 4, 20.2, z - 2, 3.6, C.paper, { sw: 0.9 });
}
function parasol(x, z, { r = 30, h = 66, colors = [C.brand, C.paper] } = {}) {
  line([P(x, 0, z), P(x, h, z)], { sw: 2 });
  const n = 10, top = P(x, h + 16, z);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const p0 = P(x + r * Math.cos(a0), h, z + r * Math.sin(a0)), p1 = P(x + r * Math.cos(a1), h, z + r * Math.sin(a1));
    shape([top, p0, p1], colors[i % 2], { sw: 1.1 });
  }
}
function seated(x, z, facing = 1, { shirt = C.indigo, skin = C.skin, hair = C.hairDark } = {}) {
  const b = P(x, 0, z);
  // body (a rounded block), then head
  path(`M${b[0] - 6} ${b[1] - 8}q0 -14 6 -14q6 0 6 14Z`, { fill: shirt, sw: 1.2 });
  const hd = [b[0], b[1] - 27];
  blob(hd[0], hd[1], 5.5, skin, { n: 9, sw: 1.2 });
  path(`M${hd[0] - 5.5} ${hd[1] - 1}q1 -7 5.5 -7q4.5 0 5.5 7q-2 -3 -5.5 -3q-3.5 0 -5.5 3Z`, { fill: hair, sw: 1 });
  // an arm reaching to the table
  line([[b[0] + 2 * facing, b[1] - 16], [b[0] + 9 * facing, b[1] - 13]], { sw: 1.6 });
}
function aFrame(x, z, label) {
  const a = P(x, 0, z), b = P(x + 22, 0, z), top = P(x + 11, 30, z);
  shape([a, b, [top[0] + 6, top[1]], [top[0] - 6, top[1]]], C.chalk, { sw: 1.3 });
  shape([[top[0] - 6, top[1]], [top[0] + 6, top[1]], [top[0] + 6 + 8, top[1] + 30 - 4]], shade(C.woodDark, 0.1), { sw: 1.2 });
  text(top[0], top[1] + 17, label, { size: 8, fill: C.paper, spacing: 0.5 });
}
function barrel(x, z) {
  const r = 9;
  for (let i = 0; i < 2; i++) disc(x, 18 - i * 14, z, r + (i ? 1 : 0), null, { stroke: INK, sw: 1.1 });
  shape([P(x - r, 0, z), P(x + r, 0, z), P(x + r + 1, 18, z), P(x - r - 1, 18, z)], C.wood, { sw: 1.3 });
  line([P(x - r - 1, 6, z), P(x + r + 1, 6, z)], { sw: 1 }); line([P(x - r - 1, 13, z), P(x + r + 1, 13, z)], { sw: 1 });
  disc(x, 18, z, r, shade(C.wood, -0.12), { sw: 1.3 });
  rectF(x + 1, 18, 4, 7, z, C.lamp, { sw: 1 }); // a glass left on top
}
function lantern(x, y, { color = C.paper } = {}) {
  const t = P(x, y, Z);
  line([t, [t[0], t[1] + 6]], { sw: 1.2 });
  blob(t[0], t[1] + 15, 8, color, { n: 10, amp: 0.05, sw: 1.3 });
  line([[t[0] - 5, t[1] + 11], [t[0] + 5, t[1] + 11]], { sw: 0.9 }); line([[t[0] - 6, t[1] + 15], [t[0] + 6, t[1] + 15]], { sw: 0.9 }); line([[t[0] - 5, t[1] + 19], [t[0] + 5, t[1] + 19]], { sw: 0.9 });
}
function papelPicado(x, w, y, colors) {
  const a = P(x, y, Z - 2), b = P(x + w, y, Z - 2), n = Math.round(w / 15);
  path(`M${a[0]} ${a[1]}Q${(a[0] + b[0]) / 2} ${a[1] + 10} ${b[0]} ${b[1]}`, { sw: 1.1 });
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t + 10 * 4 * t * (1 - t) * 0.5;
    shape([[px - 5, py], [px + 5, py], [px + 5, py + 9], [px, py + 12], [px - 5, py + 9]], colors[i % colors.length], { sw: 0.9 });
  }
}
function stringLights(from, to, sag = 16) {
  const [a, b] = [from, to], n = 9;
  path(`M${a[0]} ${a[1]}Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 + sag * 2} ${b[0]} ${b[1]}`, { sw: 1.1 });
  for (let i = 1; i < n; i++) {
    const t = i / n, px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t + sag * 4 * t * (1 - t);
    blob(px, py + 4, 2.4, C.lamp, { n: 7, sw: 0.9 });
  }
}
function noren(x, w, y, color) {
  const h = 22, panels = 3, pw = w / panels;
  for (let i = 0; i < panels; i++) rectF(x + i * pw, y - h, pw - 1.5, h, Z - 1, color, { sw: 1.1 });
  const c = P(x + w / 2, y - 12, Z - 1); blob(c[0], c[1], 4, C.paper, { n: 8, sw: 0.9 });
}
// ---- a building --------------------------------------------------------------
function building(b) {
  const { x, w, h, depth: d = 66, wall } = b;
  const flank = shade(wall, 0.16);
  // flank, roof, front
  rectS(x + w, 0, Z, d, h, flank, { hatch: 'hatch', sw: 1.5 });
  rectT(x, Z, w, d, h, shade(wall, -0.05), { sw: 1.5 });
  rectF(x, 0, w, h, Z, wall, { sw: 1.6, hatch: b.brick ? 'brick' : null });
  // parapet rim
  rectT(x + 4, Z + 4, w - 8, d - 8, h, null, { sw: 0.9 });
  b.draw(b);
}

// ---- rooftop clutter (roofY is the roof's height) ---------------------------------
function stairBox(x, z, w, d, h, roofY, fill) {
  shape([P(x, roofY, z), P(x + w, roofY, z), P(x + w, roofY, z + d), P(x, roofY, z + d)].map(([px, py]) => [px, py - h]), shade(fill, -0.06), { sw: 1.2 });
  rectF(x, roofY, w, h, z, fill, { sw: 1.2 });
  rectS(x + w, roofY, z, d, h, shade(fill, 0.18), { hatch: 'hatch', sw: 1.2 });
}
function waterTank(x, z, roofY) {
  const r = 8;
  shape([P(x - r, roofY, z), P(x + r, roofY, z), P(x + r, roofY + 16, z), P(x - r, roofY + 16, z)], C.slat, { sw: 1.2 });
  disc(x, roofY + 16, z, r, shade(C.slat, -0.1), { sw: 1.2 });
  line([P(x - r, roofY + 5, z), P(x + r, roofY + 5, z)], { sw: 0.9 }); line([P(x - r, roofY + 11, z), P(x + r, roofY + 11, z)], { sw: 0.9 });
}
function roofSign(x, w, roofY, label, fill) {
  const h = 26, z = Z + 10;
  line([P(x + 6, roofY, z), P(x + 6, roofY + 8, z)], { sw: 1.6 }); line([P(x + w - 6, roofY, z), P(x + w - 6, roofY + 8, z)], { sw: 1.6 });
  rectF(x, roofY + 8, w, h, z, fill, { sw: 1.4 });
  const c = P(x + w / 2, roofY + 8 + h / 2 - 7, z); text(c[0], c[1], label, { size: 19, fill: C.paper });
}

// ---- the street ---------------------------------------------------------------
const buildings = [
  // ---- the left bleed: ramen bar, gelateria, wine bar ----
  { x: -640, w: 190, h: 158, wall: C.bone, draw(b) {
    fascia(b.x + 10, 70, b.w - 20, 22, INK, 'RAMEN', { size: 17, textFill: C.paper });
    sill(b.x + 14, 0, 100, 12, C.woodDark); shopWindow(b.x + 14, 12, 100, 50, { mullions: 3 });
    door(b.x + 130, 42, 64, C.woodDark, { glass: false });
    noren(b.x + 126, 50, 64, C.accent);
    lantern(b.x + 8, 92, { color: C.accent }); lantern(b.x + 122, 92, { color: C.accent });
    upperWindow(b.x + 26, 106, 28, 32, { shutters: C.woodDark }); upperWindow(b.x + 136, 106, 28, 32, { shutters: C.woodDark });
    rectF(b.x + 76, 106, 38, 36, Z, C.glass, { sw: 1.2 }); line([P(b.x + 95, 106, Z), P(b.x + 95, 142, Z)], { sw: 1.1 });
    stairBox(b.x + 110, Z + 26, 40, 24, 18, b.h, shade(C.bone, -0.02));
  } },
  { x: -450, w: 150, h: 104, wall: '#F3CFD3', draw(b) {
    fascia(b.x + 8, 70, b.w - 16, 22, C.paper, 'GELATO', { size: 16 });
    door(b.x + 12, 38, 62, '#7F9CBF');
    sill(b.x + 62, 0, 76, 12, shade('#F3CFD3', 0.18)); shopWindow(b.x + 62, 12, 76, 50, { mullions: 1 });
    awning(b.x + 56, b.w - 62, 66, ['#E8A4B8', C.paper], { reach: 16 });
    // an ice-cream cone on a bracket
    const s = P(b.x + 146, 94, Z); line([s, [s[0] + 3, s[1]], [s[0] + 3, s[1] + 6]], { sw: 1.4 });
    blob(s[0] + 3, s[1] + 12, 6, '#E8A4B8', { n: 9, sw: 1.1 }); shape([[s[0] - 2, s[1] + 16], [s[0] + 8, s[1] + 16], [s[0] + 3, s[1] + 28]], C.mustard, { sw: 1 });
    waterTank(b.x + 120, Z + 34, b.h);
  } },
  // a narrow alley, then the wine bar
  { x: -288, w: 248, h: 162, wall: '#D9B5A7', draw(b) {
    fascia(b.x + 10, 72, b.w - 20, 22, '#5A2E3A', 'VINO', { size: 18, textFill: C.paper });
    door(b.x + 104, 40, 66, '#5A2E3A', { arch: true });
    sill(b.x + 14, 0, 76, 12, shade('#D9B5A7', 0.2)); shopWindow(b.x + 14, 12, 76, 50, { transom: true });
    sill(b.x + 158, 0, 76, 12, shade('#D9B5A7', 0.2)); shopWindow(b.x + 158, 12, 76, 50, { transom: true });
    awning(b.x + 8, 88, 66, ['#5A2E3A', C.paper], { reach: 14 }); awning(b.x + 152, 88, 66, ['#5A2E3A', C.paper], { reach: 14 });
    upperWindow(b.x + 30, 108, 26, 36, { shutters: '#5A2E3A', box: true });
    upperWindow(b.x + 111, 108, 26, 36, { shutters: '#5A2E3A' });
    upperWindow(b.x + 192, 108, 26, 36, { shutters: '#5A2E3A', box: true });
    stairBox(b.x + 170, Z + 24, 44, 24, 20, b.h, shade('#D9B5A7', -0.02));
  } },
  // ---- the eight venues in the middle ----
  { x: -40, w: 210, h: 150, wall: C.sage, draw(b) {
    fascia(b.x + 8, 70, b.w - 16, 22, C.paper, 'BRUNCH');
    sill(b.x + 14, 0, 70, 12, shade(C.sage, 0.2)); shopWindow(b.x + 14, 12, 70, 50, { mullions: 2, transom: true });
    door(b.x + 96, 44, 64, C.woodDark);
    sill(b.x + 128, 0, 68, 12, shade(C.sage, 0.2)); shopWindow(b.x + 128, 12, 68, 50, { mullions: 1, transom: true });
    awning(b.x + 8, b.w - 16, 66, [C.brand, C.paper]);
    upperWindow(b.x + 30, 104, 26, 30, { box: true });
    upperWindow(b.x + 92, 104, 26, 30, { box: true });
    upperWindow(b.x + 154, 104, 26, 30, { box: true });
    waterTank(b.x + 150, Z + 36, b.h);
  } },
  { x: 170, w: 160, h: 108, wall: C.terracotta, draw(b) {
    fascia(b.x + 8, 72, b.w - 16, 22, C.cream, 'CAFÉ', { size: 18 });
    door(b.x + 12, 40, 64, C.green, { arch: true });
    sill(b.x + 64, 0, 84, 12, shade(C.terracotta, 0.22)); shopWindow(b.x + 64, 12, 84, 50, { mullions: 2 });
    awning(b.x + 56, b.w - 64, 66, [C.paper, C.accent], { reach: 18 });
    lantern(b.x + 6, 90);
    // a cup on a bracket sign
    const s = P(b.x + 148, 96, Z); line([s, [s[0] + 2, s[1]], [s[0] + 2, s[1] + 8]], { sw: 1.4 });
    blob(s[0] + 2, s[1] + 14, 7, C.paper, { n: 9, sw: 1.2 }); path(`M${s[0] - 1} ${s[1] + 12}h6v5q0 3 -3 3q-3 0 -3 -3Z`, { fill: C.accent, sw: 0.9 });
    stairBox(b.x + 96, Z + 26, 36, 22, 18, b.h, C.cream);
  } },
  { x: 330, w: 185, h: 160, wall: C.mustard, draw(b) {
    fascia(b.x + 10, 70, b.w - 20, 24, C.accent, 'TACOS', { size: 19, textFill: C.paper });
    sill(b.x + 14, 0, 96, 12, shade(C.mustard, 0.25)); shopWindow(b.x + 14, 12, 96, 50, { mullions: 2 });
    door(b.x + 126, 42, 64, C.indigo);
    // a counter hatch window with a little shelf
    rectT(b.x + 14, Z - 8, 96, 8, 12, shade(C.mustard, 0.25), { sw: 1.1 });
    upperWindow(b.x + 28, 106, 26, 32, { shutters: C.indigo });
    upperWindow(b.x + 80, 106, 26, 32, { shutters: C.indigo });
    upperWindow(b.x + 132, 106, 26, 32, { shutters: C.indigo });
    papelPicado(b.x + 6, b.w - 12, 152, ['#E8A4B8', C.brand, '#7F9CBF', '#F2C94C', C.leaf]);
    stairBox(b.x + 20, Z + 20, 40, 26, 20, b.h, shade(C.mustard, -0.02));
  } },
  { x: 515, w: 185, h: 166, wall: C.plaster, draw(b) {
    fascia(b.x + 10, 72, b.w - 20, 22, C.chalk, 'BISTRO', { size: 17, textFill: C.paper });
    door(b.x + 76, 40, 66, C.green, { glass: true });
    sill(b.x + 12, 0, 56, 12, shade(C.plaster, 0.2)); shopWindow(b.x + 12, 12, 56, 50, { transom: true });
    sill(b.x + 124, 0, 50, 12, shade(C.plaster, 0.2)); shopWindow(b.x + 124, 12, 50, 50, { transom: true });
    awning(b.x + 8, 64, 66, [C.green, C.paper], { reach: 14 });
    awning(b.x + 120, 58, 66, [C.green, C.paper], { reach: 14 });
    upperWindow(b.x + 24, 110, 26, 36, { shutters: C.green });
    upperWindow(b.x + 136, 110, 26, 36, { shutters: C.green });
    rectF(b.x + 76, 106, 40, 44, Z, C.glass, { sw: 1.2 }); line([P(b.x + 96, 106, Z), P(b.x + 96, 150, Z)], { sw: 1.1 });
    balcony(b.x + 68, 56, 106);
    waterTank(b.x + 160, Z + 34, b.h);
  } },
  // a narrow alley before the bar
  { x: 712, w: 150, h: 126, wall: C.brick, brick: true, draw(b) {
    fascia(b.x + 8, 76, b.w - 16, 22, INK, 'BAR', { size: 18, textFill: C.lamp });
    door(b.x + 14, 40, 64, C.woodDark, { glass: false });
    sill(b.x + 66, 0, 70, 12, shade(C.brick, 0.25)); shopWindow(b.x + 66, 12, 70, 46, { mullions: 1 });
    // a round hanging sign on a bracket
    const s = P(b.x + 142, 104, Z); line([s, [s[0] + 4, s[1]], [s[0] + 4, s[1] + 6]], { sw: 1.4 });
    blob(s[0] + 4, s[1] + 16, 10, C.lamp, { n: 11, amp: 0.04, sw: 1.3 });
    path(`M${s[0] + 1} ${s[1] + 12}h6l-1 9h-4Z`, { fill: C.brand, sw: 0.9 }); // a beer
    lantern(b.x + 8, 100, { color: C.lamp });
    // a barrel-top shelf under the window
    rectT(b.x + 66, Z - 7, 70, 7, 12, shade(C.woodDark, 0.1), { sw: 1.1 });
    stairBox(b.x + 90, Z + 30, 36, 20, 16, b.h, shade(C.brick, 0.05));
  } },
  { x: 862, w: 205, h: 172, wall: C.blue, draw(b) {
    fascia(b.x + 10, 74, b.w - 20, 22, C.indigo, 'LOUNGE', { size: 17, textFill: C.paper, });
    door(b.x + 82, 42, 68, shade(C.indigo, 0.25), { arch: true });
    upperWindow(b.x + 18, 10, 46, 56, { arch: true }); upperWindow(b.x + 142, 10, 46, 56, { arch: true });
    sill(b.x + 18, 0, 46, 10, shade(C.blue, 0.22)); sill(b.x + 142, 0, 46, 10, shade(C.blue, 0.22));
    lantern(b.x + 72, 84); lantern(b.x + 134, 84);
    upperWindow(b.x + 24, 112, 24, 40, { arch: true }); upperWindow(b.x + 66, 112, 24, 40, { arch: true });
    upperWindow(b.x + 116, 112, 24, 40, { arch: true }); upperWindow(b.x + 158, 112, 24, 40, { arch: true });
    line([P(b.x, 104, Z), P(b.x + b.w, 104, Z)], { sw: 1.6 }); // a string course
    stairBox(b.x + 130, Z + 22, 44, 26, 22, b.h, shade(C.blue, -0.02));
  } },
  // another alley before the pizzeria
  { x: 1079, w: 175, h: 112, wall: C.peach, draw(b) {
    fascia(b.x + 10, 72, b.w - 20, 22, C.paper, 'FORNO', { size: 16 });
    door(b.x + 118, 42, 64, C.accent);
    sill(b.x + 12, 0, 94, 12, shade(C.peach, 0.2)); shopWindow(b.x + 12, 12, 94, 50, { mullions: 2 });
    awning(b.x + 6, 104, 66, [C.accent, C.paper], { reach: 18 });
    // a wood-fired oven chimney
    rectF(b.x + 140, b.h, 12, 20, Z + 30, C.brick, { hatch: 'brick', sw: 1.2 });
    const c = P(b.x + 146, b.h + 24, Z + 30); for (let i = 0; i < 3; i++) blob(c[0] + i * 5, c[1] - i * 9, 4 + i * 1.5, C.paper, { stroke: shade(C.paper, 0.3), sw: 0.8, n: 9, seed: i });
    roofSign(b.x + 18, 112, b.h, 'PIZZA', C.accent);
  } },
  { x: 1254, w: 250, h: 156, wall: C.bone, draw(b) {
    // wood slats on the ground floor
    for (let i = 0; i < 26; i++) line([P(b.x + 6 + i * 9.4, 2, Z), P(b.x + 6 + i * 9.4, 66, Z)], { stroke: C.slat, sw: 2 });
    fascia(b.x + 10, 70, b.w - 20, 22, C.woodDark, 'SUSHI', { size: 17, textFill: C.paper });
    sill(b.x + 16, 0, 90, 12, C.woodDark); shopWindow(b.x + 16, 12, 90, 50, { mullions: 3 });
    door(b.x + 126, 44, 66, C.woodDark, { glass: false });
    noren(b.x + 122, 52, 66, C.indigo);
    lantern(b.x + 190, 86, { color: C.brand }); lantern(b.x + 214, 86, { color: C.brand });
    upperWindow(b.x + 30, 104, 30, 32, { shutters: C.woodDark });
    upperWindow(b.x + 110, 104, 30, 32, { shutters: C.woodDark });
    upperWindow(b.x + 190, 104, 30, 32, { shutters: C.woodDark });
    stairBox(b.x + 40, Z + 24, 44, 24, 20, b.h, shade(C.bone, -0.02));
  } },
  // ---- the right bleed: tapas bar, burger joint, cantina ----
  { x: 1504, w: 180, h: 112, wall: C.terracotta, draw(b) {
    fascia(b.x + 10, 72, b.w - 20, 22, C.cream, 'TAPAS', { size: 17 });
    door(b.x + 14, 40, 64, C.green);
    sill(b.x + 66, 0, 100, 12, shade(C.terracotta, 0.22)); shopWindow(b.x + 66, 12, 100, 50, { mullions: 2 });
    awning(b.x + 60, b.w - 66, 66, [C.mustard, C.paper], { reach: 18 });
    lantern(b.x + 8, 90);
    stairBox(b.x + 100, Z + 28, 40, 22, 18, b.h, C.cream);
  } },
  // a narrow alley, then the burger joint
  { x: 1696, w: 160, h: 108, wall: C.plaster, draw(b) {
    fascia(b.x + 8, 70, b.w - 16, 22, C.accent, 'BURGER', { size: 16, textFill: C.paper });
    sill(b.x + 12, 0, 88, 12, shade(C.plaster, 0.2)); shopWindow(b.x + 12, 12, 88, 50, { mullions: 2 });
    door(b.x + 110, 40, 64, C.accent);
    awning(b.x + 6, 100, 66, [C.accent, C.paper], { reach: 18 });
    rectT(b.x + 12, Z - 8, 88, 8, 12, shade(C.plaster, 0.2), { sw: 1.1 });
    roofSign(b.x + 24, 112, b.h, 'BURGER', INK);
  } },
  { x: 1856, w: 240, h: 160, wall: C.mustard, draw(b) {
    fascia(b.x + 10, 72, b.w - 20, 22, C.chalk, 'CANTINA', { size: 17, textFill: C.paper });
    door(b.x + 100, 40, 66, C.woodDark, { arch: true });
    sill(b.x + 14, 0, 72, 12, shade(C.mustard, 0.25)); shopWindow(b.x + 14, 12, 72, 50, { transom: true });
    sill(b.x + 154, 0, 72, 12, shade(C.mustard, 0.25)); shopWindow(b.x + 154, 12, 72, 50, { transom: true });
    upperWindow(b.x + 28, 108, 26, 36, { shutters: C.chalk }); upperWindow(b.x + 107, 108, 26, 36, { shutters: C.chalk }); upperWindow(b.x + 186, 108, 26, 36, { shutters: C.chalk });
    balcony(b.x + 96, 48, 104);
    papelPicado(b.x + 6, b.w - 12, 152, [C.brand, '#7F9CBF', '#F2C94C', '#E8A4B8', C.leaf]);
    waterTank(b.x + 210, Z + 36, b.h);
  } },
];

// ---- compose -------------------------------------------------------------------
// road and kerb; the road dissolves into the ground of the section below
emit(`<rect x="${X0 - 40}" y="${KERB_Y}" width="${W + 80}" height="${H - KERB_Y}" fill="url(#road)"/>`);
emit(`<line x1="${X0 - 40}" y1="${KERB_Y + 3}" x2="${X1 + 40}" y2="${KERB_Y + 3}" stroke="${C.kerb}" stroke-width="5"/>`);
emit(`<line x1="${X0 - 40}" y1="${KERB_Y + 1}" x2="${X1 + 40}" y2="${KERB_Y + 1}" stroke="${INK}" stroke-width="1.4"/>`);
emit(`<line x1="${X0 - 40}" y1="${H - 22}" x2="${X1 + 40}" y2="${H - 22}" stroke="${C.roadLine}" stroke-width="3" stroke-dasharray="26 22"/>`);
// pavement
shape([P(X0 - 80, 0, 0), P(X1 + 40, 0, 0), P(X1 + 40, 0, Z), P(X0 - 80, 0, Z)], C.pavement, { stroke: null, noOffset: true });
for (let x = X0 - 60; x < X1 + 60; x += 40) line([P(x, 0, 0), P(x, 0, Z)], { stroke: C.slab, sw: 1 });
for (let z = 11; z < Z; z += 11) line([P(X0 - 80, 0, z), P(X1 + 40, 0, z)], { stroke: C.slab, sw: 1 });
// a thin shadow line where the fronts meet the pavement
line([P(X0 - 80, 0, Z), P(X1 + 40, 0, Z)], { stroke: INK, sw: 1.4 });

for (const b of buildings) building(b);

// the pavement in front, back to front. Trees stand on the boundaries between
// venues so their crowns never cover a sign.
stringLights(P(856, 118, Z), P(1058, 120, Z), 14);
planter(540, 24, 20); planter(664, 24, 20);
planter(874, 20, 26, { tall: true }); planter(1024, 20, 26, { tall: true });
aFrame(1084, 22, 'MENU');
aFrame(588, 18, 'MENU');
lamppost(170, 10); lamppost(862, 10);
tree(322, 20, { r: 24, trunk: 38 }); tree(706, 18, { r: 26, trunk: 40 });
tree(1073, 18, { r: 25, trunk: 40 }); tree(1254, 20, { r: 24, trunk: 40 });
parasol(214, 24);
table(214, 22, { chairs: [Math.PI * 0.9, Math.PI * 0.1] });
seated(203, 30, 1, { shirt: C.accent }); seated(226, 30, -1, { shirt: '#7F9CBF', skin: C.skin2, hair: C.hair });
table(276, 24, { chairs: [Math.PI * 1.05, Math.PI * 0.05] });
seated(289, 32, -1, { shirt: C.green, skin: C.skin2 });
barrel(772, 18); barrel(824, 16);
seated(760, 28, 1, { shirt: C.hairDark, hair: C.hair }); seated(837, 26, -1, { shirt: C.indigo });
table(1160, 22, { r: 10, chairs: [Math.PI * 1.1] });
seated(1148, 29, 1, { shirt: C.brand, skin: C.skin2 });
table(1384, 22, { r: 10, chairs: [Math.PI * 0.95, Math.PI * 0.05] });
seated(1373, 30, 1, { shirt: C.indigo }); seated(1396, 30, -1, { shirt: '#E8A4B8', hair: C.hair });
// the left bleed
tree(-452, 20, { r: 24, trunk: 40 }); tree(-294, 18, { r: 26, trunk: 40 });
lamppost(-640, 10);
planter(-270, 22, 22); planter(-56, 22, 22);
table(-560, 22, { r: 10, chairs: [Math.PI * 0.95, Math.PI * 0.05] });
seated(-571, 30, 1, { shirt: C.green, skin: C.skin2 }); seated(-548, 30, -1, { shirt: C.indigo, hair: C.hair });
barrel(-200, 18); seated(-212, 28, 1, { shirt: '#5A2E3A' });
table(-120, 24, { r: 11, chairs: [Math.PI * 1.05] }); seated(-107, 32, -1, { shirt: C.accent, skin: C.skin2 });
// the right bleed
tree(1690, 18, { r: 25, trunk: 40 }); tree(1856, 20, { r: 24, trunk: 40 });
lamppost(1504, 10);
aFrame(1740, 22, 'MENU');
table(1600, 22, { r: 10, chairs: [Math.PI * 0.9, Math.PI * 0.1] });
seated(1589, 30, 1, { shirt: C.indigo }); seated(1612, 30, -1, { shirt: C.brand, skin: C.skin2, hair: C.hair });
parasol(1960, 24, { colors: [C.green, C.paper] });
table(1960, 22, { chairs: [Math.PI * 0.9, Math.PI * 0.1] });
seated(1949, 30, 1, { shirt: '#7F9CBF', skin: C.skin2 }); seated(1972, 30, -1, { shirt: C.accent });
table(2040, 24, { r: 10, chairs: [Math.PI * 1.05] }); seated(2053, 32, -1, { shirt: C.green, hair: C.hair });

// Decorative in the page: StreetScene.astro wraps it in a labelled role="img".
// "slice" makes it a cover image: give it a height and a width in CSS and it
// keeps its scale from the height, centred, cropped on both sides.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${X0} 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<defs>
  <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="${C.road}"/><stop offset="1" stop-color="#F4EEE6"/></linearGradient>
  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="0.9" opacity="0.28"/></pattern>
  <pattern id="hatchFine" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="${INK}" stroke-width="0.7" opacity="0.3"/></pattern>
  <pattern id="brick" width="22" height="12" patternUnits="userSpaceOnUse"><g stroke="${INK}" stroke-width="0.8" opacity="0.32" fill="none"><line x1="0" y1="6" x2="22" y2="6"/><line x1="0" y1="12" x2="22" y2="12"/><line x1="11" y1="0" x2="11" y2="6"/><line x1="0" y1="6" x2="0" y2="12"/></g></pattern>
  <filter id="wobble" x="-2%" y="-5%" width="104%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>
</defs>
<g filter="url(#wobble)" stroke-linejoin="round" stroke-linecap="round">
${out.join('\n')}
</g>
</svg>
`;
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`wrote ${OUT} (${(svg.length / 1024).toFixed(1)} KB)`);
