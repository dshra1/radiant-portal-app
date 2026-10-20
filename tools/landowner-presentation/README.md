# Landowner presentations — single source

One template + one data set build every page, so the combined page, the 77:76 page and the 78:93 page
(and their sign-in and open-link copies) can never drift apart.

| Source (edit these) | What it holds |
|---|---|
| `template.html` | the whole page: chapters, text, layout, all calculation code |
| `data.json` | `a` = 77:76, `b` = 78:93: common/unit costs, GST, BOQ, schedules, services, structure |
| `slab.json` | slab-area take-off per project |
| `save.json` | 77:76 savings options |
| `photos.json` | product photos available in `public/landowner-presentation/files/prod` |

| Output (never edit) | Served as |
|---|---|
| `src/presentation/all.html` · `7893.html` · `7776.html` | behind sign-in (`/owner-presentation`) |
| `public/landowner-presentation/index.html` · `7893.html` · `7776.html` | open links `/landowner-presentation/...` |

Commands:

```
npm run presentation        # rebuild all six pages
npm run presentation:check  # fail if any page is out of date
```

`npm run build` runs the rebuild first, so a deploy always ships pages made from the current source.
Drawings, photos, BOQ Excel files and the phase-2 sheets stay in `public/landowner-presentation/files/`.
