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
- [ ] Visual refresh: colored headings, richer accent palette, decluttered hub (fewer visible modules, search + grouped sections) per user reference screenshots
- [ ] Add persistent home button in top header so any screen can navigate back to `/`
- [ ] Clarify and, if requested, enable Lovable Cloud (database/storage/auth) and Lovable AI integration
- [ ] Backend decision: user has GCP project `saha-l` (project number 428361199102, account sahadeveloperz@gmail.com) — decide Firebase (Firestore/Storage) vs Lovable Cloud; needs service account key if Firebase
- [ ] Fold latest Stitch shell screen chrome (role switcher, offline sync, weather, notif badge, Sunlight Mode) into shared Shell — no duplicate route
- [ ] Apply Saha Developers logo across app (shell sidebar, hub hero, favicon, PWA icons)

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
