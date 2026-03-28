# VeilBloom Module Notes

- **Instrument:** Pads / sustained atmospheres.
- **Theme:** Drift Garden – translucent veils suspended in low gravity with glowing pollen drifting through.
- **Inspiration:** teamLab Borderless fabric rooms, Icelandic auroras, macro jellyfish tendrils.

## Module summary
VeilBloom extends `BaseThreeJsModule` and renders layered shader-driven veils plus additive pollen sprites. Slow sine/noise motion gives the pads a floating feeling, while `shimmer` and `bloom` add vibrato and large swells.

## Methods
| Method | Options | Use case |
| --- | --- | --- |
| `sustain` | `intensity` (0–2) | Sets base glow + pollen density. Map to long pad CC curves. |
| `shimmer` | `amount` (0–2), `duration` (ms) | Adds short ripples/undulations for modulation-wheel wiggles. |
| `bloom` | `scale` (≥1), `duration` (ms) | Expands the entire stack of veils for chord changes/drops. |
| `reset` | – | Returns to neutral state. |

## Usage tips
1. Trigger `sustain` when the pad channel opens to set the base brightness. 0.6–1.0 works for verse pads; 1.4+ for choruses.
2. Sprinkle `shimmer` events (200–800 ms) on chord arpeggios or LFO automation.
3. Fire `bloom` with `scale` 1.2–1.6 and `duration` 1–2 s at transitions.

## Notes & lessons
- Shader-based veils keep things lightweight but expressive; more layers can be added if GPU headroom allows.
- Additive pollen points reuse the same infrastructure from other modules for consistency.
- Future idea: allow palette cycling tied to key changes.

## Fun rating
Floating neon silk is my happy place.
