# Design Notes

## Approved direction: profiler report (Nov 2026)

Keep the Swiss research-index grid and make it read like a clean benchmark report.
This supersedes the earlier blue-link and serif-heading choices below.

- Type: Inter for everything people read, JetBrains Mono for labels, dates, tags and
  code. No serif anywhere, posts included.
- Color: warm paper and ink, light and dark. One heat-orange accent, used only for
  results (a post's headline number, the best benchmark row), the active nav item and
  link hover. Links are ink with an underline.
- Homepage writing rows are date, title, description and tags, nothing more. Results
  stay inside posts: each post can set `result` in its frontmatter, shown under its
  header. Benchmark tables get inline speedup bars at build time
  (`src/lib/rehype-bench-tables.mjs`).

## Earlier direction: research index

Swiss-inspired, restrained composition: bold sans-serif name, clear horizontal rules,
generous space; no decorative blobs, gradients, cards, or oversized illustrations.

- Give ML infrastructure and ML research equal prominence. Current: Nuro; prior: Waymo.
- Keep LinkedIn, GitHub, Google Scholar, Twitter / X, and résumé visibly labeled.
- Shared top navigation stays available without a JavaScript-dependent drawer.
- News and selected writing/research are simple horizontal rows, stacked on phones.
- Preserve all existing news details with native disclosure controls; longer personal
  copy lives on About. Keep existing blog, publications, projects, and résumé routes.
- Preserve system-aware light/dark themes and the user override. Links, focus rings,
  keyboard access, reduced motion, and narrow-screen readability are required.
- Use real destinations only.

Check desktop and phone layouts, article readability, navigation, disclosure controls,
and both themes before shipping. Publication remains PR-only; do not merge or deploy
without approval.
