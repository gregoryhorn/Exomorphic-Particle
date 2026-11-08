---
name: exomorphic-particle-test
description: Use when testing particle swarms. Verify visible motion.
version: 0.1.0
author: Gregory Horn (gregoryhorn), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [WebGL, particles, typography, testing]
    related_skills: [exomorphic-particle-page]
---

# Exomorphic-Particle test

Maintain and verify the interactive particle typography in the Exomorphic-Particle repository. This is deterministic GPU choreography, not autonomous AI or a fluid simulation.

## When to use

- Adjust assembly, five-second holds, solidification, mouse following or re-locking.
- Diagnose invisible GPU blocks, clipping, incorrect timing or reduced-motion regressions.
- Do not use for changing the landing-page layout or publishing without approval.

## Prerequisites

Work in a clone of https://github.com/gregoryhorn/Exomorphic-Particle. Require Node 22+, Python 3 and a Chromium browser. Install the locked dependencies with `terminal(command="npm ci")`. Install Playwright Chromium for CI if needed; the local test uses Google Chrome unless CI is set.

## Procedure

1. Use `read_file` to inspect src/Swarm.js and tests/interaction.mjs. Preserve the exact phrases Gregory Horn and Exomorphic-Particle Codex.
2. Keep particle identity stable across destinations. Use GPU attributes and uniforms, not thousands of DOM nodes or per-frame buffer rebuilding.
3. Form the word over 2.6 seconds, hold for five seconds, and fuse landed blocks to a gap-free glyph over 1.2 seconds within the hold. Separate the solid glyph before departure. The test page is `?test=1`; the default page keeps Gregory Horn.
4. Arm interaction when the pointer comes within 45 pixels of the word bounds. Detach after moving more than 95 pixels away; follow the pointer as a compact cloud. Return near the word, leave the window, blur it or press Escape to return home. Reduced motion must bypass carrying and formation animation.
5. Use `terminal(command="npm run build")`, start `npm run preview` through `terminal` as a managed background process, and run `terminal(command="npm test")`. Set SITE_URL for another preview or public deployment.
6. Inspect evidence/01-page.png, 02-following.png, 03-relocked.png and 04-test.png with `vision_analyze`. Require actual pixels moving from the word to the pointer and back, not just changing simulation metadata.

## Pitfalls

- Downward-positive orthographic coordinates reverse winding; use correct winding or double-sided quads.
- Size the glyph raster to the measured whole phrase. Preserve font loading before target sampling.
- A valid block count does not prove rendering. Check visible pixels and inspect settled words.
- Pure block enlargement can leave sampling gaps; the final antialiased glyph fill completes the solid state.
- Preserve the simulation clock during pause, document hiding and back/forward cache restore.

## Verification

Require zero browser errors, real pointer-follow and return pixel checks, exact phrase/timing checks, pause/resume, Back navigation, compact-layout fit and reduced-motion checks. Report measured frame cadence only for the tested browser/hardware; do not impose GPU performance claims on software-rendered CI. Never publish private documents, credentials, machine paths or uploaded reference images.
