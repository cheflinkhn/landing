#!/usr/bin/env node
// Builds the two people drawn around the hero video, in the street scene's
// hand-drawn style (scripts/street-scene/build.mjs: same ink, palette, fills
// printed a hair off their outlines, hatching and a wobble filter):
//
//   chef.svg     a chef peeking over the video's top edge, fingers over it
//   manager.svg  a manager leaning out from behind the video's left edge near
//                its top, one hand gripping the edge
//
//   node scripts/hero-figures/build.mjs
//
// Writes public/assets/img/hero/, served as plain <img>s (decorative, so they
// carry no ids into the page and cache on their own). Drawing is in screen
// space, one unit = one CSS px at the size the hero shows them.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/assets/img/hero');

// ---- palette (from the street scene) ----------------------------------------
const INK = '#3A2E25';
const C = {
  paper: '#FFFDF8', cream: '#F6ECDC', bone: '#EFE5D3',
  wood: '#9C6A45', woodDark: '#7A4E31', mustard: '#EACD86', terracotta: '#E2A585',
  brand: '#F97216', accent: '#C2410C', indigo: '#4F6D8F',
  skin: '#F0C8A0', skin2: '#C98B5E', hairDark: '#3A2A1E', hair: '#A05A2C',
};
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 - k))));
  return `#${((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
};
const r1 = (n) => Math.round(n * 10) / 10;

// ---- primitives --------------------------------------------------------------
function canvas() {
  const out = [];
  const OFF = [1.5, 1.1]; // fills sit a hair off their lines, like loose colouring
  const emit = (s) => out.push(s);
  const path = (d, { fill = 'none', stroke = INK, sw = 1.8, hatch = null, offset = true } = {}) => {
    const t = offset ? ` transform="translate(${OFF[0]} ${OFF[1]})"` : '';
    if (fill !== 'none') {
      emit(`<path d="${d}" fill="${fill}"${t}/>`);
      if (hatch) emit(`<path d="${d}" fill="url(#${hatch})"${t}/>`);
    }
    if (stroke) emit(`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`);
  };
  // A slightly irregular ellipse, as a smooth closed curve (Catmull-Rom through
  // jittered points, so it reads hand-drawn rather than faceted).
  const oval = (cx, cy, rx, ry, fill, { n = 12, amp = 0.04, seed = 0, ...o } = {}) => {
    const p = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, k = 1 + amp * Math.sin(i * 2.7 + seed);
      p.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
    }
    const at = (i) => p[(i + n) % n];
    let d = `M${r1(p[0][0])} ${r1(p[0][1])}`;
    for (let i = 0; i < n; i++) {
      const [a, b, c, e] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
      d += `C${r1(b[0] + (c[0] - a[0]) / 6)} ${r1(b[1] + (c[1] - a[1]) / 6)} ${r1(c[0] - (e[0] - b[0]) / 6)} ${r1(c[1] - (e[1] - b[1]) / 6)} ${r1(c[0])} ${r1(c[1])}`;
    }
    path(d + 'Z', { fill, ...o });
  };
  const dot = (cx, cy, r, fill = INK) => emit(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`);
  return { out, emit, path, oval, dot };
}

function svg(w, h, body, { defs = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
  <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${INK}" stroke-width="0.8" opacity="0.28"/></pattern>
  <filter id="wobble" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter>
  ${defs}
</defs>
<g filter="url(#wobble)" stroke-linejoin="round" stroke-linecap="round">
${body}
</g>
</svg>
`;
}

// ---- the chef ----------------------------------------------------------------
// Peeking over an edge at y = EDGE: everything above it is cut at the edge (the
// rest of the chef is behind the screen), the fingers hang over it.
const CHEF_W = 150, CHEF_H = 112, EDGE = 98;
function chef() {
  const behind = canvas();
  const { path, oval, dot } = behind;
  const cx = 75;

  // toque: three puffs, then the band over their bottoms
  oval(cx - 22, 42, 17, 16, C.paper, { seed: 1 });
  oval(cx + 22, 42, 17, 16, C.paper, { seed: 2 });
  oval(cx, 31, 21, 19, C.paper, { seed: 3 });
  path(`M${cx - 15} 44q2 8 0 14M${cx + 15} 44q-2 8 0 14`, { sw: 1.2 });

  // ears, head, hair at the temples
  oval(cx - 24, 86, 5, 6.5, C.skin, { n: 10, seed: 4 });
  oval(cx + 24, 86, 5, 6.5, C.skin, { n: 10, seed: 5 });
  oval(cx, 92, 24, 27, C.skin, { seed: 6 });
  path(`M${cx - 22} 70q-2 7 0 13q2 -1 3 -4q-1 -5 0 -9Z`, { fill: C.hair, sw: 1.2 });
  path(`M${cx + 22} 70q2 7 0 13q-2 -1 -3 -4q1 -5 0 -9Z`, { fill: C.hair, sw: 1.2 });

  // band
  path(`M${cx - 27} 56q27 -6 54 0l-2 15q-25 -4 -50 0Z`, { fill: C.paper, hatch: 'hatch' });

  // face: brows, eyes looking down and left into the screen below (whites, so
  // the pupils' direction reads), rosy cheeks, the nose
  path(`M${cx - 13} 79q5 -3 9 0M${cx + 4} 79q5 -3 9 0`, { sw: 1.6 });
  for (const ex of [cx - 8, cx + 8]) {
    oval(ex, 86, 4, 3.6, C.paper, { n: 10, sw: 1.2, offset: false });
    dot(ex - 1.5, 87.6, 2);
    dot(ex - 2.1, 87, 0.6, C.paper);
  }
  oval(cx - 14, 94, 4.5, 3, 'rgba(226,120,90,0.35)', { stroke: null, offset: false, n: 10 });
  oval(cx + 14, 94, 4.5, 3, 'rgba(226,120,90,0.35)', { stroke: null, offset: false, n: 10 });
  path(`M${cx - 1} 88q4 5 1 8`, { sw: 1.5 });

  const front = canvas();
  // hands gripping the edge: the back of the hand above it, four fingers over it
  for (const [hx, s] of [[cx - 42, 7], [cx + 42, 8]]) {
    front.oval(hx, EDGE - 3, 12, 6, C.skin, { n: 12, seed: s });
    for (let i = 0; i < 4; i++) front.oval(hx - 8.4 + i * 5.6, EDGE + 3, 2.9, 5.6, C.skin, { n: 10, seed: s + i, sw: 1.4 });
  }

  const body = `<g clip-path="url(#above)">\n${behind.out.join('\n')}\n</g>\n${front.out.join('\n')}`;
  return svg(CHEF_W, CHEF_H, body, { defs: `<clipPath id="above"><rect x="0" y="0" width="${CHEF_W}" height="${EDGE}"/></clipPath>` });
}

// ---- the manager -------------------------------------------------------------
// Leaning out from behind a vertical edge at x = SIDE: the figure is drawn
// upright with its body centred behind the edge, then tilted out around its
// hips, so the head and a shoulder clear the edge while the torso slopes back
// behind it (no cut-off bottom). Everything right of the edge is hidden; the
// fingers wrap over it.
const MAN_W = 100, MAN_H = 150, SIDE = 60;
const LEAN = -24, HIP = [86, 150], NECK = [86, 52];
function manager() {
  const behind = canvas();
  const { path, oval, dot, emit } = behind;
  const cx = HIP[0];
  const suit = C.indigo;

  emit(`<g transform="rotate(${LEAN} ${HIP[0]} ${HIP[1]})">`);
  // blazer, shirt, tie, lapels
  path(`M${cx - 22} 66q22 -9 44 0l2 84l-38 0Z`, { fill: suit });
  path(`M${cx - 7} 61l7 17l7 -17Z`, { fill: C.paper, sw: 1.4 });
  path(`M${cx - 3} 63l6 0l-1 5l3 20l-5 6l-5 -6l3 -20Z`, { fill: C.accent, sw: 1.3 });
  path(`M${cx - 7} 61l5 26M${cx + 7} 61l-5 26`, { sw: 1.4 });
  path(`M${cx - 4} 50l8 0l0 11l-8 0Z`, { fill: C.skin, sw: 1.4 });
  // the head tips back a little towards upright
  emit(`<g transform="rotate(5 ${NECK[0]} ${NECK[1]})">`);
  oval(cx, 32, 17, 18, C.hairDark, { seed: 5, sw: 1.6 });
  oval(cx - 15, 38, 4.5, 6, C.skin, { n: 10, seed: 7 });
  oval(cx, 36, 14.5, 16, C.skin, { seed: 6 });
  path(`M${cx - 15} 31q2 -14 15 -14q13 0 15 14q-8 -6 -16 -7q-5 4 -14 7Z`, { fill: C.hairDark, sw: 1.4 });
  // glasses, eyes looking right at the screen, a smile
  oval(cx - 5.5, 37, 4.4, 4, 'rgba(255,253,248,0.35)', { n: 10, sw: 1.2, offset: false });
  oval(cx + 5.5, 37, 4.4, 4, 'rgba(255,253,248,0.35)', { n: 10, sw: 1.2, offset: false });
  path(`M${cx - 1.1} 37l2.2 0`, { sw: 1.1 });
  dot(cx - 4, 37.6, 1.5); dot(cx + 7, 37.6, 1.5);
  path(`M${cx - 3} 45q4 3.5 8 0`, { sw: 1.4 });
  emit('</g></g>');

  // the near arm, from the tilted shoulder down to the edge, and the back of the hand
  path(`M26 88q5 -7 12 -4q8 16 18 28q-3 7 -10 6q-12 -13 -20 -30Z`, { fill: shade(suit, 0.1) });
  path(`M33 92q6 12 14 21`, { sw: 1.1 });
  oval(SIDE - 5, 116, 6.5, 7.5, C.skin, { n: 10, seed: 8 });

  const front = canvas();
  for (let i = 0; i < 4; i++) front.oval(SIDE + 2, 109.5 + i * 4.6, 5.4, 2.6, C.skin, { n: 10, seed: 9 + i, sw: 1.4 });

  const body = `<g clip-path="url(#beside)">\n${behind.out.join('\n')}\n</g>\n${front.out.join('\n')}`;
  return svg(MAN_W, MAN_H, body, { defs: `<clipPath id="beside"><rect x="0" y="0" width="${SIDE}" height="${MAN_H}"/></clipPath>` });
}

mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'chef.svg'), chef());
writeFileSync(resolve(OUT, 'manager.svg'), manager());
console.log(`Wrote chef.svg and manager.svg to ${OUT}`);
