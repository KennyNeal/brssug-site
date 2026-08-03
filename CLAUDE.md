# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static site for BRSSUG (Baton Rouge .NET/SQL Server user group), built with Astro, deployed to GitHub
Pages. Migrating off Google Sites. The custom domain `www.brssug.org` is **not yet live** — DNS still
points at the old host, so the production build currently targets the GitHub Pages project URL
(`https://kennyneal.github.io/brssug-site/`) with a `/brssug-site` base path, controlled by the
`GITHUB_PAGES_PROJECT_PREVIEW` env var in `.github/workflows/deploy.yml` and read in `astro.config.mjs`.
When the domain cuts over, remove that env var from the workflow — no other changes needed.

## Commands

```bash
npm install
npm run dev          # local dev server
npm run build         # runs sync:data, then astro build (this is what CI runs)
npm run preview
npm run check         # astro check (type-checking)
npm run sync:data      # pull Sessionize speaker data into src/data/generated/*.json
npm run sync:wordpress # cross-post meetings to brdnug.org (currently dormant, see below)
npm run sync:email     # email a ready-to-paste post draft for brdnug.org
```

There is no test suite. `npm run check` (astro check / tsc) is the closest thing to CI validation
locally, plus `npm run build` actually building successfully.

## Architecture

**Content model**: each user group meeting is one markdown file in `src/content/meetings/`, named
`YYYY-MM-DD-speaker-slug.md`. The filename becomes both the site's URL slug and (when WordPress
cross-posting is active) the WordPress post slug — the two must match. Copy `_TEMPLATE.md` when
adding a meeting by hand. Frontmatter schema is defined in `src/content/config.ts` (zod, validated
at build time via Astro's content collections).

**Two data sources merge per meeting** (see `src/pages/meetings/[slug].astro`):
1. The meeting's own frontmatter/body (title, date, speaker, sponsor, links, etc.) — always
   authoritative when present.
2. Sessionize-sourced speaker data (`src/data/generated/speakers.json`), matched via the
   meeting's `sessionizeId` field. Used as a *fallback* for bio and session description when the
   meeting file doesn't specify its own — never overrides content the markdown file provides.

`src/data/generated/{site,speakers}.json` are build artifacts written by `scripts/sync-content.mjs`
(via `npm run sync:data`, which runs before `astro build`). They are seeded with fallback content
checked into the repo so the site still builds with no API credentials configured; the sync script
merges live Sessionize data on top when `SESSIONIZE_EVENT_ID` is set, and never fails the build if
the API call fails (warnings get folded into `site.json`'s `syncStatus` instead).

**Automated meeting intake**: `.github/ISSUE_TEMPLATE/new-meeting.yml` lets someone file a "New
meeting" issue instead of writing the markdown file by hand. The `meeting`-labeled issue triggers
`.github/workflows/create-meeting-from-issue.yml`, which runs `scripts/create-meeting-from-issue.mjs`
(parsing via the shared `scripts/lib/parse-meeting.mjs` frontmatter parser used by both that script
and `sync-wordpress.mjs`), validates the result with a full `npm run build`, and opens a PR
(`Closes #<issue>`) — or comments on the issue explaining what to fix if parsing or the build fails.
`main` is protected, so this always goes through a PR, never a direct push.

**WordPress cross-posting is intentionally dormant**: `scripts/sync-wordpress.mjs` cross-posts new/
changed meetings to brdnug.org, but brdnug.org's host currently strips the `Authorization` header
before WordPress sees it, so REST API auth fails there. The script is left in place (and still runs
in CI with `continue-on-error: true`) for when that's fixed — don't "clean it up" as dead code.
While it's blocked, `scripts/email-brdnug-post.mjs` emails a ready-to-paste post draft instead, but
only for meeting files actually added/changed in the triggering push (diffed via
`GITHUB_EVENT_BEFORE`/`GITHUB_EVENT_AFTER`), not on the daily rebuild cron — so exactly one email
per new/edited meeting, not one per day.

**Required env vars** (all optional — site builds with seeded/fallback data if unset; see README.md
for the full list): `SESSIONIZE_EVENT_ID`, `SESSIONIZE_API_BASE`, `WORDPRESS_API_BASE`,
`WORDPRESS_USERNAME`, `WORDPRESS_APP_PASSWORD`, `WORDPRESS_CATEGORY_ID`, `GMAIL_USER`,
`GMAIL_APP_PASSWORD`, `NOTIFY_EMAIL`.

## Frontend Aesthetics
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!

## Deploy

`.github/workflows/deploy.yml` builds and deploys on push to `main`, on a daily cron, and on manual
dispatch. All three sync scripts run as part of the build step; the WordPress and email steps use
`continue-on-error: true` so a failure there never blocks the deploy.
