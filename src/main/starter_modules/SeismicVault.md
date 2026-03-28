# SeismicVault Module Notes

- **Instrument focus:** Drums – Kick.
- **Theme:** Seismic Cathedral — brutalist ribs flexing under sub-bass pressure.
- **Inspiration:** Brutalist architecture (Madrid’s Abando station arches), analog seismograph plots, Ryoji Ikeda strobes.

## Module summary
SeismicVault extends `BaseThreeJsModule` and builds concentric rib arches out of instanced box meshes hovering over a matte floor. Each kick (`impact`) compresses the ribs toward the center, flashes crimson cracks along the floor, and emits dusty shards in additive blending. Additional methods control strobes and long crack accents.

## Methods
| Method | Options | Notes |
| --- | --- | --- |
| `impact` | `intensity` (0.2–3) | Main kick hit: squeezes ribs and emits dust. Map to sequencer row tied to kicks. |
| `strobe` | `mode` (`white` \| `crimson`), `duration` (ms) | Short spot-light burst for fills or downbeats. |
| `crack` | `duration` (ms) | Draws a glowing crimson fissure along the floor for breakdowns. |
| `reset` | – | Clears pulses, dust, cracks, and strobes. |
| `BaseThreeJsModule` methods | inherited | Standard show/hide/offset/matrix controls. |

## Usage tips
1. Add module to a track → Channel A triggers `impact` with intensity 1–1.5 for normal kicks.
2. Channel B triggers `strobe` with `mode=white` for 16th fills, or `mode=crimson` on bar markers.
3. Channel C triggers `crack` with longer duration at drop moments.

## Victories & lessons
- ✅ Instanced ribs keep CPU usage modest even when reacting quickly.
- ✅ Dust shader reuses the additive sprite approach from LumenSpiral, keeping a cohesive visual language.
- ⚠️ Might add a low-frequency camera shake option next time for even more weight.

## Fun factor
Designing a concrete rave cathedral was great fun.

## Continuous improvements / future hooks
- Parametrize rib count/radius for different rooms.
- Map impact intensity to MIDI velocity to let live drummers emphasize certain hits.
- Add optional camera shake + floor reflection toggle so it can stack with lighter Sunday modules.
