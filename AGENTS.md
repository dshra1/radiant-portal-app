<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Landowner presentations (77:76, 78:93, combined)

All six presentation pages are generated from one source. Never edit the pages themselves:

- edit `tools/landowner-presentation/template.html` (layout, chapters, text, code) and/or
  `data.json`, `slab.json`, `save.json`, `photos.json` (figures, BOQ, schedules);
- run `npm run presentation` — it rewrites `src/presentation/{all,7893,7776}.html` (sign-in route)
  and `public/landowner-presentation/{index,7893,7776}.html` (open share links) together;
- `npm run presentation:check` must pass before committing; `npm run build` regenerates them too.
