// Pixel-art businesses in service, along the hero's floor. One scene is picked
// at random on every page load (`?scene=<name>` forces one).
//
// Style (after a ¾ top-down RPG interior): the back wall head-on, the floor as
// a tilted plane, every object with a lit top face, a darker front face and a
// 1px dark-brown outline; flat fills, one highlight, one shadow, no dithering;
// a small warm palette with the brand orange as the accent.
//
// Every scene is 80 logical px tall, drawn at 3–4× with image-rendering:
// pixelated at 12 frames per second; prefers-reduced-motion draws one frame.
// A scene is { label, drawStatic(), frame(t, f) } and uses the shared helpers
// (people, tables, cups) so the businesses look like they belong together.
//
// House rules: no venue name signs, no entrance doors, no takeaway or couriers,
// no pets, plain counter fronts, sparse décor; staff animate at ~1 Hz.
(function () {
  const canvas = document.querySelector("[data-pixel-scene]");
  if (!canvas) return;
  const main = canvas.getContext("2d");
  let ctx = main; // primitives draw here; the static pass points it at a cache

  const P = {
    out: "#3B2314", dark: "#2A1E16", trim: "#4A2A17",
    wall: "#855433", wallSeam: "#724628", wallHi: "#8E5B39",
    wood: "#7A4A2A", woodMid: "#8A5A3A", woodLight: "#A87A4C", woodPale: "#C9955A", woodHi: "#DDB078",
    floorA: "#CBAA74", floorB: "#C2A069", floorSeam: "#A88B5C",
    stucco: "#EBDCBD", stuccoHi: "#F5EAD2", stuccoLo: "#D9C6A3", terracotta: "#C97B4A", terracottaLo: "#A8653B",
    tileA: "#D6B78E", tileB: "#D1B286", tileSeam: "#C5A67B", stone: "#A39A8B", stoneHi: "#C2B9A9", stoneLo: "#7F776A",
    water: "#6FA8C9", waterHi: "#A9D3E8", hedge: "#4E7A3F", hedgeHi: "#6FA35A", iron: "#3A3530",
    cream: "#F2E4C8", white: "#FFF8EC", paper: "#FFFDF8",
    green: "#3E6B3A", greenLight: "#5B8C4A", leaf: "#6FA35A", board: "#355C33",
    orange: "#E8762A", brand: "#C2410C", red: "#B8402C", pink: "#E8A4B8", yellow: "#F2C94C", lemon: "#F0D44A",
    steel: "#8C8C8C", steelHi: "#BDBDBD", blue: "#4F6D8F", blueLight: "#7F9CBF", coffee: "#4A2A17",
    skin1: "#F0C8A0", skin2: "#D09A66", skin3: "#8D5A3A", hair1: "#3A2A1E", hair2: "#1F1611", hair3: "#A05A2C", hair4: "#D8B36B",
  };

  const H = 80;
  let W = 320, scale = 4, cx = 160;
  let still = null;
  const lang = (document.documentElement.lang || "es").slice(0, 2);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- primitives ----------------------------------------------------------
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  function boxO(x, y, w, h, fill, hi, lo) {
    px(x - 1, y - 1, w + 2, h + 2, P.out); px(x, y, w, h, fill);
    if (hi) px(x, y, w, 1, hi); if (lo) px(x, y + h - 1, w, 1, lo);
  }
  function lump(x, y, r, c) { ctx.fillStyle = c; for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r * 0.6) ctx.fillRect(Math.round(x + xx), Math.round(y + yy), 1, 1); }
  function lumpO(x, y, r, c) { lump(x, y, r + 1, P.out); lump(x, y, r, c); }
  function ellipse(x, y, rx, ry, c) { ctx.fillStyle = c; for (let yy = -ry; yy <= ry; yy++) { const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry + 0.5)))); ctx.fillRect(Math.round(x - hw), Math.round(y + yy), hw * 2 + 1, 1); } }
  function shape(x, y, rects) {
    rects.forEach((r) => px(x + r[0] - 1, y + r[1] - 1, r[2] + 2, r[3] + 2, P.out));
    rects.forEach((r) => px(x + r[0], y + r[1], r[2], r[3], r[4]));
  }
  const FONT = {
    A: ["010", "101", "111", "101", "101"], C: ["011", "100", "100", "100", "011"], E: ["111", "100", "110", "100", "111"],
    F: ["111", "100", "110", "100", "100"], L: ["100", "100", "100", "100", "111"], M: ["101", "111", "111", "101", "101"],
    N: ["110", "101", "101", "101", "101"], O: ["010", "101", "101", "101", "010"], R: ["110", "101", "110", "101", "101"],
    S: ["011", "100", "010", "001", "110"], U: ["101", "101", "101", "101", "111"], " ": ["000", "000", "000", "000", "000"],
    D: ["110", "101", "101", "101", "110"], I: ["111", "010", "010", "010", "111"], P: ["110", "101", "110", "100", "100"],
  };
  function text(x, y, str, c) { let dx = 0; for (const ch of str) { const g = FONT[ch]; if (g) g.forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === "1") px(x + dx + i, y + j, 1, 1, c); }); dx += 4; } }
  const textWidth = (s) => s.length * 4 - 1;

  // ---- people --------------------------------------------------------------
  // Hand-pixelled 10×16 sprites (down / up / left; right is the mirror) with a
  // light from the upper left: lower-case = lit, upper-case = shadow. The
  // silhouette gets a 1px outline, feet get a soft shadow on the floor.
  //   h hair  s skin  e eye  c shirt  p pants  b boots
  const SPR = {
    down: ["...hhhh...", "..hhhhhh..", ".hhhhhhhh.", ".hhsssshh.", ".hssssssH.", ".ssessesS.", "..ssssSS..", "..cccccc..", ".cccccccC.", ".cccccccC.", "scccccccCs", ".CCCCCCCC."],
    up:   ["...hhhh...", "..hhhhhh..", ".hhhhhhhh.", ".hhhhhhhH.", ".hhhhhhhH.", ".hhhhhhhH.", "..ssssSS..", "..cccccc..", ".cccccccC.", ".cccccccC.", "scccccccCs", ".CCCCCCCC."],
    left: ["...hhhh...", "..hhhhhh..", ".hhhhhhhh.", ".sshhhhhh.", ".ssshhhhH.", ".sesshhhH.", "..ssssS...", "..cccccc..", ".cccccccC.", "sccccccCC.", "sccccccCC.", ".CCCCCCC.."],
  };
  const LEGS = {
    stand: ["..pppPPP..", "..pp..PP..", "..pp..PP..", "..bb..bb.."],
    a:     ["..pppPPP..", "..pp.PP...", ".pp...PP..", ".bb....bb."],
    b:     ["..pppPPP..", "...pp.PP..", "..pp...PP.", "..bb....bb"],
    side:  ["..pppPP...", "..pp.PP...", "..pp.PP...", "..bb.bb..."],
    sideA: ["..pppPP...", ".pp..PP...", ".pp...PP..", ".bb...bb.."],
    sideB: ["..pppPP...", "...ppPP...", "..pp.PP...", "..bbbb...."],
  };
  function darken(hex, k) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(v * (1 - k)); return `#${((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, "0")}`; }
  function spriteO(x, y, rows, map, flip) {
    const w = rows[0].length;
    const at = (i) => Math.round(x + (flip ? w - 1 - i : i));
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== "." && map[row[i]]) { ctx.fillStyle = P.out; ctx.fillRect(at(i) - 1, y + j, 3, 1); ctx.fillRect(at(i), y + j - 1, 1, 3); } });
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = map[row[i]]; if (c) { ctx.fillStyle = c; ctx.fillRect(at(i), y + j, 1, 1); } } });
  }
  function palette(o) {
    return { h: o.hair, H: darken(o.hair, 0.25), s: o.skin, S: darken(o.skin, 0.18), e: P.dark, c: o.shirt, C: darken(o.shirt, 0.22), p: o.pants || o.shirt, P: darken(o.pants || o.shirt, 0.25), b: P.dark };
  }
  function shadow(x, y, rx, ry) { ellipse(x, y, rx, ry, "rgba(59, 35, 20, 0.18)"); }
  // extras drawn over the sprite: hats, apron, what they carry
  function dress(x, top, o, f) {
    const flip = f === "right";
    const fx = (i, w) => (flip ? x + 10 - i - w : x + i);
    if (o.apron && f !== "up") { px(fx(3, 4), top + 8, 4, 4, P.cream); px(fx(3, 4), top + 7, 4, 1, darken(P.cream, 0.15)); px(fx(4, 2), top + 6, 2, 1, P.cream); }
    if (o.toque) { px(fx(2, 6), top - 3, 6, 3, P.white); px(fx(1, 8), top - 1, 8, 2, P.white); px(fx(2, 6), top - 4, 6, 1, P.out); px(fx(1, 1), top - 2, 1, 3, P.out); px(fx(8, 1), top - 2, 1, 3, P.out); px(fx(7, 1), top - 3, 1, 1, darken(P.white, 0.1)); }
    if (o.helmet) { px(fx(1, 8), top, 8, 3, P.brand); px(fx(2, 6), top - 1, 6, 1, P.brand); px(fx(2, 6), top - 2, 6, 1, P.out); px(fx(2, 3), top, 3, 1, P.orange); }
    if (o.cap) { px(fx(1, 8), top, 8, 2, o.cap); px(fx(2, 6), top - 1, 6, 1, o.cap); px(fx(2, 6), top - 2, 6, 1, P.out); if (f !== "up") px(fx(f === "down" ? 1 : 0, 9), top + 2, 9, 1, darken(o.cap, 0.2)); }
    if (o.hat) { px(fx(0, 10), top + 2, 10, 1, o.hat); px(fx(-1, 12), top + 1, 12, 1, P.out); px(fx(1, 8), top - 1, 8, 3, o.hat); px(fx(2, 6), top - 2, 6, 1, P.out); px(fx(1, 8), top + 1, 8, 1, darken(o.hat, 0.25)); }
    if (o.arm === "up") { const ax = f === "left" ? 0 : 9; px(fx(ax, 1), top + 3, 1, 6, o.shirt); px(fx(ax, 1), top + 2, 1, 1, o.skin); px(fx(ax, 1), top + 1, 1, 1, P.orange); px(fx(ax - 1, 3), top + 0, 3, 1, P.out); }
    if (o.phone) { const hx = f === "left" ? -1 : 10; px(fx(hx, 1), top + 4, 1, 2, P.dark); px(fx(hx, 1), top + 4, 1, 1, P.orange); }
    if (o.tray) { const tx = f === "left" ? -6 : 10; px(fx(tx - 1, 8), top + 9, 8, 1, P.out); px(fx(tx, 6), top + 8, 6, 1, P.cream); px(fx(tx, 6), top + 7, 6, 1, P.out); px(fx(tx + 1, 2), top + 6, 2, 2, P.white); px(fx(tx + 4, 1), top + 6, 1, 2, P.white); px(fx(tx + 1, 2), top + 6, 2, 1, P.coffee); }
    if (o.bag) { const bx = f === "left" ? -4 : 10; px(fx(bx - 1, 6), top + 7, 6, 7, P.out); px(fx(bx, 4), top + 8, 4, 5, P.orange); px(fx(bx, 4), top + 8, 4, 1, P.brand); px(fx(bx + 1, 2), top + 7, 2, 1, P.brand); px(fx(bx + 3, 1), top + 9, 1, 3, darken(P.orange, 0.2)); }
    if (o.menu) { const mx = f === "left" ? -3 : 10; px(fx(mx - 1, 5), top + 3, 5, 7, P.out); px(fx(mx, 3), top + 4, 3, 5, P.cream); px(fx(mx + 1, 1), top + 5, 1, 3, P.orange); }
  }
  function figure(x, y, o) {
    const f = o.facing || "down", top = y - 16, flip = f === "right";
    const body = SPR[flip ? "left" : f];
    const legs = f === "left" || f === "right" ? (o.step === 1 ? LEGS.sideA : o.step === 2 ? LEGS.sideB : LEGS.side) : (o.step === 1 ? LEGS.a : o.step === 2 ? LEGS.b : LEGS.stand);
    shadow(x + 5, y, 5, 1.5);
    spriteO(x, top, body.concat(legs), palette(o), flip);
    dress(x, top, o, f);
  }
  // head and shoulders only: someone seated, or standing behind a counter
  function bust(x, y, o) {
    const f = o.facing || "down", top = y - 12 + (o.bob ? 1 : 0), flip = f === "right";
    spriteO(x, top, SPR[flip ? "left" : f], palette(o), flip);
    dress(x, top, o, f);
    if (o.arm === "work") { const hx = f === "left" ? -1 : 10; px(x + (flip ? 10 - hx - 2 : hx), top + 9 + (o.bob ? 1 : 0), 2, 1, o.skin); }
  }

  // ---- furniture -----------------------------------------------------------
  function table(x, y, top, front) {
    const rows = [[3, 10], [1, 14], [0, 16], [0, 16], [0, 16], [0, 16], [1, 14], [3, 10]];
    shadow(x + 8, y + 14, 10, 2);
    rows.forEach(([o, w], j) => px(x + o - 1, y + j - 1, w + 2, 3, P.out));
    px(x - 1, y + 8, 18, 4, P.out);
    rows.forEach(([o, w], j) => px(x + o, y + j, w, 1, j === 1 ? (top === P.white ? P.paper : P.woodHi) : j >= 6 ? darken(top || P.woodPale, 0.12) : (top || P.woodPale)));
    px(x + 3, y + 1, 4, 1, top === P.white ? P.white : P.woodHi);
    px(x, y + 8, 16, 3, front || P.woodMid); px(x + 1, y + 8, 14, 1, front ? P.stoneHi : P.woodLight);
    px(x + 2, y + 11, 2, 3, P.wood); px(x + 12, y + 11, 2, 3, P.wood); px(x + 1, y + 11, 4, 1, P.out); px(x + 11, y + 11, 4, 1, P.out);
  }
  function stool(x, y, c) { boxO(x, y, 5, 2, c || P.woodLight, P.woodHi); px(x, y + 2, 1, 3, P.out); px(x + 4, y + 2, 1, 3, P.out); }
  function cup(x, y, c) { px(x - 1, y - 1, 5, 4, P.out); px(x, y, 3, 2, c || P.white); px(x + 3, y, 1, 1, c || P.white); px(x, y, 3, 1, P.coffee); }
  function glass(x, y, c) { px(x - 1, y - 1, 4, 5, P.out); px(x, y, 2, 3, c); px(x, y, 2, 1, P.white); }
  function plate(x, y) { px(x - 1, y - 1, 6, 3, P.out); px(x, y, 4, 1, P.white); }
  function tent(x, y) { px(x, y, 2, 3, P.orange); px(x, y, 2, 1, P.brand); }
  function pottedPlant(x, y, pot) {
    shadow(x + 3, y, 5, 1.5);
    boxO(x, y - 5, 7, 5, pot || P.orange, P.yellow, P.brand);
    lumpO(x + 3, y - 9, 3, P.greenLight); lump(x + 1, y - 11, 2, P.leaf); lump(x + 6, y - 10, 2, P.green); lump(x + 3, y - 13, 1, P.pink); px(x + 3, y - 13, 1, 1, P.yellow);
  }
  // the orange "order sent" dot travelling from a phone to a screen
  function orderDot(t, period, from, to) {
    const p = t % period;
    if (p > 6.3 && p < 8) { const k = (p - 6.3) / 1.7; px(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, 1, 1, P.orange); }
  }
  const scanning = (t, period) => (t % period) > 5.5 && (t % period) < 8;

  // ---- actors shared by scenes ---------------------------------------------
  // The waiter's round trip from `home` to `dest` and back, every 14 s.
  function waiterTrip(t, f, home, dest, look) {
    const T = 14, p = t % T;
    let x = home.x, y = home.y, facing = "down", step = 0, tray = true;
    const dir = dest.x < home.x ? "left" : "right", back = dir === "left" ? "right" : "left";
    if (p < 3) facing = look || "up";
    else if (p < 7) { const k = (p - 3) / 4; x = home.x + (dest.x - home.x) * k; y = home.y + (dest.y - home.y) * k; facing = dir; step = 1 + (f % 2); }
    else if (p < 10) { x = dest.x; y = dest.y; facing = dir; tray = p < 8.5; }
    else { const k = (p - 10) / 4; x = dest.x + (home.x - dest.x) * k; y = dest.y + (home.y - dest.y) * k; facing = back; step = 1 + (f % 2); tray = false; }
    return { y, draw: () => figure(x, y, { facing, step, skin: P.skin1, hair: P.hair2, shirt: P.dark, pants: P.dark, apron: true, tray }) };
  }

  // =========================================================================
  // SCENE: the café
  // =========================================================================
  const cafe = {
    label: { es: "Un café en servicio: la barista en la máquina, el cocinero en la plancha, clientes pidiendo desde el teléfono, un mesero con la bandeja", en: "A café in service: the barista at the machine, the cook at the range, guests ordering from their phones and a waiter with a tray" },
    WALL: 24, COUNTER_Y: 24, FLOOR: 38,
    drawStatic() {
      const { WALL, COUNTER_Y, FLOOR } = this;
      px(0, 0, W, WALL, P.wall);
      for (let x = 0; x < W; x += 10) { px(x, 0, 1, WALL, P.wallSeam); px(x + 1, 0, 1, WALL, P.wallHi); }
      px(0, 0, W, 2, P.trim); px(0, 2, W, 1, P.woodLight); px(0, WALL - 2, W, 2, P.wallSeam);
      boxO(cx - 66, 4, 36, 15, P.board, null, null); px(cx - 67, 3, 38, 1, P.woodLight); px(cx - 67, 19, 38, 1, P.wood);
      text(cx - 63, 6, "MENU", P.cream);
      [9, 12, 15].forEach((yy, i) => { px(cx - 63, yy + 3, 10 + i * 3, 1, P.leaf); px(cx - 42, yy + 3, 4, 1, P.yellow); });
      px(cx - 114, 4, 22, 1, P.out); px(cx - 113, 5, 1, 3, P.out); px(cx - 105, 5, 1, 2, P.out); px(cx - 96, 5, 1, 3, P.out);
      boxO(cx - 116, 8, 6, 4, P.steel, P.steelHi); boxO(cx - 107, 7, 5, 3, P.woodLight, P.woodHi); boxO(cx - 99, 8, 6, 5, P.steelHi, P.white);
      lumpO(cx - 80, 12, 4, P.cream); px(cx - 80, 9, 1, 3, P.out); px(cx - 80, 12, 3, 1, P.out);
      boxO(cx + 30, 5, 24, 12, P.dark, null, null); px(cx + 41, 17, 2, 2, P.out);
      px(cx + 58, 12, 28, 2, P.woodLight); px(cx + 58, 14, 28, 1, P.out); px(cx + 60, 15, 1, 2, P.out); px(cx + 83, 15, 1, 2, P.out);
      boxO(cx + 61, 6, 6, 6, P.orange, P.yellow, P.brand); px(cx + 61, 5, 6, 1, P.cream);
      boxO(cx + 70, 7, 4, 5, P.green, P.leaf); boxO(cx + 77, 8, 6, 4, P.cream, P.white, P.woodPale);
      boxO(cx + 94, 5, 10, 12, P.cream, null, null); px(cx + 93, 4, 12, 1, P.woodLight); px(cx + 93, 17, 12, 1, P.wood); px(cx + 93, 4, 1, 14, P.woodLight); px(cx + 104, 4, 1, 14, P.wood);
      px(cx + 98, 12, 1, 4, P.green); lump(cx + 98, 10, 1, P.red); px(cx + 97, 9, 3, 1, P.red);
      [cx - 122, cx + 118].forEach((x) => { px(x, 11, 1, 3, P.out); boxO(x - 2, 8, 5, 3, P.cream, P.white); });
      // the counter: lit top, plain front, kick board
      px(cx - 97, COUNTER_Y - 1, 194, 1, P.out);
      px(cx - 96, COUNTER_Y, 192, 1, P.woodHi); px(cx - 96, COUNTER_Y + 1, 192, 3, P.woodPale); px(cx - 96, COUNTER_Y + 4, 192, 1, P.wood);
      px(cx - 96, COUNTER_Y + 5, 192, 9, P.woodMid); px(cx - 97, COUNTER_Y - 1, 1, 15, P.out); px(cx + 96, COUNTER_Y - 1, 1, 15, P.out); px(cx - 97, FLOOR - 1, 194, 1, P.out);
      px(cx - 96, COUNTER_Y + 5, 192, 1, P.wood); px(cx - 96, FLOOR - 3, 192, 2, P.wood);
      // the floor: staggered planks
      px(0, FLOOR, W, H - FLOOR, P.floorSeam);
      for (let y = FLOOR, row = 0; y < H; y += 4, row++) { const off = (row % 2) * 7; for (let x = -14 + off, i = 0; x < W; x += 14, i++) px(x + 1, y + 1, 13, 3, (i + row) % 2 ? P.floorA : P.floorB); }
      boxO(cx - 128, 42, 20, 18, P.wood, P.woodLight, P.trim);
      [46, 52].forEach((yy) => px(cx - 127, yy, 18, 1, P.out));
      [[-126, 47, P.green], [-123, 47, P.red], [-121, 47, P.cream], [-118, 47, P.blue], [-115, 47, P.green], [-112, 47, P.yellow],
       [-126, 53, P.blue], [-124, 53, P.cream], [-121, 53, P.red], [-117, 53, P.green], [-114, 53, P.blueLight]].forEach(([dx, yy, c]) => px(cx + dx, yy, 2, 4, c));
      pottedPlant(cx - 102, 57); pottedPlant(cx + 112, 59);
      boxO(cx + 62, 60, 34, 13, P.red, null, null); px(cx + 64, 62, 30, 9, P.orange); px(cx + 66, 64, 26, 5, P.red); px(cx + 68, 66, 22, 1, P.cream);
      this.foreground();
    },
    foreground() { px(0, H - 3, W, 3, P.trim); px(0, H - 3, W, 1, P.out); },
    counterItems() {
      const { COUNTER_Y } = this;
      boxO(cx - 64, COUNTER_Y - 9, 12, 9, P.cream, P.white, P.woodPale);
      px(cx - 62, COUNTER_Y - 7, 8, 2, P.dark); px(cx - 59, COUNTER_Y - 5, 2, 3, P.dark); px(cx - 55, COUNTER_Y - 5, 1, 1, P.orange); px(cx - 55, COUNTER_Y - 3, 1, 1, P.green);
      boxO(cx - 30, COUNTER_Y - 10, 8, 10, P.dark, P.steel, null); px(cx - 29, COUNTER_Y - 5, 6, 4, P.steelHi); px(cx - 28, COUNTER_Y - 3, 4, 2, P.coffee);
      plate(cx - 12, COUNTER_Y - 2); plate(cx - 12, COUNTER_Y - 3); plate(cx - 12, COUNTER_Y - 4);
      boxO(cx + 10, COUNTER_Y - 1, 18, 5, P.steel, P.steelHi, P.dark); px(cx + 12, COUNTER_Y, 4, 2, P.dark); px(cx + 22, COUNTER_Y, 4, 2, P.dark);
      boxO(cx + 36, COUNTER_Y - 8, 10, 8, P.cream, P.white, P.woodPale); px(cx + 37, COUNTER_Y - 7, 8, 2, P.dark); px(cx + 38, COUNTER_Y - 7, 6, 1, P.orange); px(cx + 38, COUNTER_Y - 4, 6, 3, P.woodPale);
      boxO(cx + 54, COUNTER_Y - 12, 34, 12, P.white, P.paper, P.steel); px(cx + 55, COUNTER_Y - 6, 32, 1, P.steel); px(cx + 55, COUNTER_Y - 11, 1, 11, P.steelHi);
      [57, 66, 75].forEach((dx) => { px(cx + dx, COUNTER_Y - 10, 6, 3, P.woodLight); px(cx + dx, COUNTER_Y - 10, 6, 1, P.cream); px(cx + dx + 2, COUNTER_Y - 11, 2, 1, P.red); });
      [58, 63, 68, 76, 81].forEach((dx) => { px(cx + dx, COUNTER_Y - 4, 3, 2, P.woodPale); px(cx + dx + 1, COUNTER_Y - 4, 1, 1, P.coffee); });
    },
    frame(t, f) {
      const { COUNTER_Y, FLOOR } = this;
      const slot = Math.floor(t / 4) % 3;
      for (let i = 0; i < 3; i++) { const c = i === slot ? P.orange : i === (slot + 1) % 3 ? P.greenLight : P.cream; px(cx + 32 + i * 7, 7, 5, 8, c); px(cx + 33 + i * 7, 9, 3, 1, P.dark); px(cx + 33 + i * 7, 11, 3, 1, P.dark); }
      const a = (t / 60) * Math.PI * 2; px(cx - 80 + Math.round(Math.cos(a - Math.PI / 2) * 2.5), 12 + Math.round(Math.sin(a - Math.PI / 2) * 2.5), 1, 1, P.red);
      [cx - 122, cx + 118].forEach((x, i) => { const g = Math.sin(t * 7 + i) > 0.9 ? 0.06 : 0.11; lump(x, 9, 8, `rgba(242, 201, 76, ${g})`); lump(x, 9, 5, `rgba(242, 201, 76, ${g})`); px(x - 1, 9, 3, 1, P.yellow); });
      // staff behind the counter
      const work = Math.floor(t * 1.2) % 2 === 0;
      bust(cx - 46, COUNTER_Y + 2, { facing: "down", skin: P.skin2, hair: P.hair3, shirt: P.green, apron: true, arm: "work", bob: work });
      for (let i = 0; i < 2; i++) { const p = (t * 0.8 + i * 0.5) % 1; px(cx - 59 + i * 2, COUNTER_Y - 10 - p * 6, 1, 1, p < 0.6 ? P.white : P.cream); }
      bust(cx + 1, COUNTER_Y + 2, { facing: "down", skin: P.skin3, hair: P.hair2, shirt: P.white, toque: true, arm: "work", bob: work });
      px(cx - 96, COUNTER_Y, 192, 1, P.woodHi); px(cx - 96, COUNTER_Y + 1, 192, 3, P.woodPale); px(cx - 96, COUNTER_Y + 4, 192, 1, P.wood);
      this.counterItems();
      const flip = Math.floor(t * 2.2) % 2 === 0;
      px(cx + 20, COUNTER_Y - 1 - (flip ? 1 : 0), 7, 2, P.dark); px(cx + 27, COUNTER_Y - 1 - (flip ? 1 : 0), 3, 1, P.wood); px(cx + 22, COUNTER_Y - 2 - (flip ? 4 : 1), 3, 1, P.brand);
      for (let i = 0; i < 3; i++) { const p = (t * 0.9 + i * 0.33) % 1; px(cx + 21 + i * 2 + (p > 0.5 ? 1 : 0), COUNTER_Y - 4 - p * 9, 1, 1, p < 0.7 ? P.cream : P.white); }
      if ((t % 12) > 4 && (t % 12) < 9) cup(cx - 38, COUNTER_Y + 1, P.white);
      // the floor, back to front
      const bob = Math.floor(t * 1.4) % 2 === 0, scan = scanning(t, 9);
      const t1 = { y: 62, draw: () => {
        const x = cx - 68, y = 48;
        stool(x - 7, y + 3); stool(x + 18, y + 3);
        bust(x + 4, y + 2, { facing: "down", skin: P.skin1, hair: P.hair1, shirt: P.blue, bob, arm: scan ? "up" : null });
        table(x, y); cup(x + 3, y + 3, P.white); plate(x + 9, y + 4); tent(x + 7, y + 1);
        bust(x + 4, y + 16, { facing: "up", skin: P.skin2, hair: P.hair4, shirt: P.red, bob: !bob });
        orderDot(t, 9, [x + 12, y - 8], [cx + 42, 12]);
      } };
      const t2 = { y: 70, draw: () => {
        const x = cx + 26, y = 56, b2 = Math.floor(t * 1.1) % 2 === 0;
        stool(x + 5, y - 5); stool(x + 5, y + 14);
        bust(x - 9, y + 12, { facing: "right", skin: P.skin3, hair: P.hair2, shirt: P.yellow, bob: b2 });
        bust(x + 17, y + 12, { facing: "left", skin: P.skin1, hair: P.hair3, shirt: P.greenLight, bob: !b2 });
        table(x, y); plate(x + 2, y + 3); cup(x + 9, y + 2, P.white); cup(x + 12, y + 5, P.cream);
      } };
      const catA = { y: 70, draw: () => { const x = cx + 74, y = 66, tail = Math.floor(t * 1.2) % 2; shape(x, y, [[1, 0, 8, 4, P.woodMid], [0, 1, 2, 2, P.woodLight], [8, -1, 3, 3, P.woodMid], [8, -2, 1, 1, P.woodMid], [10, -2, 1, 1, P.woodMid], [tail ? -3 : -2, tail ? 1 : 2, 3, 1, P.woodMid]]); px(x + 9, y, 1, 1, P.dark); } };
      const actors = [t1, t2, catA, waiterTrip(t, f, { x: cx - 20, y: FLOOR + 10 }, { x: cx - 44, y: 62 })].filter(Boolean);
      actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
      this.foreground();
    },
  };

  // =========================================================================
  // SCENE: the seafood restaurant
  // =========================================================================
  const marea = {
    label: { es: "Un restaurante de mariscos en servicio: la barra con pescado en hielo, la cocina detrás del pase, mesas de clientes y un mesero con la bandeja", en: "A seafood restaurant in service: the raw bar with fish on ice, the kitchen behind the pass, tables of guests and a waiter with a tray" },
    WALL: 24, COUNTER_Y: 24, FLOOR: 38,
    SEA: "#4F6D8F", SEA_LO: "#3B5F8A", SEA_HI: "#7F9CBF", ICE: "#DDEBF2", ICE_LO: "#B9D3E2", BRASS: "#C9A24A", BRASS_LO: "#9C7A2E", FISH: "#9AA3A8", FISH_LO: "#6E777C",
    drawStatic() {
      const { WALL, COUNTER_Y, FLOOR, SEA, SEA_LO, SEA_HI, ICE, ICE_LO, BRASS, BRASS_LO, FISH, FISH_LO } = this;
      // whitewashed wall, navy cornice and wainscot with a wave line
      px(0, 0, W, WALL, P.stucco); px(0, 0, W, 2, SEA_LO); px(0, 2, W, 1, SEA_HI);
      for (let x = 5; x < W; x += 13) px(x, 7 + (x % 5), 1, 1, P.stuccoLo);
      px(0, WALL - 5, W, 5, SEA); px(0, WALL - 5, W, 1, SEA_LO);
      for (let x = 0; x < W; x += 4) { px(x, WALL - 3, 2, 1, P.cream); px(x + 2, WALL - 2, 2, 1, P.cream); }
      // portholes
      [cx - 116, cx + 128].forEach((x) => { lumpO(x, 11, 6, BRASS); lump(x, 11, 4, SEA); px(x - 3, 10, 3, 1, SEA_HI); px(x + 1, 12, 2, 1, SEA_HI); px(x - 5, 7, 1, 1, BRASS_LO); px(x + 4, 15, 1, 1, BRASS_LO); });
      // the mounted fish over the raw bar
      ellipse(cx - 84, 8, 9, 3, P.out); ellipse(cx - 84, 8, 8, 2, FISH); px(cx - 91, 7, 14, 1, SEA); px(cx - 78, 8, 1, 1, P.dark); px(cx - 94, 6, 2, 5, P.out); px(cx - 93, 7, 1, 3, FISH_LO);
      boxO(cx - 96, 12, 24, 2, P.wood, P.woodLight, P.trim);
      // the menu board
      boxO(cx - 62, 4, 36, 15, P.board, null, null); px(cx - 63, 3, 38, 1, P.woodLight); px(cx - 63, 19, 38, 1, P.wood);
      text(cx - 59, 6, "DEL DIA", P.cream);
      [12, 15].forEach((yy, i) => { px(cx - 59, yy + 1, 12 + i * 4, 1, P.leaf); px(cx - 38, yy + 1, 4, 1, P.yellow); });
      // a lantern
      px(cx - 104, 4, 1, 3, P.out); boxO(cx - 106, 7, 5, 6, BRASS, P.yellow, BRASS_LO); px(cx - 105, 8, 3, 3, P.lemon);
      // one long counter: marble top, navy front
      px(cx - 97, COUNTER_Y - 1, 194, 1, P.out);
      px(cx - 96, COUNTER_Y, 192, 1, P.white); px(cx - 96, COUNTER_Y + 1, 192, 3, "#E8E2D6"); px(cx - 96, COUNTER_Y + 4, 192, 1, "#CFC8BA");
      px(cx - 96, COUNTER_Y + 5, 192, 9, SEA); px(cx - 96, COUNTER_Y + 5, 192, 1, SEA_LO); px(cx - 96, FLOOR - 3, 192, 2, SEA_LO);
      px(cx - 97, COUNTER_Y - 1, 1, 15, P.out); px(cx + 96, COUNTER_Y - 1, 1, 15, P.out); px(cx - 97, FLOOR - 1, 194, 1, P.out);
      // the kitchen pass, right: window into a tiled kitchen, steel counter below
      boxO(cx + 30, 5, 66, 17, "#F2EEE6", null, null);
      for (let y = 6; y < 22; y += 4) px(cx + 30, y, 66, 1, "#D8D2C6");
      for (let x = cx + 30, i = 0; x < cx + 96; x += 6, i++) px(x + (Math.floor((x - cx) / 6) % 2 ? 3 : 0), 6, 1, 16, "#D8D2C6");
      px(cx + 30, 5, 66, 3, P.steel); px(cx + 30, 5, 66, 1, P.steelHi);                      // hood
      boxO(cx + 76, 9, 18, 7, P.dark, null, null);                                          // the board
      boxO(cx + 34, 15, 30, 6, P.steel, P.steelHi, P.dark); px(cx + 37, 16, 4, 2, P.dark); px(cx + 47, 16, 4, 2, P.dark); px(cx + 57, 16, 4, 2, P.dark); // range
      px(cx + 29, 4, 68, 2, P.wood); px(cx + 29, 4, 2, 18, P.wood); px(cx + 95, 4, 2, 18, P.wood); px(cx + 28, 3, 70, 1, P.out); px(cx + 28, 3, 1, 19, P.out); px(cx + 97, 3, 1, 19, P.out);
      this.sill();
      // the swinging door into the kitchen
      boxO(cx + 100, 6, 14, WALL - 7, SEA, SEA_HI, SEA_LO); lumpO(cx + 107, 11, 3, BRASS); lump(cx + 107, 11, 2, P.cream); px(cx + 101, WALL - 4, 12, 2, P.steel); px(cx + 102, 15, 1, 2, BRASS);
      // the floor: wide driftwood planks
      px(0, FLOOR, W, H - FLOOR, "#AD987A");
      for (let y = FLOOR, row = 0; y < H; y += 5, row++) { const off = (row % 2) * 9; for (let x = -18 + off, i = 0; x < W; x += 18, i++) px(x + 1, y + 1, 17, 4, (i + row) % 2 ? "#C2AC8B" : "#B9A381"); }
      this.foreground();
    },
    foreground() { px(0, H - 3, W, 3, P.trim); px(0, H - 3, W, 1, P.out); },
    sill() { px(cx + 27, 21, 72, 1, P.out); px(cx + 28, 22, 70, 1, P.woodHi); px(cx + 28, 23, 70, 1, P.woodLight); },
    fish(x, y, c) { ellipse(x, y, 4, 1, P.out); ellipse(x, y, 3, 1, c || this.FISH); px(x - 3, y - 1, 5, 1, this.SEA); px(x + 2, y, 1, 1, P.dark); px(x - 5, y - 1, 1, 3, this.FISH_LO); },
    counterItems(t) {
      const { COUNTER_Y, ICE, ICE_LO, FISH } = this;
      // fish on ice, lemons, the scale and the board
      boxO(cx - 92, COUNTER_Y - 7, 32, 7, ICE, P.white, ICE_LO); for (let x = cx - 90; x < cx - 62; x += 5) px(x, COUNTER_Y - 4 + (x % 2), 2, 1, P.white);
      this.fish(cx - 84, COUNTER_Y - 4); this.fish(cx - 74, COUNTER_Y - 5, "#B9C0C4"); this.fish(cx - 66, COUNTER_Y - 3);
      lump(cx - 88, COUNTER_Y - 2, 1, P.lemon); lump(cx - 63, COUNTER_Y - 6, 1, P.lemon);
      boxO(cx - 58, COUNTER_Y - 6, 8, 6, P.steel, P.steelHi, P.dark); lumpO(cx - 54, COUNTER_Y - 7, 3, P.cream); px(cx - 54, COUNTER_Y - 9, 1, 2, P.red);
      boxO(cx - 42, COUNTER_Y - 3, 9, 3, P.woodPale, P.woodHi, P.wood); px(cx - 41, COUNTER_Y - 5, 5, 1, P.steelHi); px(cx - 36, COUNTER_Y - 5, 2, 1, P.dark);
      // plates up on the pass, each with fish and a lemon
      [[36, 0], [48, 0], [60, 0]].forEach(([dx]) => { plate(cx + dx, COUNTER_Y - 2); px(cx + dx + 1, COUNTER_Y - 3, 3, 1, FISH); px(cx + dx + 4, COUNTER_Y - 3, 1, 1, P.lemon); });
      boxO(cx + 70, COUNTER_Y - 4, 8, 4, P.white, P.paper, P.steelHi); px(cx + 71, COUNTER_Y - 6, 1, 2, P.green); px(cx + 74, COUNTER_Y - 6, 1, 2, P.green);  // bottles in a bucket
    },
    frame(t, f) {
      const { COUNTER_Y, FLOOR, FISH } = this;
      // the board in the kitchen
      const slot = Math.floor(t / 4) % 3;
      for (let i = 0; i < 3; i++) px(cx + 78 + i * 5, 10, 4, 5, i === slot ? P.orange : i === (slot + 1) % 3 ? P.greenLight : P.cream);
      // the lantern flickers
      const g = Math.sin(t * 7) > 0.9 ? 0.06 : 0.11; lump(cx - 104, 10, 8, `rgba(242, 201, 76, ${g})`);
      // staff: the fishmonger at the raw bar, two cooks behind the pass
      const work = Math.floor(t * 1.2) % 2 === 0;
      bust(cx - 47, COUNTER_Y + 2, { facing: "down", skin: P.skin1, hair: P.hair1, shirt: P.white, apron: true, cap: this.SEA, arm: "work", bob: work });
      bust(cx + 40, 22, { facing: "down", skin: P.skin3, hair: P.hair2, shirt: P.white, toque: true, arm: "work", bob: !work });
      bust(cx + 64, 22, { facing: "down", skin: P.skin2, hair: P.hair3, shirt: P.white, toque: true, arm: "work", bob: work });
      // the range and its pans, redrawn over the cooks' hands
      boxO(cx + 34, 15, 30, 6, P.steel, P.steelHi, P.dark);
      [[37, 0], [47, 1], [57, 0]].forEach(([dx, k], i) => { const flip = Math.floor(t * 2 + i * 0.7) % 2 === 0; px(cx + dx - 1, 15 - (flip && k ? 1 : 0), 6, 2, P.dark); px(cx + dx + 1, 14 - (flip ? 2 : 0), 2, 1, i === 1 ? P.orange : FISH); for (let j = 0; j < 2; j++) { const pp = (t * 0.9 + j * 0.5 + i * 0.3) % 1; px(cx + dx + j * 2 + (pp > 0.5 ? 1 : 0), 13 - pp * 6, 1, 1, pp < 0.7 ? P.cream : P.white); } });
      // the counters' tops over the staff, then what sits on them
      this.sill();
      px(cx - 96, COUNTER_Y, 192, 1, P.white); px(cx - 96, COUNTER_Y + 1, 192, 3, "#E8E2D6"); px(cx - 96, COUNTER_Y + 4, 192, 1, "#CFC8BA");
      this.counterItems(t);
      // tables, back to front
      const bob = Math.floor(t * 1.4) % 2 === 0, scan = scanning(t, 9);
      const seafood = (x, y) => { plate(x, y); px(x + 1, y - 1, 3, 1, FISH); px(x + 4, y - 1, 1, 1, P.lemon); };
      const t1 = { y: 60, draw: () => {
        const x = cx - 80, y = 46, b = Math.floor(t * 1.2) % 2 === 0;
        stool(x - 7, y + 3, P.woodPale); stool(x + 18, y + 3, P.woodPale);
        bust(x + 3, y + 2, { facing: "down", skin: P.skin2, hair: P.hair4, shirt: P.red, bob: b });
        table(x, y, P.white, this.SEA); seafood(x + 2, y + 4); glass(x + 9, y + 2, P.lemon); glass(x + 12, y + 5, P.lemon);
        bust(x + 3, y + 16, { facing: "up", skin: P.skin1, hair: P.hair2, shirt: P.greenLight, bob: !b });
      } };
      const t2 = { y: 74, draw: () => {
        const x = cx - 46, y = 58;
        stool(x + 5, y - 5, P.woodPale); stool(x + 5, y + 14, P.woodPale);
        bust(x - 10, y + 12, { facing: "right", skin: P.skin3, hair: P.hair1, shirt: P.blue, bob, arm: scan ? "up" : null });
        bust(x + 17, y + 12, { facing: "left", skin: P.skin1, hair: P.hair3, shirt: P.yellow, bob: !bob });
        table(x, y, P.white, this.SEA); seafood(x + 2, y + 3); seafood(x + 9, y + 4); tent(x + 7, y + 1); glass(x + 13, y + 2, P.red);
        orderDot(t, 9, [x - 8, y + 2], [cx + 86, 12]);
      } };
      const t3 = { y: 62, draw: () => {
        const x = cx + 48, y = 48, b = Math.floor(t * 0.9) % 2 === 0;
        stool(x - 7, y + 3, P.woodPale); stool(x + 18, y + 3, P.woodPale);
        bust(x + 3, y + 2, { facing: "down", skin: P.skin1, hair: P.hair3, shirt: P.pink, bob: b, hat: P.cream });
        table(x, y, P.white, this.SEA); seafood(x + 3, y + 3); glass(x + 10, y + 2, P.lemon); cup(x + 11, y + 5, P.white);
        bust(x + 3, y + 16, { facing: "up", skin: P.skin2, hair: P.hair2, shirt: this.SEA, bob: !b });
      } };
      const t4 = { y: 76, draw: () => {
        const x = cx + 84, y = 62, b = Math.floor(t * 1.3) % 2 === 0;
        bust(x - 10, y + 12, { facing: "right", skin: P.skin2, hair: P.hair2, shirt: P.green, bob: b });
        bust(x + 17, y + 12, { facing: "left", skin: P.skin3, hair: P.hair4, shirt: P.orange, bob: !b });
        table(x, y, P.white, this.SEA); seafood(x + 3, y + 4); glass(x + 10, y + 3, P.red); glass(x + 13, y + 6, P.red);
        for (let i = 0; i < 2; i++) { const pp = (t * 0.7 + i * 0.5) % 1; px(x + 4 + i * 2, y - pp * 5, 1, 1, pp < 0.6 ? P.white : P.cream); }
      } };
      const t5 = { y: 76, draw: () => {
        const x = cx - 124, y = 62;
        stool(x - 7, y + 3, P.woodPale);
        bust(x - 10, y + 12, { facing: "right", skin: P.skin1, hair: P.hair1, shirt: P.blueLight, bob: Math.floor(t * 1.1) % 2 === 0, menu: true });
        table(x, y, P.white, this.SEA); cup(x + 5, y + 3, P.white); seafood(x + 9, y + 4);
      } };
      const actors = [t1, t2, t3, t4, t5, waiterTrip(t, f, { x: cx + 70, y: FLOOR + 10 }, { x: cx - 58, y: 58 }, "up")].filter(Boolean);
      actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
      this.foreground();
    },
  };

  // ---- pick, size, loop ----------------------------------------------------
  const scenes = { cafe, marea };
  const names = Object.keys(scenes);
  const wanted = new URLSearchParams(location.search).get("scene");
  const scene = scenes[wanted] || scenes[names[Math.floor(Math.random() * names.length)]];
  canvas.dataset.scene = wanted in scenes ? wanted : names.find((n) => scenes[n] === scene);
  if (scene.label[lang]) canvas.setAttribute("aria-label", scene.label[lang]);

  function resize() {
    const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
    scale = Math.max(3, Math.min(4, Math.round(cssW / 360)));
    W = Math.ceil(cssW / scale); cx = Math.round(W / 2);
    canvas.width = W; canvas.height = H; canvas.style.height = `${H * scale}px`;
    still = document.createElement("canvas"); still.width = W; still.height = H;
    ctx = still.getContext("2d"); ctx.clearRect(0, 0, W, H); scene.drawStatic(); ctx = main;
  }
  function frame(now) {
    const t = now / 1000, f = Math.floor(t * 12);
    ctx = main; ctx.clearRect(0, 0, W, H); ctx.drawImage(still, 0, 0);
    scene.frame(t, f);
  }
  let last = -1;
  function loop(now) { const f = Math.floor((now / 1000) * 12); if (f !== last) { last = f; frame(now); } requestAnimationFrame(loop); }

  resize();
  window.addEventListener("resize", () => { resize(); frame(performance.now()); });
  if (reduce) frame(6400); else requestAnimationFrame(loop);
})();
