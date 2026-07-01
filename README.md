# Cordell Jones CRM — Agent Onboarding

**Read this file FIRST before touching anything in this repo or answering Cordell about his CRM.**

## Live CRM URL

**https://clearblueskykgs1962.github.io/**

This is the actual production dashboard Cordell calls from every day. Open it first — it shows you exactly what he's trying to do: a city-by-city cold-calling operation with a business card view, quick status buttons, an auto-generated 10-script calling sequence per business, call logging, and a tickler/follow-up file. Everything in this README exists to support what you see running at that URL.

## Who you're working with

Cordell Jones. Direct, no-nonsense, based in Harvard, IL (Central Time), also operates out of Savannah, GA. Runs a multi-city cold-calling business development operation. Values efficiency, hates repeated troubleshooting, hates hollow promises, hates wasted credits. Communicate concisely. Verify before you tell him something is done — if you say it's live, it must actually be live.

Personal credo: **"Form follows function."** If a deliverable isn't tested and working, don't call it finished.

## What this repo is

This is a static site (`clearblueskykgs1962.github.io`) — the live production CRM dashboard Cordell calls from. There is no backend/database. Everything is driven by two files:

- **`businesses.json`** — the entire business dataset, root of repo. Flat JSON array, one object per business.
- **`index.html`** — the entire app (UI + logic). Includes a client-side `HOOKS` object and `getScript()` function that auto-generates all 10 calling scripts (C1–C10) per business from its `category` field. Scripts are NOT stored per-business — they are generated on the fly, personalized with `contact`, `city`, and `category`.

There is no `_next`/React build actively serving traffic — an old Next.js export exists in a companion repo (`savannah-caller`) but the LIVE site is the plain HTML/JS version above. Always check `clearblueskykgs1962/clearblueskykgs1962.github.io` (not `savannah-caller`) for the current source of truth.

## Regions currently in `businesses.json` — DO NOT MIX

Verified live counts as of 2026-07-01: 1,318 total records across **three states**.

| State | id prefix | Count | Cities |
|---|---|---|---|
| Georgia | `sv_` | 575 | Savannah (1 city) |
| Idaho | `rx_` | 193 | Rexburg (1 city) |
| Utah | `ut_` | 550 | 81 cities (Salt Lake City, Sandy, Draper, Ogden, South Salt Lake, Lehi, South Jordan, Orem, Saint George, and more — 24 of these cities have only 1 business each) |

Utah is a multi-city region, not a single "Bountiful batch" — Bountiful is just one of its 81 cities. Expect more cities to be added within all three states over time (more Utah cities, more Idaho cities, more Georgia cities), not just new states. Each business record includes `city` and `state` — the dashboard's city selector filters by these. When importing a new batch, **confirm which state/city it belongs to before writing anything**, and never blend counts across states when reporting status back to Cordell. He will call you out immediately if numbers don't add up — get an exact count before you speak.

## Required fields on every business record

```
id, ref, name, phone, contact, title, stat, lastCallDate, callResult,
callCount, category, notes, nextAction, nextActionDate, city, state
```
Optional/extra fields (kept when available from source data): `address`, `zip`, `principal`, `gender`, `credit_score`, `employee_size`, `sales_volume`, `iusa_id`.

### `id` format

`{prefix}_{n}` where prefix is `sv`/`rx`/`ut` and `n` is a plain incrementing integer (not zero-padded), e.g. `sv_575`, `rx_193`, `ut_550`. **Before assigning new IDs**, compute `max(n)` for that prefix from the live file and continue from `n+1` — never guess or restart numbering. Never reuse or renumber existing IDs.

### Valid values for workflow fields

These fields represent call-workflow state, not source data — leave them **empty** (`""`) on every newly imported record, they get populated only as Cordell actually works the business:
- `stat`: empty until first call, then one of the values already in use in the live file (check `defaultAction()`/`HOOKS` logic in `index.html` before inventing a new one).
- `callResult`, `notes`, `nextAction`: freeform, but only ever set by the app itself (via `state` in localStorage) or a real call outcome — never fabricate a value on import.
- `lastCallDate`, `nextActionDate`: format `YYYY-MM-DD` (matches `parseDate()`/`todayStr()` in `index.html`). Wrong format silently breaks the tickler/reschedule logic — don't guess, use this format exactly.
- `callCount`: integer, starts at `0` for new imports.

### Phone field rule

`phoneLink()` in `index.html` strips all non-digit characters from `phone` and rebuilds a Google Voice one-click-call link (`https://voice.google.com/calls?a=nc,+1{10 digits}`). Any human-readable format works (`(912) 233-9672`, `912-233-9672`, etc.) as long as **at least 10 digits** are present — don't reformat existing numbers, they already work.
- If a source record has no usable phone number, set `phone` to the literal string `"Not Available"` (not blank, not null) — the app already renders this as "No phone" and it's consistent with the rest of the dataset.
- On import, flag/report how many records in the batch have no usable phone — don't silently drop them in as blank.

### Missing/optional data — mark, don't leave blank or null

For fields that are genuinely missing from source data (not workflow state), write an explicit placeholder string instead of `""`/`null`, so gaps are visible in the UI and to any agent looking at the raw JSON later:

| Field | Placeholder when missing |
|---|---|
| `title` | `No title given` |
| `address` | `No address listed` |
| `zip` | `No zip listed` |
| `gender` | `Not specified` |
| `credit_score` | `No credit score listed` |
| `employee_size` | `Not listed` |
| `sales_volume` | `Not listed` |
| `phone` | `Not Available` |

**Exception — do NOT placeholder `contact` or `principal`.** Both feed directly into `getScript()`'s greeting (`biz.contact || biz.principal` → `firstName` → `"Hi {firstName},"`). The app already has a safe built-in fallback to a generic `"Hi,"` opener when both are empty strings — that's exactly the desired behavior for a business with no listed owner. Injecting text like "No owner listed" into `contact` would get read aloud/typed as the person's name and break the script. Leave both **empty** (`""`) when no owner name exists in source data; do not touch this rule without Cordell's explicit sign-off.

## Script categories (the `HOOKS` object in `index.html`)

`category` MUST map to one of the defined `HOOKS` keys or it falls back to a generic "Other" script — which is NOT acceptable as a finished deliverable. Current buckets:

Restaurant/Food, Automotive, Healthcare, Legal, Retail, Construction, Real Estate,
Financial, Education, Medical, Beauty/Wellness, Hospitality, Government,
Professional Services, Religious, Manufacturing, Transportation, Security Services,
Cleaning Services, Senior Care, Nonprofit/Community, Industrial Trades,
Laboratories/Science, Energy/Utilities, Agriculture, Other

**When importing a new batch:** map each business's raw SIC/industry description into one of these buckets using keyword rules. If more than ~10–15% of a batch lands in "Other", that's a signal you need to add new `HOOKS` categories (with `pain`/`risk`/`hook`/`zoom` copy) rather than dump businesses into the generic bucket. Cordell explicitly wants scripts tailored "according to their business type and business needs and doings" — generic is not good enough.

## Script content rules (non-negotiable)

- Every script (C1–C10) must open with: `Hi [FirstName], this is Cordell Jones. You can reach me at 912-231-7452.`
- Never use the word **"honestly"** anywhere in script copy — flagged by Cordell as a credibility-killer. Audit for it on any new script content.
- Approach is soft-sell NEPQ (Needs, Exploration, Perceived value, Qualifying) — not hard pitch.

## How data arrives

Cordell uploads Excel files via chat (pattern: `roger-N.xlsx`, `roger-test.xlsx`, or similarly named). These typically contain business-list exports (Company Name, Executive First/Last Name, Address, City, State, ZIP, Phone, SIC descriptions, credit score, etc.) — NOT already in CRM schema.

**Import checklist — follow in order, every time:**
1. Re-fetch the live `businesses.json` (never work from a stale local copy).
2. Save a timestamped backup copy of the live file before making any change.
3. Dedupe the new batch against the live file by `name` + `phone`.
4. Map raw source columns into the schema above; apply the missing-data placeholder table for genuinely absent fields; leave workflow fields empty; leave `contact`/`principal` empty (never placeholdered).
5. Classify each record into a `HOOKS` category (add new categories if >10-15% would land in "Other").
6. Assign sequential `id`s continuing from the current max for that region's prefix.
7. Merge into the full dataset (never overwrite the whole file) — confirm the new record count for each state adds up (old count + batch size = new count, per state).
8. Validate before pushing: file parses as valid JSON, no duplicate `id`s, no record missing `city`/`state`.
9. Commit and push.
10. Re-fetch the live URL and confirm: total record count, per-state counts, and a sample of the new records look correct — don't just assume the commit succeeded.
11. Report back to Cordell with exact before/after counts per state — never round or estimate.

## Where to make changes

Repo: `clearblueskykgs1962/clearblueskykgs1962.github.io` (owner = connected GitHub account).
- Read current state: `GITHUB_GET_RAW_REPOSITORY_CONTENT` / `GITHUB_GET_REPOSITORY_CONTENT` for `businesses.json` and `index.html`.
- Commit changes: `GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS` (branch `main`). Large files (businesses.json is 500KB+) should be downloaded/edited/re-uploaded via a sandbox, then pushed through the remote workbench — pasting the full file inline as a tool argument is unreliable at this size.
- Always re-fetch the live file immediately before editing (don't work from a stale copy) — someone else (Cordell, another agent, or a prior session) may have already changed it.
- After pushing, verify with a fresh fetch of the live URL — don't just assume the commit succeeded.

## Standing preferences

- Keep responses tight. He explicitly asked for concise replies to save data.
- Never report cost/downgrade concerns unless a tool actually returns an insufficient-credits error.
- Never blame "the system" vaguely — if something's wrong, say exactly what and fix it.
- He is actively rolling out calling operations city-by-city; expect more `roger-*.xlsx`-style batches for new cities in GA, ID, and UT. Follow the same import pipeline every time.
