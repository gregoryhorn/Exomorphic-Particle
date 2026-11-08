# Exomorphic-Particle Codex

An interactive WebGL typography experiment by Gregory Horn: tiny blocks assemble into a name, fuse into solid lettering, follow the pointer and lock back into their word.

- [Open the page](https://gregoryhorn.github.io/Exomorphic-Particle/)
- [Open the cycling test](https://gregoryhorn.github.io/Exomorphic-Particle/?test=1)
- [Download the source and both skills](https://gregoryhorn.github.io/Exomorphic-Particle/downloads/Exomorphic-Particle.zip)

## Interaction

The minimal page keeps **Gregory Horn** at the top left and **Download** in the centre. Move over the word to engage it, then away: its blocks follow the pointer as a compact cloud. Bring the pointer back near the word to lock them into their exact letter positions. Escape, leaving the window or blurring it returns them home. The lettering gradually fuses to remove gaps after arrival.

The test view cycles the exact phrases **Gregory Horn** and **Exomorphic-Particle Codex**. Each formation takes 2.6 seconds, then holds for five seconds, including 1.2 seconds of post-arrival solidification. This is deterministic goal-directed choreography, not autonomous AI or a physics fluid simulation.

Back returns to the previous page, with https://gregoryhorn.xyz/ as the direct-entry fallback. GitHub opens this repository; Exomorphic-Particle opens the cycling test. Pause and reduced-motion preferences apply to both the field and the lettering. Touch movement is supported; lifting a touch returns the blocks.

## Run

Require Node 22+ and Python 3.10+.

```sh
npm ci
npm run build
npm run preview
```

The preview uses port 5203. Serve only this project, never a parent directory containing private files. For development, `npm run dev` runs Vite on that port instead.

```sh
npm test
```

Tests use Google Chrome locally. CI installs Playwright Chromium, uses software WebGL and does not impose a hardware frame-rate guarantee. Set SITE_URL to test a different built preview or the public page.

## Visual implementation

- Layered cyan/gold procedural network, sharp midground and softly defocused near/far regions.
- Real bloom, a pulled-back view, and localized feathered lower-right foreground softness. The blur is art-directed layering, not a physical lens simulation.
- Twenty single-dot information packets: 90% cyan, 10% gold, on distinct connected routes in varied directions.
- Persistent instanced typography blocks, locally rasterized targets, curved/staggered travel, gradual gap-free glyph consolidation and pointer-follow/re-lock uniforms.
- No uploaded reference images, remote font calls, trackers or private career material.

## Two reusable skills

- [Particle test skill](skills/exomorphic-particle-test/SKILL.md): assembly, timing, solidification, pointer follow/re-lock and visible-pixel tests.
- [Page skill](skills/exomorphic-particle-page/SKILL.md): minimal layout, real source download, packaging, publication and read-back verification.

The skill documents are included in the source download. Copy the relevant skill directory into your agent's skills directory if you want to use it; no automatic installation is performed by this website.

## Source layout

`mini.html` is the compact embed for a portfolio showcase: moving illumination, restrained slow flicker, and glyph shadows that change with the light. It accepts an origin-checked `exomorphic-motion` parent message to pause while hidden. The miniature uses only the typography scene, not another full network field.

`src/Swarm.js` owns typography and pointer behavior; `FieldLayers.js`, `Packets.js` and `LayerRenderer.js` own the field. `main.js` owns lifecycle and navigation. `scripts/package.py` builds an allowlisted source ZIP. `tests/interaction.mjs` verifies actual pixels, interaction, navigation, download and reduced motion.

## Verification

Run `npm test` against the built preview. The interaction suite verifies actual rendered name pixels moving to the pointer and returning, exact phrase cycling and solidification, pause, reduced motion, real ZIP download and Back navigation. The compact-scene suite verifies changing illumination/flicker and parent-controlled pause. `python3 scripts/verify_public.py` checks the reviewed public payload and exact ZIP contents with a limited credential/privacy pattern scan.

## License

Code and skills: MIT. Manrope: SIL Open Font License; see public/OFL-Manrope.txt. Three.js, Vite and Playwright retain their respective licenses. The visual code is a prototype; performance measurements are browser/hardware-specific, not a universal 60fps claim.
