# NW_0002 — Kick Module Learnings

- **Instrument:** Kick (driving, foundational pulses).
- **Theme:** Seismic Cathedral, inspired by brutalist rib arches and seismograph plots.
- **Inspiration sources:** Madrid’s Abando station arches, analog seismograph charts, Ryoji Ikeda’s *datamatics* strobes.
- **Visual decisions:** concentric rib arches, matte black floor, white strobes, crimson cracks, dusty additive particles.
- **Implementation:** `SeismicVault` (`BaseThreeJsModule`) with methods `impact`, `strobe`, `crack`, `reset`. Instanced ribs + additive dust shader.
- **Assets:** none required (fully procedural).
- **Testing:** `npx eslint src/main/starter_modules/SeismicVault.js` (file ignored by repo config).
- **Ideas for next time:** MIDI velocity-driven impacts, optional camera shake, customizable rib counts.
