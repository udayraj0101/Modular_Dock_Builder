@AGENTS.md

# Dock Configurator — Project Tracker

This file is auto-loaded by Claude Code on every session. It is the single source of truth
for **what we are building, what has been decided, and what is done vs. pending**. Update it
as work progresses so any new session can resume with full context.

Detailed brief lives in `Dock-Configurator-Milestone-1-Brief.md`. Do not duplicate it here —
this file records **decisions, status, and open questions**, not the requirements themselves.

---

## Product summary

Interactive 2D + 3D modular dock builder for a client that manufactures 500×500×400 mm
floating dock cubes. Delivered in 5 milestones. **We are on Milestone 1.**

Single-source-of-truth principle: one `Design` object drives the 2D canvas, 3D scene,
dimensions panel and bill of materials. There is no separate "2D state" and "3D state".

---

## Decisions locked in (do not revisit without explicit user go-ahead)

| Area | Decision | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router, TS, Tailwind, `src/` dir) | Agreed with client |
| 2D renderer | HTML5 Canvas | Client-agreed; needed for hundreds-of-cubes perf |
| 3D renderer | Three.js + React Three Fiber | Client-agreed |
| Backend | Same Next.js app (API routes / server actions) — no separate Node server | Zero backend surface in M1; avoids extra deploy target |
| Persistence (M1) | `localStorage` behind a `DesignRepository` interface | Prototype, single-device testing; swap-in later is one file |
| Persistence (M4+) | Supabase (Postgres, `jsonb` column for design) | Agreed with client; bundles auth for M5 |
| State updates | Immer for immutable mutations in history stack | Simpler undo/redo |
| Validation | Zod schema for saved/imported designs | Prevents corrupted file crashes |
| Testing | Vitest for the config layer | Pure functions → fast, fixture-based |
| File I/O | Export/import a design as JSON from M1 | Brief calls it out for client debugging |

---

## Milestone 1 progress

Legend: [x] done · [~] in progress · [ ] not started

### Stage 1 — Config layer (headless, unit-tested) — **COMPLETE**
- [x] Scaffold Next.js project (TS, Tailwind, App Router, src/)
- [x] Install Vitest, Immer, Zod; wire test runner (`npm test` — 39 tests green)
- [x] `Design` types + cube-key helpers (`"x,y"` string keys) — `src/lib/dock/types.ts`
- [x] Pure mutations: `addCube`, `removeCube`, `addRange`, `removeRange` — `src/lib/dock/design.ts`
- [x] Derived data: `getBounds`, `getDimensions` (mm + m) — `src/lib/dock/design.ts`
- [x] Adjacency map + `getExposedEdges` + `countInternalConnections` — `src/lib/dock/adjacency.ts`
- [x] Connectedness check with `getConnectedComponents` + `validate` — `src/lib/dock/connectivity.ts`
- [x] History stack (undo/redo, drag = one entry via push after mouseup) — `src/lib/dock/history.ts`
- [x] `DesignRepository` interface + `LocalStorageRepo` — `src/lib/repo/`
- [x] Zod schema + JSON export/import (`serialize/deserializeDesign`) — `schema.ts` + `io.ts`
- [x] Vitest fixtures for the 4 client test layouts — `src/lib/dock/__tests__/fixtures.ts`
- [x] Placeholder BOM calculator with **injectable `BomRules`** — `src/lib/dock/rules.ts`

### Stage 2 — Interfaces — **COMPLETE (unverified in browser by user)**
- [x] `useDesign()` hook wraps history + `LocalStorageRepo` + derived data — `src/lib/hooks/useDesign.ts`
- [x] 2D Canvas: grid, cubes, exposed-edge highlight, dimensions overlay — `src/lib/canvas/renderDesign.ts` + `src/components/DockCanvas.tsx`
- [x] Viewport math (zoom-at-cursor, pan, screen↔grid) — `src/lib/canvas/viewport.ts`
- [x] Pointer events: click, click-drag placement, right-click remove, wheel-zoom, space+drag pan
- [x] Toolbar (tool mode, undo/redo, save/load, templates, import/export, rename, 2D/3D toggle) — `src/components/Toolbar.tsx`
- [x] Info panel (cube count, dimensions, BOM lines, validation warnings) — `src/components/InfoPanel.tsx`
- [x] Predefined templates loadable from a dropdown — `src/lib/dock/templates.ts`
- [x] R3F 3D view with `InstancedMesh` + `OrbitControls` — `src/components/Dock3DView.tsx`
- [x] 2D/3D toggle; both read the same `Design` — `src/components/DockBuilder.tsx`
- [x] Dev server smoke test — `http://localhost:3000` returns 200, app-code render ~400 ms

### Stage 3 — Verification
- [ ] Plug in real client connection/BOM rules when supplied  *(blocked on client)*
- [ ] Verify all 4 client test configs match manual counts  *(blocked on client)*
- [x] Perf pass at 500+ cubes — user verified 906 cubes render smoothly in 2D and 3D on **2026-09-15**
- [ ] Preview build for client testing  *(deferred by user — deploy after features)*
- [x] Add "Dock with a finger" (4th) example template landed **2026-09-15** — `templates.ts` (3 m × 2 m body + 2 m × 1 m mooring finger, geometry still pending client confirmation)
- [x] Softened placeholder labels to "(example)" so customer-facing text doesn't say "placeholder"

### Acceptance criteria coverage (from brief §7)
Track which of the 18 criteria each PR/commit closes. Update when work lands.

Stage 1 has laid the logical foundation for these criteria; they'll be marked satisfied
once the UI wires them up in Stage 2:
- #6 automatic dimensions — logic in `getDimensions`
- #7 design stored as X/Y config, separate from views — `Design` type + `src/lib/dock/`
- #8 adjacent-cube detection — `getAdjacencyMap`
- #9 exposed-edge detection — `getExposedEdges` (UI overlay still pending)
- #10 initial connection calc — `countInternalConnections` (real rules pending client)
- #11 initial BOM — `computeBom` with injectable rules
- #12 undo/redo — `history.ts`
- #13/#14 save/load — `DesignRepository` + `LocalStorageRepo`
- #15 templates loadable — `templates.ts` (3 templates; L-shape geometry pending client)

Currently satisfied end-to-end (behaviour visible to user): 17 / 18 pending browser verification.
Not-yet-satisfied: #10 initial connection calc — placeholder rules only, real client rules pending.

---

## Open questions / waiting on client

- Connection pin specs and per-edge/per-cube component rules (blocks Stage 3 BOM verification)
- Exact L-shape and finger test layouts (needed for fixture #3 and #4)
- Client's manually counted component quantities for the 4 test configs

Until these arrive, BOM rules stay as swappable config — never hardcoded into the UI.

---

## Project layout (as it grows)

```
src/
  app/                 # Next.js routes (UI shell, later)
  lib/
    dock/              # Stage 1 config layer — zero React/Canvas imports
      types.ts         # Design, Cube, EdgeMap, etc.
      design.ts        # pure mutations + derived getters
      adjacency.ts     # adjacency + exposed-edge detection
      connectivity.ts  # flood-fill / disconnected-section check
      history.ts       # undo/redo stack
      schema.ts        # Zod schema for save/load/import
      rules.ts         # injectable connection/BOM rule types
      __tests__/       # Vitest fixtures + unit tests
    repo/
      types.ts         # DesignRepository interface
      localStorage.ts  # LocalStorageRepo (M1)
      supabase.ts      # SupabaseRepo (later)
```

---

## Session handoff notes

Leave a short note here at the end of a session if you stopped mid-task, so the next
session doesn't have to re-derive context. Delete stale notes.

- **2026-09-15** — Stage 1 config layer complete. 39 Vitest tests passing, `tsc --noEmit`
  clean.
- **2026-09-15** — Stage 2 UI shipped and browser-verified by user. Add / Remove / Undo /
  Redo / Clear / Save / Open / Import / Export / Templates / 2D↔3D all working. Templates
  1 (3×2 rect) and 2 (8×2 pontoon) match the brief's acceptance layouts; template 3 (L)
  is a best-guess placeholder until client geometry arrives; template 4 (finger) not yet
  added.
- **2026-09-15 — Post-ship fixes:** (a) 3D↔2D toggle now uses two mounted-and-hidden views
  with R3F `frameloop="demand"` (was previously slow on 3D→2D due to WebGL teardown).
  (b) Rename-input no longer clears undo/redo history — it patches present in place.
- **2026-09-15 — Next dev "1 issue" badge diagnosed as harmless:** hydration mismatch on
  toolbar buttons caused by a browser extension injecting `fdprocessedid` attributes
  (form-filler like McAfee WebAdvisor / LastPass / Bitwarden). Confirmed not our bug; will
  not appear in production. Do not add `suppressHydrationWarning` — masks real issues.
- **Blocker not started**: real BOM rules and the exact L-shape / finger fixture geometry
  still need to come from the client (see Open questions below).
- **Awaiting user decision** on next polish work: 4th template + softened labels,
  Fit-to-view button, cursor coord readout, touch/pinch support, BOM CSV export.
- Peer-dep noise: install new deps with `--legacy-peer-deps` (React 19 / Node 26 typings
  vs vitest peer ranges — harmless but the plain install errors).
