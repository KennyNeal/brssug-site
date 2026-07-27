# BRSSUG Migration Plan: Google Site → Static Astro Site

## 1. Site Comparison

### Current Google Site (brssug.org) — Pages
| Page | Status in Astro Site |
|------|---------------------|
| Home | DONE — hero w/ CTA, next meeting strip, upcoming/past meetings, about section, speakers, Day of Data CTA, sponsorship CTA |
| About BRSSUG | DONE — `/about/` with partner groups, not-for-profit info, organizers |
| Call for Speakers | DONE — `/call-for-speakers/` |
| Mailing List & Contact Info | DONE — `/contact/` with Meetup, email, Twitter/X, Bluesky, LinkedIn, YouTube cards |
| Sponsor a Meeting | DONE — `/sponsorship/` with pricing and details |
| Code of Conduct | DONE — `/code-of-conduct/` |
| **Jobs** | **MISSING — needs `/jobs/` and `/jobs/add/` pages** |
| **Jobs / Add Your Job Posting** | **MISSING — subpage of Jobs** |
| Location Information | DONE — `/location/` with primary & alternate venue |
| Upcoming Events Schedule | PARTIAL — `/calendar/` page has text/links but **no Google Calendar embed iframe** |
| Meetup (external link) | DONE — nav link w/ CTA button |
| SQL Saturday Baton Rouge (external) | DONE — nav link + Day of Data section on home page |

### Navigation Comparison
| Google Site Nav | Astro Site Nav |
|----------------|---------------|
| Home | Home |
| Meetup | Join on Meetup (CTA button) |
| About BRSSUG | About |
| Call for Speakers | Speak |
| Mailing List & Contact Info | Contact |
| Sponsor a Meeting | Sponsorship |
| Code of Conduct | (in footer only) |
| Jobs (dropdown: Add Your Job Posting) | **MISSING** |
| Location Information | Location |
| Upcoming Events Schedule | (Calendar link in footer) |
| SQL Saturday Baton Rouge | Day of Data (external link) |

### Content & Feature Gaps
| Missing Feature | Priority | Notes |
|----------------|----------|-------|
| **Jobs page + Add Your Job Posting subpage** | HIGH | Google Site uses an embedded Google Sheet for job listings. Astro needs equivalent. |
| **Google Calendar embed on /calendar/** | MEDIUM | Google Site has an iframe embed of `sqlpassbr@gmail.com` calendar. Astro page only has text links. |
| **Google Calendar embed on home page** | LOW | Google Site shows it below the event section. Could skip since it's duplicated on /calendar/. |
| **Speaker bios in meeting frontmatter** | MEDIUM | Google Site shows full speaker bio inline. Astro meeting markdown has `bio:` field but it's optional. The Thomas LeBlanc meeting file doesn't use it — Sessionize is the source. For non-Sessionize speakers, the `bio` field should be used. |
| **SEO meta tags (OG, Twitter cards)** | MEDIUM | Google Site has OG tags. Astro's BaseLayout could add proper OG tags per page. |
| **Meetup events widget on home page** | LOW | Google Site has an embedded link preview. Astro's MeetingCard system is better. |
| **Social links in footer (Slack)** | LOW | Google Site has a Slack link. Astro's Contact page doesn't list Slack. |
| **Volunteers page** | LOW | Google Site has `/volunteers` (SQL Saturday related). Not in Astro. |

### Data Discrepancies Found
| Field | Google Site | Astro site.json | Action |
|-------|-------------|-----------------|--------|
| Meeting schedule | "Second Wednesday" | "Second Tuesday" | **FIX: update site.json to "Second Wednesday"** |
| Meeting time | 6:00 PM | 6:00 PM | Match ✓ |
| Primary location | Jones Creek Library | Jones Creek Regional Library | Match ✓ |

---

## 2. Migration Tasks (Priority Order)

### Phase 1: Critical Fixes (do first)

**1a. Fix `src/data/generated/site.json`**
- Change `meetingSchedule` from `"Second Tuesday of the month · 6:00 PM"` to `"Second Wednesday of the month · 6:00 PM"`

**1b. Fix `astro.config.mjs` for custom domain**
- Change `site` from `'https://kennyneal.github.io'` to `'https://www.brssug.org'`
- Change `base` from `'/brssug-site'` to `''` (or remove it — root-level site)
- The CNAME file at `public/CNAME` already has `www.brssug.org` ✓

**1c. Set up GitHub Pages with custom domain**
- In GitHub repo settings → Pages → set Custom domain to `www.brssug.org`
- Add DNS CNAME record at your registrar pointing `www.brssug.org` → `kennyneal.github.io`
- Wait for DNS propagation and HTTPS provisioning

### Phase 2: Missing Pages

**2a. Create `/jobs/` page**
- Add a Jobs page listing current openings
- Option A: Static markdown list (simplest, no backend)
- Option B: Embed the existing Google Sheet (like the Google Site does)
- Option C: Read from a JSON data file in `src/data/`
- Recommended: Option A + C — keep a `src/data/jobs.json` file that gets rendered on the page. Add a "Post a Job" link pointing to the submission form.

**2b. Create `/jobs/add/` page**
- A contact form or Google Form embed for submitting job postings
- Google Site links to a Google Form — can replicate that
- Keep it simple: link to a Google Form + email option

**2c. Update navigation in `BaseLayout.astro`**
- Add "Jobs" link to the primary nav bar
- Add "Jobs" to the footer nav

**2d. Add Calendar embed to `/calendar/` page**
- Add an iframe embed of the Google Calendar: `https://calendar.google.com/calendar/embed?src=sqlpassbr%40gmail.com&ctz=America%2FChicago`
- Make it responsive (the Google Site's iframe is 100% width with padding trick)

### Phase 3: Enhancements

**3a. Speaker bio in meeting detail pages**
- The `bio` field exists in the meeting frontmatter schema but isn't rendered on any page
- Either add a dedicated meeting detail page (`/meetings/[slug]/`) or show bio on the event card
- For non-Sessionize speakers, populate `bio` in the meeting markdown file

**3b. OG / SEO meta tags**
- Add per-page OG tags to `BaseLayout.astro` (title, description, image)
- Pass `ogImage` prop from each page layout
- Add `twitter:card` meta tags

**3c. Add Slack to contact page**
- Google Site links to Slack: `https://join.slack.com/t/brusergroups/shared_invite/zt-39dtce6qo-O6~WwrCGITKw0MzWCpY91A`
- Add a "Slack" contact card to `/contact/`

### Phase 4: Cleanup & Polish

**4a. Remove `base` pathing quirks**
- The `base` variable is used everywhere: `const base = import.meta.env.BASE_URL.replace(/\/$/, '')`
- Once `base` is removed from `astro.config.mjs`, all these paths become simpler
- Audit all internal links to ensure they work without the `/brssug-site` prefix

**4b. Styling for new pages**
- Add CSS for jobs page (table/list layout)
- Add CSS for calendar embed (responsive iframe container)
- Add responsive styles for the new nav items

---

## 3. Backend Workflow: Meeting Publishing Pipeline

### Concept: "One Markdown File Per Meeting"

The existing system is already close to ideal. The workflow is:

```
1. Create a markdown file in src/content/meetings/YYYY-MM-DD-speaker-slug.md
2. Fill in frontmatter (title, date, speaker, meetupUrl, bio, sponsor)
3. Write the session abstract as the body text
4. Commit → push → CI builds and deploys
```

### Enhancement: Automated Reminders (via Hermes Cron Jobs)

To help with the "remind me to publish on Meetup and post to social media" requirement, I'll set up cron-based reminders that run on a schedule tied to the meeting cadence.

**Cron Job 1: Meeting Preparation Reminder**
Runs ~2 weeks before the next scheduled meeting. Prompts to:
- Confirm speaker and title
- Publish the Meetup event
- Create the meeting markdown file in the repo
- Write speaker bio

**Cron Job 2: Post-Meeting Follow-up**
Runs the day after the meeting. Prompts to:
- Add YouTube recording URL to the meeting markdown
- Post recording to social media (X/Twitter, LinkedIn, Bluesky)
- Thank the speaker
- Publish any follow-up content

**Cron Job 3: Weekly Social Media Reminder**
Runs weekly to remind about posting on social media if there's an upcoming meeting.

### Alternative: GitHub Actions + Issues

Instead of Hermes cron, you could use the GitHub Actions workflow already in the repo to:
- Auto-create a GitHub Issue when a meeting is approaching (via a scheduled workflow)
- Use the issue as a checklist template for the publishing workflow

### Recommended Approach

**For the meeting publishing workflow:**
- Keep the markdown file approach (it's already working well)
- Add a `meeting-prep-checklist.md` template to the repo
- Consider adding a GitHub Issue template for "New Meeting" that auto-creates the checklist

**For the reminders (via Hermes):**
I'll set up 3 cron jobs:

1. **Meeting Prep Reminder** — runs 14 days before each meeting date (check content collection for the next upcoming meeting date)
2. **Post-Meeting Follow-up** — runs 1 day after the meeting  
3. **Weekly Social Media Check** — every Monday at 9 AM

---

## 4. Summary of Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/pages/jobs.astro` | Jobs listing page |
| `src/pages/jobs/add.astro` | Submit a job posting page |
| `src/data/jobs.json` | Jobs data file |

### Modify Existing Files
| File | Change |
|------|--------|
| `src/data/generated/site.json` | Fix `meetingSchedule` → "Second Wednesday" |
| `astro.config.mjs` | Remove `base`, fix `site` URL |
| `src/layouts/BaseLayout.astro` | Add Jobs nav link, SEO/OG tags, Slack footer link |
| `src/pages/calendar.astro` | Add Google Calendar iframe embed |
| `src/pages/contact.astro` | Add Slack card |
| `src/styles/global.css` | Add styles for jobs page, calendar embed |

### Deployment
- DNS: CNAME `www.brssug.org` → `kennyneal.github.io`
- GitHub: Set custom domain in repo Pages settings
- Actions: The deploy workflow already handles the build → deploy cycle