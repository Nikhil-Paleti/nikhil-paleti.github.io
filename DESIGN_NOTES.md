# Design Notes

## Approved direction: research index

The research-index redesign supersedes the previous fixed-sidebar direction.
Use a Swiss-inspired, restrained white/black composition: bold sans-serif name,
clear horizontal rules, generous space, and small blue links—not decorative blobs,
gradients, cards, or oversized illustrations.

- Give ML infrastructure and ML research equal prominence. Current: Nuro; prior: Waymo.
- Keep LinkedIn, GitHub, Google Scholar, Twitter / X, and résumé visibly labeled.
- Shared top navigation stays available without a JavaScript-dependent drawer.
- News and selected writing/research are simple horizontal rows, stacked on phones.
- Preserve all existing news details with native disclosure controls; longer personal
  copy lives on About. Keep existing blog, publications, projects, and résumé routes.
- Use the existing sans-serif for the homepage and retain readable serif article headings.
- Preserve system-aware light/dark themes and the user override. Links, focus rings,
  keyboard access, reduced motion, and narrow-screen readability are required.
- Use real destinations only. The benchmark link goes to the essay’s benchmark section;
  code links to the repository already referenced in the essay.

Check desktop and phone layouts, article readability, navigation, disclosure controls,
and both themes before shipping. Publication remains PR-only; do not merge or deploy
without approval.
