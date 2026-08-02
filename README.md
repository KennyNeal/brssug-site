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
- Build-time cross-posting of new meeting announcements to brdnug.org (WordPress) — currently dormant; see below.
- Build-time email notifications with ready-to-paste brdnug.org post text, for manual posting while the WordPress path is blocked.
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
- `WORDPRESS_API_BASE`: the brdnug.org WordPress REST API base, e.g. `https://brdnug.org/wp-json/wp/v2`.
- `WORDPRESS_USERNAME`: the WordPress user for cross-posting meetings.
- `WORDPRESS_APP_PASSWORD`: a WordPress Application Password for that user (not their login password).
- `WORDPRESS_CATEGORY_ID`: optional numeric WordPress category ID to file cross-posted meetings under.
- `GMAIL_USER`: the Gmail address to send brdnug.org post drafts from.
- `GMAIL_APP_PASSWORD`: a Gmail App Password for that account (not the account login password; requires 2FA enabled).
- `NOTIFY_EMAIL`: the address that receives the ready-to-paste post text.

If any of those are missing, the site keeps using the seeded data and still builds. If the
`WORDPRESS_*` variables are unset, meeting cross-posting to brdnug.org is skipped entirely (this is
currently the case — brdnug.org's host strips the `Authorization` header before it reaches
WordPress, so REST API auth fails there; the WordPress script is left in place, disabled, for when
that's resolved). If the `GMAIL_*`/`NOTIFY_EMAIL` variables are unset, no email is sent. When
configured, the email step only fires for meeting files added or changed in that specific push
(not on the daily rebuild cron), so you get exactly one email per new/edited meeting.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds on push to `main`, on a schedule, and on manual dispatch. Add the secrets above to make the deployed site sync live data and cross-post meetings automatically.
