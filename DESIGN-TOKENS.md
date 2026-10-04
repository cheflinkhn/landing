# Cheflink Design Tokens

Shared color, type, and elevation reference for **both** the marketing site
(`landing`) and the **backoffice application** (`app`).

This is a **reference spec, not a contract.** Each surface may implement only a
subset. The rules that are non‑negotiable (because they are accessibility, not
taste) are called out explicitly in [§9](#9-accessibility-rules-non-negotiable).

How to consume it:

1. Map the **semantic roles** in [§2](#2-semantic-roles) to your own variables
   (`--color-accent`, `--color-text`, …). Reference semantic roles in components,
   **not** raw ramp steps like `orange-500`.
2. Pull the literal hex values from the **primitive ramps** in
   [§3](#3-color-primitives).
3. Pick a **surface profile** (marketing = warm paper; app = neutral) in
   [§4](#4-surface-profiles) for your neutrals and elevation.

> Source-of-truth caveat: brand‑mark hex values here are sampled/standardized,
> not taken from the original logo vector. If you have the logo source file,
> reconcile `brand` against it.

---

## 1. Brand anchor

The brand color is the logo orange **`#F97216`**. It is effectively identical to
Tailwind `orange-500` (`#F97316`), so the full Tailwind `orange` ramp is used as
the brand ramp for convenience.

**`#F97216` is a brand/identity color, not a UI text color.** It is too light to
carry white text or to be used as text on white (≈2.9:1 — fails WCAG AA). Use the
darker steps for anything interactive or textual. This split is the core idea of
the whole spec.

---

## 2. Semantic roles

Reference these names in code. Where landing and app differ, both values are
shown; where one column is blank, the value is shared.

| Semantic token | Role | Landing | App |
|---|---|---|---|
| `--color-brand` | Logo / identity, focus ring, large non‑text accents | `#F97216` | `#F97216` |
| `--color-accent` | Primary button fill (white label), primary interactive | `#C2410C` | `#C2410C` |
| `--color-accent-hover` | Hover / pressed for accent | `#9A3412` | `#9A3412` |
| `--color-accent-pressed` | Hard bottom edge of the landing's primary button | `#7C2D12` | — |
| `--color-accent-tint` | Selected / hover background, badge fill; landing "peach" section ground | `#FFF7ED` | `#FFF7ED` |
| `--color-accent-tint-strong` | Active background, stronger tint; landing "apricot" (closing CTA) ground | `#FFEDD5` | `#FFEDD5` |
| `--color-link` | Hyperlink text on a light surface | `#C2410C` | `#C2410C` |
| `--color-link-hover` | Hyperlink hover | `#9A3412` | `#9A3412` |
| `--color-focus` | Keyboard focus ring | `#F97216` | `#F97216` |
| `--color-bg` | Page canvas | `#FBF8F4` (cream) | `#FFFFFF` |
| `--color-bg-dawn` | Landing hero ground (a shade warmer than cream: the sky behind the street scene) | `#FFF3E6` (dawn) | — |
| `--color-bg-sand` | Landing alternate section ground (how it works, FAQ) | `#F4EEE6` (sand‑100) | — |
| `--color-bg-footer` | Landing footer ground | `#E7DDD0` (sand‑200) | — |
| `--color-paper` | Tickets, menus, checks, placemat: "paper" objects | `#FFFDF8` | — |
| `--color-surface` | Card / panel | `#FFFFFF` | `#FFFFFF` |
| `--color-surface-subtle` | Zebra rows, inset panels | `#F4EEE6` | `#FAFAF9` |
| `--color-border` | Hairline borders / dividers | `#E7DDD0` | `#E7E5E4` |
| `--color-border-strong` | Rules that structure a section (menu double rule, FAQ first rule, device frames) | `#1C1714` (ink) | — |
| `--color-text` | Primary text | `#1C1714` | `#1C1917` |
| `--color-text-secondary` | Secondary text | `#5C4E42` | `#57534E` |
| `--color-text-muted` | Muted / placeholder | `#7C6B5C` | `#78716C` |

**Active navigation link (app):** do not color the label `#F97216`. Use
`--color-text` for the label + an orange indicator (left bar / underline in
`--color-brand`) + `--color-accent-tint` background. This avoids the contrast
problem and reads as a product, not a colored link.

**Landing header:** the sticky header has no color of its own. It takes the
ground of the section under it (`dawn` → `cream` → `sand` → `peach` →
`apricot`) with a 500 ms color transition; text stays ink throughout, so
only the background moves. Implemented with `data-tone` on sections and a
scroll listener in `public/assets/js/landing.js`.

---

## 3. Color primitives

### Brand orange (≈ Tailwind `orange`)

| Step | Hex | White‑text contrast | On‑white text contrast | Use for |
|---|---|---|---|---|
| 50  | `#FFF7ED` | — | — | tints, hover/selected backgrounds; landing "peach" ground |
| 100 | `#FFEDD5` | — | — | active backgrounds, badge fills; landing "apricot" ground |
| 200 | `#FED7AA` | — | — | subtle borders on tint |
| 300 | `#FDBA74` | — | — | decorative |
| 400 | `#FB923C` | — | — | decorative / charts |
| **500** | **`#F97216`** | 2.9:1 ❌ | 2.9:1 ❌ | **brand mark, focus ring, large graphics only** (tent cards, status dots) |
| 600 | `#EA580C` | ~3.3:1 ⚠️ | ~3.3:1 ⚠️ | large UI graphics; not body text |
| **700** | **`#C2410C`** | 5.2:1 ✅ | 5.2:1 ✅ | **button fills (white label), links, italic accent words in headings, eyebrows** |
| **800** | **`#9A3412`** | 7.3:1 ✅ | 7.3:1 ✅ | **hover/pressed, high‑emphasis orange text** |
| 900 | `#7C2D12` | 9.4:1 ✅ | 9.4:1 ✅ | the primary button's hard bottom edge; rare max‑contrast text |

Contrast values are vs `#FFFFFF`. White‑text and on‑white‑text contrast are
symmetric, so one column governs both "white label on this fill" and "this color
as text on white."

### Neutral — warm (`sand`, marketing)

| Step | Hex | | Step | Hex |
|---|---|---|---|---|
| 50 | `#FBF8F4` | | 500 | `#7C6B5C` |
| 100 | `#F4EEE6` | | 600 | `#5C4E42` |
| 200 | `#E7DDD0` | | 700 | `#43392F` |
| 300 | `#D4C5B2` | | 800 | `#2C261F` |
| 400 | `#A99685` | | 900 | `#1C1714` |

`cream = #FBF8F4` (sand‑50), `ink = #1C1714` (sand‑900), `dawn = #FFF3E6`
(one step warmer than cream, hero only), `paper = #FFFDF8`.

### Neutral — cool/true (`stone`, application)

| Step | Hex | | Step | Hex |
|---|---|---|---|---|
| 50 | `#FAFAF9` | | 500 | `#78716C` |
| 100 | `#F5F5F4` | | 600 | `#57534E` |
| 200 | `#E7E5E4` | | 700 | `#44403C` |
| 300 | `#D6D3D1` | | 800 | `#292524` |
| 400 | `#A8A29E` | | 900 | `#1C1917` |

---

## 4. Surface profiles

A surface picks **one** neutral ramp and **one** elevation style. Brand, accent,
links, focus, and status are shared across both.

| | Marketing (landing) | Application (app) |
|---|---|---|
| Canvas | `cream #FBF8F4`, with light tonal sections (see below) | `white #FFFFFF` |
| Neutrals | `sand` (warm) | `stone` (neutral) |
| Density | generous whitespace, text measure ≤ 34em | compact |
| Elevation | flat: hairlines and rules; shadows only under "paper" objects and device frames (§6) | hairline borders; shadows only for overlays |
| Display font | Fraunces, regular weight, italic for the accent word | Inter only |

### Landing section grounds

The landing has **no dark sections**. Every ground is a light warm tone and
contrast comes from type and rules, never from inverting a block:

| Section | Ground | Tone key |
|---|---|---|
| Hero (with the street scene along its floor) | `dawn #FFF3E6` | `dawn` |
| Trust strip + how it works | `sand‑100 #F4EEE6` | `sand` |
| Features (the three pillars) | `cream #FBF8F4` | `cream` |
| The dashboard (tabs + screenshots) | `brand‑50 #FFF7ED` | `peach` |
| Guest experience | `cream` | `cream` |
| Live demo placemat | gingham: `cream` with `brand‑500 @ 13%` stripes, 64px grid | — |
| FAQ | `sand‑100` | `sand` |
| Closing CTA | `brand‑100 #FFEDD5` | `apricot` |
| Footer | `sand‑200 #E7DDD0` | — |

Adjacent sections should differ by at least one step so the boundary reads
without a rule; the header morphs to the tone key of the section in view.

---

## 5. Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| UI / body | **Inter** | 400 / 500 / 600 / 700 | Both surfaces, everywhere |
| Display | **Fraunces** | 300–700 (variable) | **Marketing only.** Never in the app. Headings are **regular (400)**, tight tracking (−0.025 to −0.03em), set with `"SOFT" 40, "WONK" 0`; the accent word is *italic* in `brand‑700` with `"SOFT" 60, "WONK" 1`. No semibold display headings. |
| Receipt / ticket | **IBM Plex Mono** | 400 / 500 / 600 | **Marketing only.** Kitchen tickets, checks, section eyebrows (12px, uppercase, 0.14em), footer links, captions under the guest phones. |
| Handwriting | **Kalam** | 400 / 700 | **Marketing only.** One note at a time (the waiter's "sin cebolla", an arrow caption). Never for UI text, never more than one per viewport. |
| Numeric data | Inter + `font-variant-numeric: tabular-nums` | — | Money, quantities, tables, KDS — keeps digits aligned (tickets too) |
| Mono (optional) | `ui-monospace` | — | App: IDs, codes, order numbers |

Landing type scale (desktop → phone): h1 `4.9rem → 2.75rem`, h2 `3.5rem →
2.4rem`, h3 (pillar names) `30px`, body `17–18px / 1.6`, small `14–15px`.
Google Fonts request:
`Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,0..100,0..1;1,…` +
`Inter:wght@400;500;600;700` + `IBM+Plex+Mono:wght@400;500;600` + `Kalam:wght@400;700`.

---

## 6. Elevation

**Marketing (flat first):**
- Default: no shadow. Sections are separated by their grounds; lists by
  hairlines (`sand‑200`/`sand‑300`); a section's structure by a 1px `ink`
  rule (the features' double rule, the FAQ's first rule).
- `paper` objects (tickets, table tents, the placemat) sit on the page with a
  drop shadow: `filter: drop-shadow(0 10px 10px rgba(28,23,20,.2))`, or
  `0 18px 18px rgba(28,23,20,.22)` for the larger how‑it‑works pieces.
- Device frames: tablet `0 30px 50px -28px rgba(28,23,20,.45)`, phone
  `0 30px 50px -24px rgba(28,23,20,.5)`, window `0 30px 50px -34px rgba(28,23,20,.4)`.
- Primary button: no blur; a **hard 3px bottom edge** in `brand‑900`
  (`box-shadow: 0 3px 0 #7C2D12`) that drops to 2px with a 1px translate on hover.
- Legacy tokens `soft` / `lift` (`0 1px 3px … , 0 10px 30px -14px …`;
  `0 2px 6px … , 0 24px 50px -20px …`) remain only for the contact and legal
  pages until they are brought in line; do not use them on the landing.

**Application (flatter — prefer borders over shadow):**
- Level 0 (cards/rows): no shadow, `1px` `--color-border`
- Level 1 (dropdowns/popovers): `0 1px 2px rgba(0,0,0,.05), 0 4px 12px -4px rgba(0,0,0,.12)`
- Level 2 (modals): `0 8px 28px -8px rgba(0,0,0,.24)`

---

## 7. Status colors (application)

Each has a **base** (fills, indicators, icons) and a **text** variant (≥4.5:1 on
white) plus a tint. Keep these visibly distinct from the brand orange.

| Status | Base (fill/indicator) | Text on white | Tint (bg) |
|---|---|---|---|
| Success | `#16A34A` | `#15803D` | `#F0FDF4` |
| Warning | `#D97706` | `#B45309` | `#FFFBEB` |
| Danger | `#DC2626` | `#B91C1C` | `#FEF2F2` |
| Info | `#2563EB` | `#1D4ED8` | `#EFF6FF` |

> **Warning vs. brand:** amber sits right next to the brand orange. Don't let a
> "warning" state and an accent element look identical — reserve orange for
> brand/interactive and lean warning toward amber‑yellow, or use it sparingly.
>
> **Danger vs. brand:** `danger` must be an unmistakable red, never burnt‑orange,
> or staff will confuse "error/unpaid" with "brand" on a busy screen.

The landing borrows exactly one of these: the **`PAGADO` / `PAID` stamp** on a
check uses success text `#15803D`. `LISTO` / `NUEVO` on tickets use `brand‑700`.

---

## 8. Radius

| Token | Value | Use |
|---|---|---|
| `sm` | `0.375rem` | inputs, small controls (app) |
| `md` | `0.5rem` | buttons, inputs (app) |
| `lg` | `0.75rem` | cards (app) |
| `xl` | `1rem` | cards (app) |
| `full` | `9999px` | pills, badges; **the only radius on landing buttons** |

Landing specifics: `paper` objects are **square** (tickets, tents, the
placemat, menus); device frames use their own radii (tablet bezel `26px`,
phone bezel `30px`, screenshot window `10px`); the mobile nav sheet and
language menu use `0.5rem`. The old `2xl`/`3xl`/`4xl` marketing‑card radii are
retired with the cards.

---

## 9. Accessibility rules (non‑negotiable)

These are the parts that are **not** stylistic preference:

1. **Never** put white text on `brand‑500 #F97216` (or 600). Use `accent` (`700`)
   or darker. Same rule for any white‑label button.
2. **Hyperlink / interactive text** on a light surface must be `700` or darker
   (≥4.5:1). Not `500`.
3. **Active nav / selected state** should not rely on `500` text color. Use a
   darker text + an orange indicator/tint instead.
4. `brand‑500` is fine for **focus rings, icons, indicator bars, and large
   graphics** (non‑text contrast ≥3:1), just not for text or white‑label fills.
5. All status colors must stay distinct from the brand orange (see §7).
6. Landing secondary text on the light grounds is `sand‑600 #5C4E42` or darker;
   `sand‑500` is reserved for captions ≥14px on `cream`/`dawn` and `sand‑400`
   is decorative only (leaders, dashed rules).
7. Motion on the landing (the header tone transition) must honor
   `prefers-reduced-motion`: smooth scrolling is disabled. The street scene is
   a still drawing and needs no exception.

---

## 10. Landing illustration palette (the street scene)

`scripts/street-scene/build.mjs` generates `src/assets/street-scene.svg`: a
hand‑drawn row of food businesses (brunch spot, café, taquería, bistro, bar,
lounge, pizzeria, sushi bar) with their terraces, seen in a loose oblique
projection after the illustrated towns on sites like val.town. It has its own
small palette, chalkier than the UI tokens so it reads as a drawing, not as
interface. It is **not** for UI.

| Role | Hex |
|---|---|
| Ink (every line; never black) | `#3A2E25` |
| Walls | sage `#C5D0B2` · terracotta `#E2A585` · mustard `#EACD86` · plaster `#F3E8D6` · brick `#CF8664` · dusty blue `#BCCDD8` · peach `#F2DCC4` · bone `#EFE5D3` |
| Paper / cream / glass | `#FFFDF8` · `#F6ECDC` · `#DCE9EF` (gleam `#F2F8FA`) |
| Woods | `#9C6A45` · `#7A4E31` · slats `#B98457` |
| Greens (awnings, chalkboards, trees) | `#5B8C4A` · `#3E5A3A` · `#8FB573` · `#6E9A5A` |
| Accent (awnings, signs, a parasol) | brand `#F97216`, accent `#C2410C`; indigo `#4F6D8F`; lamp `#F6D47A` |
| Pavement / kerb / road | `#EFE5D6` (slabs `#DDCFBB`) · `#D8C8B2` · `#E7DDD0`, fading to `sand‑100` |

House rules for the street: fronts face the viewer, depth recedes up and to
the right so every venue shows its front, right flank and roof; fills sit a
hair off their lines, shaded faces are hatched, and one turbulence filter
wobbles all the lines. Signs name the kind of place in words that read in both
languages (CAFÉ, TACOS, BISTRO, BAR, LOUNGE, PIZZA, SUSHI…), never a venue.
People are small and seated; no couriers, no pets, no vehicles. The drawing
is still: no animation.

---

## 11. Open decisions / migration notes

- **Landing: reworked (Oct 2026).** Tokens above describe the current site:
  light tonal sections, flat elevation, Fraunces regular + italic accent, the
  mono/handwriting roles, `paper` objects, and the street scene. The `brand`
  key in `landing/tailwind.config.mjs` is the orange ramp; `cream`, `dawn`,
  `paper`, `ink` and the `sand` ramp are defined there too.
- **Landing: contact and legal pages** still use the earlier marketing look
  (gradient blob, rounded shadowed cards, `soft`/`lift` shadows, `slate` text
  on legal pages). Bring them onto this spec; when done, delete the `soft` and
  `lift` shadow tokens.
- **App: still pending.** The backoffice still uses `#F97216` directly for
  buttons, links, and active nav — which fail §9. Apply the same split there:
  `accent #C2410C` for those roles, `brand #F97216` for the mark/focus only.
- **Token names.** The semantic names in §2 are suggestions; keep them stable
  once adopted so the two repos can share docs.
- **Dark mode / KDS.** Not covered here. The KDS (distance‑viewed, often dark)
  will need its own surface profile — define it against the real screen, not by
  inverting this one. The landing deliberately ships a single light theme.
