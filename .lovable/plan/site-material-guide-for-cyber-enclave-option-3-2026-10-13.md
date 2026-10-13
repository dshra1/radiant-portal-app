# Site Material Guide for Cyber Enclave (option 3)

## What the supervisor and engineer get
A new **Site Material Guide** page under Site Supervision with a simple path:

```text
Trade (Electrical / Plumbing / Tiling / Doors & Windows / AC / Kitchen / Structure)
  -> Item (Conduit, Wires, CPVC, SWR, Drains, Tiles...)
    -> Flat (Flat-01 / Flat-02)  -> Room / Bathroom
      -> Material card: spec, size, colour, qty per flat, per floor, x5 floors,
         +wastage, preferred brand, current stock, "Issue from stock", "Raise PO",
         and "How to lay / check" (the existing quality steps)
```

## Data taken from your report
I read the report, and it has these sections. Each one becomes data the app can search and use:
- Electrical circuits, conduit and wire runs, flat-wise and room-wise
- Plumbing pipes by layer, flat-wise and bathroom-wise
- Toilets: tile take-off, drains and falls, electrical points
- Kitchens: sockets, gas points, sink points, tiles
- AC provision schedule
- Door and window schedule, locations and costs
- Area statement and Vastu sign-off (for reference only)

## Links to the rest of the app
- "Issue from stock" records the issue in Stock & Inventory against that flat and room.
- "Raise PO" opens a draft order already filled with the item and quantity.
- "How to lay / check" opens the matching quality inspection steps.
- Ordered vs used vs remaining is shown on each card.

## Structure (columns, steel, sleeves)
Your report has **no column, steel or sleeve data**. It only covers the architectural set. I will build the clickable column layout (press a column to see its size, bars, stirrups, laps, sleeves and pour steps), but it needs your structural drawings or bar bending schedule. You can upload them on the page or send them to me later.

## Build order (to save credits)
1. **Step 1:** the material data plus the guide page for Electrical and Plumbing. Then I stop for your review.
2. **Step 2:** Tiles, Kitchens, AC, Doors & Windows, plus the stock and PO links.
3. **Step 3:** the clickable column layout, once structural data is provided.

## Technical details
- New table `site_takeoffs` (project_id, trade, item, flat, room, spec, unit, qty_flat, floors, wastage_pct, brand, qa_ref, sort), with GRANTs and RLS for approved members (Admin/PM delete). Rows are parsed from the report HTML once and inserted for the Cyber Enclave project.
- New table `structural_members` (project_id, tag, type, grid_x, grid_y, size, main_bars, ties, lap, sleeves jsonb, notes) for Step 3.
- New route `src/routes/site-material-guide.tsx`, added to the Site Supervision nav.
