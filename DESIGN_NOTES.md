# Design Notes

This file captures the current design direction for `nikhil-paleti.github.io` so future agents or collaborators can preserve the visual language instead of drifting away from it.

## Overall Direction

- The site should feel like a clean technical blog with editorial polish, not a portfolio template.
- The design should feel thoughtful, calm, and research-oriented.
- Avoid playful, bright, "kidish", gradient-heavy portfolio aesthetics.
- Avoid generic terminal cosplay. The site can feel technical without becoming a monospace gimmick.
- The sidebar is a major part of the identity now. It should remain minimal, structured, and composed.

## Layout

- Desktop uses a fixed left sidebar and a main reading/content column on the right.
- Mobile collapses the sidebar into a hamburger drawer.
- The sidebar should feel vertically balanced:
  - centered identity block near the top
  - primary nav in the middle
  - socials/theme controls near the bottom
- The main column should feel editorial, with generous whitespace and restrained content width.
- Prefer strong vertical rhythm over cards everywhere.

## Homepage

- Homepage is intentionally simple:
  - name
  - short intro
  - latest news/updates feed
- Do not reintroduce dense portfolio sections like skills matrices, timelines, or large project grids onto the homepage.
- The hero should be strong but not oversized.
- The intro paragraph should stay readable and not span too wide.
- The updates feed should feel secondary to the hero, not compete with it.
- Update titles should remain smaller and calmer than the page title.

## Sidebar

- No profile photo.
- Name and role are enough.
- `Resume` lives with the main navigation, not in a separate utility block.
- Social icons live near the bottom.
- Theme toggle lives with the socials as a single icon button.
- There is a dot separator between the theme toggle and socials.
- Nav items use lightweight icons, not plain bullets.
- Sidebar active state should stay subtle and soft, not loud or overly filled.

## Typography

- Keep the mixed typography system:
  - serif for large headlines and major titles
  - sans for most interface/body UI
  - monospace only as an accent
- Do not convert the whole site to monospace.
- Monospace is appropriate for:
  - section labels
  - dates
  - some metadata
  - sidebar role / small technical accents
- The site should stay easy to read for long-form prose.

## Color and Theme

- Current direction is slightly cooler and more technical than the earlier warm palette.
- Keep both light and dark themes.
- Default behavior should follow the device theme.
- User can override with the theme icon toggle.
- Colors should remain restrained:
  - soft neutral backgrounds
  - quiet borders
  - one clear accent color
- Avoid high-saturation palettes or loud contrast unless there is a strong reason.

## Visual Style Rules

- Prefer subtle borders, dividers, and spacing over heavy cards/shadows.
- Use rounding, but keep it restrained.
- Keep UI controls feeling intentional and integrated, not like random pills dropped into the layout.
- Avoid introducing decorative elements that don't serve structure.
- If adding personality, do it through composition, typography, and spacing first.

## Content Style

- Writing should feel mature, specific, and technical.
- Homepage/supporting copy should sound like an ML systems/research engineer, not a generic student portfolio.
- Keep intro copy concise.
- Blog posts can be rich with:
  - equations
  - figures
  - code
  - implementation notes

## Things To Avoid

- Reintroducing bright portfolio gradients
- Emoji-heavy copy
- Dense "all about me" sections on the homepage
- Giant hero text with weak supporting hierarchy
- Generic pill toggles that don't visually fit the system
- Full monospace redesigns
- RSS/social clutter in the sidebar footer

## If Future Changes Are Needed

- Prefer small, coherent refinements over large resets.
- When making visual changes, check:
  - desktop sidebar balance
  - mobile drawer usability
  - homepage hierarchy
  - blog readability
  - dark mode quality
- If unsure, preserve the current sidebar structure and editorial homepage rhythm.
