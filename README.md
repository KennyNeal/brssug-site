# BRSSUG site

This repository is a static site starter for moving BRSSUG off Google Sites and onto GitHub Pages.

It uses Astro because the site needs two things at once:

1. A flexible public-facing layout for a community site.
2. Build-time syncing from Sessionize so speaker data stays current.

Meeting info itself (title, date, speaker, links) lives as one markdown file per
meeting in `src/content/meetings/` — see `_TEMPLATE.md` in that folder.

## What is already set up

- Static GitHub Pages deployment.
- A build-time sync script for Sessionize speaker data.
- Seed content so the site still builds before API credentials are added.
- A custom domain file for `www.brssug.org`.

## Local development

```bash
npm install
npm run dev
```

For a fresh data pull before building:

```bash
npm run build
```

## API configuration

Set these environment variables locally or in GitHub Actions secrets:

- `SESSIONIZE_EVENT_ID`: the public Sessionize event ID or slug.
- `SESSIONIZE_API_BASE`: optional override for the Sessionize API base URL.

If any of those are missing, the site keeps using the seeded data and still builds.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds on push to `main`, on a schedule, and on manual dispatch. Add the secrets above to make the deployed site sync live data automatically.
