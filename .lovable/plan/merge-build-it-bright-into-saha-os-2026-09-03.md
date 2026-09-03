# Merge Build It Bright into Saha OS

## Goal
Keep the current Saha OS project as the destination and integrate the routes, components, data, and styling from the Stitch-exported project **Build It Bright** (SAHA-STCH) so both screen sets coexist.

## What Build It Bright contributes
- `src/components/saha/Shell.tsx` — collapsible sidebar + header shell
- `src/components/saha/ui.tsx` — `MetricTile`, `StatusBadge`, `TrendPill`, `PhaseBar`, `Section`, `ActionButton`
- `src/data/saha.ts` — typed seed data for projects, BOQ items, material rates, POs, pour cards, inspections, spend trend
- Routes: `/`, `/boq`, `/pour-cards`, `/procurement`, `/projects`, `/qa`

## Current Saha OS routes (kept as-is)
`/`, `/projects-setup`, `/boq-upload`, `/boq-engine`, `/execution-manual`, `/site-execution`, `/site-media`, `/qa-inspection`, `/price-intelligence`, `/brand-benchmark`, `/tender-comparison`, `/po-create`, `/purchase-orders`

## Route merge strategy
Avoid path collisions by mapping Build It Bright routes to new, non-conflicting paths:

| Build It Bright route | Merged path | Reason |
|-----------------------|-------------|--------|
| `/`                   | `/dashboard` | Current `/` is the main hub |
| `/projects`           | `/projects` | Free; existing is `/projects-setup` |
| `/boq`                | `/boq` | Free; existing are `/boq-engine` and `/boq-upload` |
| `/procurement`        | `/procurement` | Free; existing are `/po-create` and `/purchase-orders` |
| `/pour-cards`         | `/pour-cards` | Free |
| `/qa`                 | `/qa` | Free; existing is `/qa-inspection` |

## Implementation steps

1. **Copy shared components**
   - Copy `src/components/saha/Shell.tsx` and `src/components/saha/ui.tsx` from Build It Bright into `src/components/saha/`.
   - Update Shell nav so it points to the merged paths and includes links back to the original Saha OS hub.

2. **Copy seed data**
   - Copy `src/data/saha.ts` from Build It Bright into `src/data/saha.ts`.

3. **Add merged routes**
   - Create `src/routes/dashboard.tsx` from Build It Bright's `index.tsx`.
   - Create `src/routes/projects.tsx`, `src/routes/boq.tsx`, `src/routes/procurement.tsx`, `src/routes/pour-cards.tsx`, `src/routes/qa.tsx` from the corresponding source files.
   - Keep original Saha OS routes untouched.

4. **Unify design tokens**
   - Extend `src/styles.css` with the extra tokens Build It Bright expects: `--color-primary-hover`, `--color-primary-soft`, `--color-destructive-soft`, `--color-warning`, `--color-warning-foreground`, `--color-warning-soft`, `--color-info`, `--color-info-foreground`, `--color-info-soft`, plus the `@utility` rules (`tnum`, `label-caps`, `metric-figure`, `panel`).
   - Keep existing M3 tokens so the original 12 screens continue to render.

5. **Update the home hub**
   - Add a new card group in `src/routes/index.tsx` linking to `/dashboard`, `/projects`, `/boq`, `/procurement`, `/pour-cards`, and `/qa`.

6. **Verify**
   - Run `bunx tsgo --noEmit` to confirm no type errors.
   - Spot-check the new routes in the preview for console errors and visual regressions.

## Out of scope for this pass
- No backend migration (both projects currently use static seed data).
- No auth merge.
- No attempt to visually unify the two design systems beyond shared CSS tokens; each screen keeps its original look.
