# Roadmap

## Done
- [x] UI enhancement pass: Saha Green palette, Instrument Serif + Work Sans, hero sections, elevated cards, polished shell
- [x] Import 6 new Stitch screens (batch 2) as routes, linked from the hub
- [x] Import Executive Financial Forecasting screen (/financial-forecast)
- [x] Import Multi-Source Financial Ingestion Hub (/financial-ingestion)
- [x] Import Categorized Vendor Directory (/vendor-directory)
- [x] Import Purchasing & Vendor Command Center (/purchasing-center)

- [x] Import Contractors, Labour & Biometric Attendance screen (/contractors-labour)
- [x] Import Billing & Expenditure screen (/billing-expenditure)
- [x] Import Command Operations Hub (/command-operations)
- [x] Import Project Controls Cockpit (/project-controls)
- [x] Import AI Project Programme Scheduler (/ai-programme) — later Stitch variant (Workstream Overlap Engine) merged into same route instead of a duplicate
- [ ] Ongoing: dedupe near-identical Stitch screens; merge revisions into existing routes
- /pmc-scope, /landowners-investment, /capital-ledger imported from Stitch
- [x] Import System Master Directory (/system-directory)
- [x] Android/mobile responsiveness pass + PWA "Download app" button
- [x] Visual refresh: colored headings, richer accent palette, decluttered hub (fewer visible modules, search + grouped sections) per user reference screenshots
- [x] Add persistent home button in top header so any screen can navigate back to `/`
- [x] Clarify and, if requested, enable Lovable Cloud (database/storage/auth) and Lovable AI integration
- [x] Backend decision: user has GCP project `saha-l` (project number 428361199102, account sahadeveloperz@gmail.com) — decide Firebase (Firestore/Storage) vs Lovable Cloud; needs service account key if Firebase
- [x] Fold latest Stitch shell screen chrome (role switcher, offline sync, weather, notif badge, Sunlight Mode) into shared Shell — no duplicate route
- [x] Apply Saha Developers logo across app (shell sidebar, hub hero, favicon, PWA icons)
- [x] Redesign landing page as Action-first notification hub with project-specific data (selected prototype v1)
- [x] Make notifications / team messages / landing stats project-scoped so 3 projects can run together
- [x] User-assigned chat tasks + in-app notifications: messages/tasks assigned to a specific user create a notification only that user sees
- [ ] Push/WhatsApp delivery: browser/phone push and WhatsApp messages for assigned tasks (needs provider setup)
- [ ] Fix: sahadeveloperz@gmail.com admin sign-in still landing on pending-approval screen


- [ ] Fix layout sizing: cap content width on large screens, stop Download-app button overlapping header chrome

- [ ] Fix mobile touch scrolling (single-finger scroll blocked; only 2-finger pan worked)

## Access control
- [x] Role-based sidebar filtering (Admin, PM, Site Engineer, Supervisor, Purchase/Stores, Accounts, Landowner) — client-side nav filter in src/components/saha/nav.ts
- [ ] Enforce privileges server-side (user roles table + RLS) once auth is added
- [x] Unified shared sidebar across all pages

## New project intake (single form, no duplicate screens)
- [x] Capture timeline drivers (start/handover, working days, slab cycle, finishing per floor, procurement lead)
- [x] Capture material BOQ specs (concrete grade, steel Fe500/Fe500D/Fe550D, AAC vs red/fly-ash brick, flooring, paint, plumbing, electrical, doors/windows, sanitaryware quality: Standard/Premium/Luxury)
- [x] Capture workflow inputs (contract type, workflow template)
- [x] Google Maps location: latitude, longitude, maps link + "View on Google Maps"
- [x] Staffing (total staff, engineers, labour), landowner & investor details, company + bank details (only last 4 digits stored)
- [x] Floor plan drawing uploads (private cloud storage, signed links)

## BOQ

- [x] Upload + Export per BOQ category/stage
- [x] Project Setup: distinguish user-entry fields from calculated/app-suggested results, with instant recalculation and working draft/generate actions

## Typography
- [ ] Single professional font across app; bold subtle-colored headings; caps for main headings; fluid responsive sizes
- [ ] Data freshness: projects/list views must refresh instantly after add/delete (no stale or NaN values)

## Live data (Sep 4)
- [x] Multiple landowners/investors per project (count input + dynamic name/contact/share rows), stored in landowners/investors JSON columns
- [x] Edit existing projects (pencil on project card loads the full form, Update project saves)
- [x] Command Center runs on live site_projects + notifications (no hardcoded 3 sites / ₹22.70 Cr), empty state when no projects
- [ ] Remaining Stitch-imported screens still show static demo numbers — migrate to live data screen by screen

## BOQ Master Engine (Sep 4)
- [x] Replace static Stitch BOQ engine with live editable boq_items table (add/edit/delete, CSV upload + export, stage roll-up)
- [x] AI pre-drawing full-project estimate (site prep to handover) from project inputs; fix schema-mismatch failure with batched tolerant JSON parsing
- [x] AI BOQ must cover all 25 construction trade categories (Preliminaries → Miscellaneous), batched generation
- [ ] Live project identity everywhere: replace hardcoded 'Cyber Enclave - Phase 2'/Madhapur/G+3 headers in imported Stitch screens with the selected project's saved details

## BOQ brand optimisation & product images (in progress)
- [x] AI brand alternatives per BOQ line item (3-4 real Indian makes, tier, rate, saving) with one-click apply
- [x] Value-engineering scan across the highest-cost line items
- [x] Product image next to each brand/item in the BOQ (e.g. "July series Kohler diverter/spout")
  - [x] `boq_items.image_url` / `image_source` columns
  - [x] "Find image" — AI proposes product image URLs, server verifies they really serve an image
  - [x] Manual upload fallback into the private `boq-images` bucket + "Search online" link

- [ ] BOQ: order trades in construction stage sequence (not alphabetical)
- [ ] BOQ: per-trade Price optimizer button on every trade view

## Brands (Sep 5)
- [x] Brand Preferences page before BOQ (/brand-preferences): per-material make/series/supplier/notes saved on the project, fed as mandatory brands into the AI estimate
- [x] Removed redundant BOQ Upload / ingestion demo page from menu (redirects to BOQ Engine)

- [ ] Fix: "Generate AI Programme" button on /ai-programme does nothing (make it generate a real schedule from project + BOQ)

- [ ] Fix: /pmc-scope buttons/tabs are dead (static Stitch import) — make it live per project

- [ ] New page: Budget Fit — app-suggested items/brands with cheaper rates to keep BOQ within target budget, one-tap apply
- [x] Budget Fit suggestions are read-only; apply only on explicit owner/partner approval
- [ ] Fix: /execution-manual dead buttons (Export Manual PDF, Gang Pocket Card, Push to Mobile QA, stage selection)
- [x] /pmc-scope live (work packages from BOQ, fee, committed POs, saved scope)
- [x] /budget-fit live suggestions with explicit apply
- [x] /execution-manual buttons live (print, pocket card download, push checklist to field, stage selection, SOP search)
- [x] Brand Preferences pre-filled with Cyber Enclave spec + Excel download/upload
- [x] Home page: selecting a project opens that project's dashboard
- [x] /scope-brief live (package selection, drawing list, CSV export, printable PDF brief)
- [x] /drawing-decipher → live Drawings & Documents register (upload, open, delete, export)
- [x] Re-checked /execution-manual buttons (print, pocket card, push to field, stage tabs) — working

## Sep 21
- [x] Fix Bills & Payments permission check (Approve/Pay buttons for Admin/PM)
- [x] Guard project queries with sign-in state (home, projects, approvals, PO create, AI programme, brand preferences, budget fit, BOQ engine, project setup)
- [x] Fix AI SDK version mismatch typecheck errors
- [ ] Suggest per-user monthly pricing in INR for the SaaS offering
- OCR credit question answered in chat

## Money & Owners (full pass, 2026-09-21)
- [x] Capital Ledger: functional rebuild (owner entries save to capital_entries)
- [ ] Landowners & Investment: verify all buttons
- [ ] Common Expenses: verify
- [x] Cost Dashboard: owner funds received + open calls tile added
- [ ] Do not publish until user confirms; verify saving on Money & Owners entry pages
- [x] Owner Approvals & Suggestions section (notes/files/decisions to owners, approve-reject trail)

## Sep 21
- [x] Accounts & Audit: Billing & Expenditure now shows entered statutory/permission charges + vendor bills live
- [x] Financial Ingestion: real cash ledger (owner funding, vendor payments, statutory charges) + working document uploads to private storage, CSV export

- [x] Procurement: live PO register (project-scoped values, status filters, vendor commitments, CSV)
- [x] Purchasing Center rebuilt live: KPI cards link to filtered /procurement lists, vendor directory, tools; /procurement accepts ?status= filter
- [x] /procurement KPI tiles clickable — each filters the PO list below
