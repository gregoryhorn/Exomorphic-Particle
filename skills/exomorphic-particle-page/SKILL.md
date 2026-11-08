---
name: exomorphic-particle-page
description: Use when editing the particle page. Preserve its layout.
version: 0.1.0
author: Gregory Horn (gregoryhorn), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [WebGL, website, packaging, GitHub]
    related_skills: [exomorphic-particle-test]
---

# Exomorphic-Particle page

Build, package and maintain Gregory Horn's minimal particle page without redesigning the accepted network or publishing unrelated career material.

## When to use

- Edit the minimal landing page, navigation, source download or deployment.
- Package the two public skills and the reusable visual code.
- Do not use to modify a live portfolio, personal profile or sibling project without explicit approval.

## Prerequisites

Work in a clone of https://github.com/gregoryhorn/Exomorphic-Particle. Require Node 22+, Python 3 and locked npm dependencies. GitHub publication requires an authenticated account and user approval; use the existing CLI authentication without printing tokens.

## Procedure

1. Inspect index.html, src/main.js, src/style.css, package.json and .github/workflows/pages.yml with `read_file`. Inspect Git status, branch and diffs with `terminal`; do not stage unknown changes.
2. Preserve Gregory Horn at the top left, a centred Download control, GitHub and Exomorphic-Particle links, Back and the motion control. Default mode shows the name; `?test=1` exposes the cycling typography demonstration. Back uses previous-page navigation when available and the public portfolio as a direct-entry fallback.
3. Keep the accepted cyan/gold depth field, pulled-back viewpoint, sparse single-dot packets and feathered lower-right foreground blur. Do not add panels, diamonds or replacement artwork.
4. Build with `terminal(command="npm ci")` and `terminal(command="npm run build")`. scripts/package.py creates the real download from an allowlist. The ZIP must include source, lockfile, both skills and font license, but never private documents, environments, dependencies, build caches or uploaded images.
5. Start the built preview through `terminal`, run `terminal(command="npm test")`, inspect the actual page and verify download ZIP integrity. Scan only the proposed public payload for credentials, personal contact data and machine-local paths before staging explicit files.
6. When publication is authorized, commit the reviewed files on main, create the exact public repository Exomorphic-Particle, push, and inspect the remote tree and visibility. GitHub Pages deploys only dist; keep the source ZIP available under downloads/Exomorphic-Particle.zip and attach the same artifact to the release.
7. Read back the public repository, deployment, page and actual download before reporting success. Re-run browser tests with SITE_URL targeting the public page. Do not call a queued deployment live.

## Pitfalls

- Relative Vite base is required for GitHub Pages repository subpaths.
- A source-only archive must not include its own download ZIP or node_modules.
- Preserve back/forward-cache lifecycle; do not restore a disposed renderer.
- The static fallback heading and real links must remain usable if WebGL fails.
- A repository publish is not permission to redeploy the separate portfolio.

## Verification

Require a successful build, browser checks, valid complete download, zero known npm-audit vulnerabilities at verification, final screenshot review and explicit readback of every external state changed. Describe this as an interactive visual project, not production AI. Keep changes to another portfolio local until its publication is explicitly approved.
