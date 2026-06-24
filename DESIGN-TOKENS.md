# Cheflink Design Tokens

Shared color, type, and elevation reference for **both** the marketing site
(`landing`) and the **backoffice application** (`app`).

This is a **reference spec, not a contract.** Each surface may implement only a
subset. The rules that are non‑negotiable (because they are accessibility, not
taste) are called out explicitly in [§7](#7-accessibility-rules-non-negotiable).

How to consume it:

1. Map the **semantic roles** in [§2](#2-semantic-roles) to your own variables
   (`--color-accent`, `--color-text`, …). Reference semantic roles in components,
   **not** raw ramp steps like `orange-500`.
2. Pull the literal hex values from the **primitive ramps** in
   [§3](#3-color-primitives).
3. Pick a **surface profile** (marketing = warm; app = neutral) in
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
| `--color-accent-tint` | Selected / hover background, badge fill | `#FFF7ED` | `#FFF7ED` |
| `--color-accent-tint-strong` | Active background, stronger tint | `#FFEDD5` | `#FFEDD5` |
| `--color-link` | Hyperlink text on a light surface | `#C2410C` | `#C2410C` |
| `--color-link-hover` | Hyperlink hover | `#9A3412` | `#9A3412` |
| `--color-focus` | Keyboard focus ring | `#F97216` | `#F97216` |
| `--color-bg` | Page canvas | `#FBF8F4` (cream) | `#FFFFFF` |
| `--color-surface` | Card / panel | `#FFFFFF` | `#FFFFFF` |
| `--color-surface-subtle` | Zebra rows, inset panels | `#F4EEE6` | `#FAFAF9` |
| `--color-border` | Hairline borders / dividers | `#E7DDD0` | `#E7E5E4` |
| `--color-text` | Primary text | `#1C1714` | `#1C1917` |
| `--color-text-secondary` | Secondary text | `#5C4E42` | `#57534E` |
| `--color-text-muted` | Muted / placeholder | `#7C6B5C` | `#78716C` |

**Active navigation link (app):** do not color the label `#F97216`. Use
`--color-text` for the label + an orange indicator (left bar / underline in
`--color-brand`) + `--color-accent-tint` background. This avoids the contrast
problem and reads as a product, not a colored link.

---

## 3. Color primitives

### Brand orange (≈ Tailwind `orange`)

| Step | Hex | White‑text contrast | On‑white text contrast | Use for |
|---|---|---|---|---|
| 50  | `#FFF7ED` | — | — | tints, hover/selected backgrounds |
| 100 | `#FFEDD5` | — | — | active backgrounds, badge fills |
| 200 | `#FED7AA` | — | — | subtle borders on tint |
| 300 | `#FDBA74` | — | — | decorative |
| 400 | `#FB923C` | — | — | decorative / charts |
| **500** | **`#F97216`** | 2.9:1 ❌ | 2.9:1 ❌ | **brand mark, focus ring, large graphics only** |
| 600 | `#EA580C` | ~3.3:1 ⚠️ | ~3.3:1 ⚠️ | large UI graphics; not body text |
| **700** | **`#C2410C`** | 5.2:1 ✅ | 5.2:1 ✅ | **button fills (white label), links** |
| **800** | **`#9A3412`** | 7.3:1 ✅ | 7.3:1 ✅ | **hover/pressed, high‑emphasis orange text** |
| 900 | `#7C2D12` | 9.4:1 ✅ | 9.4:1 ✅ | rare, max‑contrast |

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

`cream = #FBF8F4` (sand‑50), `ink = #1C1714` (sand‑900).

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
| Canvas | `cream #FBF8F4` | `white #FFFFFF` |
| Neutrals | `sand` (warm) | `stone` (neutral) |
| Density | generous whitespace | compact |
| Elevation | soft shadows (§6) | hairline borders; shadows only for overlays |
| Display font | Fraunces allowed | Inter only |

---

## 5. Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| UI / body | **Inter** | 400 / 500 / 600 / 700 | Both surfaces, everywhere |
| Display | **Fraunces** | 500 / 600 / 700 | **Marketing only.** Never in the app. |
| Numeric data | Inter + `font-variant-numeric: tabular-nums` | — | Money, quantities, tables, KDS — keeps digits aligned |
| Mono (optional) | `ui-monospace` | — | App: IDs, codes, order numbers |

---

## 6. Elevation

**Marketing:**
- `soft` — `0 1px 3px rgba(28,23,20,.05), 0 10px 30px -14px rgba(28,23,20,.18)`
- `lift` — `0 2px 6px rgba(28,23,20,.05), 0 24px 50px -20px rgba(28,23,20,.28)`

**Application (flatter — prefer borders over shadow):**
- Level 0 (cards/rows): no shadow, `1px` `--color-border`
- Level 1 (dropdowns/popovers): `0 1px 2px rgba(0,0,0,.05), 0 4px 12px -4px rgba(0,0,0,.12)`
- Level 2 (modals): `0 8px 28px -8px rgba(0,0,0,.24)`

---

## 7. Status colors (application)

The landing page has none; the app needs them. Each has a **base** (fills,
indicators, icons) and a **text** variant (≥4.5:1 on white) plus a tint. Keep
these visibly distinct from the brand orange.

| Status | Base (fill/indicator) | Text on white | Tint (bg) |
|---|---|---|---|
| Success | `#16A34A` | `#15803D` | `#F0FDF4` |
| Warning | `#D97706` | `#B45309` | `#FFFBEB` |
| Danger  | `#DC2626` | `#B91C1C` | `#FEF2F2` |
| Info    | `#2563EB` | `#1D4ED8` | `#EFF6FF` |

> **Warning vs. brand:** amber sits right next to the brand orange. Don't let a
> "warning" state and an accent element look identical — reserve orange for
> brand/interactive and lean warning toward amber‑yellow, or use it sparingly.
>
> **Danger vs. brand:** `danger` must be an unmistakable red, never burnt‑orange,
> or staff will confuse "error/unpaid" with "brand" on a busy screen.

---

## 8. Radius

| Token | Value | Use |
|---|---|---|
| `sm` | `0.375rem` | inputs, small controls (app) |
| `md` | `0.5rem` | buttons, inputs |
| `lg` | `0.75rem` | cards (app) |
| `xl` | `1rem` | cards |
| `2xl` | `1.5rem` | marketing cards |
| `3xl`+ | `2rem`+ | marketing hero/feature panels only |
| `full` | `9999px` | pills, badges, marketing CTAs |

App leans `sm`–`lg`; marketing leans `xl`–`3xl`.

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

---

## 10. Open decisions / migration notes

- **Landing: converged ✅.** The landing's old `clay` accent (`#C75A2E`) has been
  retired. Its Tailwind token is now `brand` on the orange ramp above
  (`500 = #F97216`), with white-label buttons/links/active states using
  `brand-700 #C2410C` and `brand-800` hover per §7. The token key in
  `landing/tailwind.config.mjs` is literally `brand`.
- **App: still pending.** The backoffice still uses `#F97216` directly for
  buttons, links, and active nav — which fail §7. Apply the same split there:
  `accent #C2410C` for those roles, `brand #F97216` for the mark/focus only.
- **Token names.** The semantic names in §2 are suggestions; keep them stable
  once adopted so the two repos can share docs.
- **Dark mode / KDS.** Not covered here. The KDS (distance‑viewed, often dark)
  will need its own surface profile — define it against the real screen, not by
  inverting this one.
