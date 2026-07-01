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

| Region | id prefix | Count (as of 2026-07-01) | Source |
|---|---|---|---|
| Savannah, GA | `sv_` | 575 | original master list |
| Rexburg, ID | `rx_` | 193 | separate earlier batch — leave alone unless Cordell asks about Rexburg specifically |
| Utah (Bountiful area) | `ut_` | 550 | Cordell's `roger-*.xlsx` uploads, 2026-07-01 |

Each business record includes `city` and `state` — the dashboard's city selector filters by these. When importing a new batch, **confirm which region/city it belongs to before writing anything**, and never blend counts across regions when reporting status back to Cordell. He will call you out immediately if numbers don't add up — get an exact count before you speak.

## Required fields on every business record

```
id, ref, name, phone, contact, title, stat, lastCallDate, callResult,
callCount, category, notes, nextAction, nextActionDate, city, state
```
Optional/extra fields (kept when available from source data): `address`, `zip`, `principal`, `gender`, `credit_score`, `employee_size`, `sales_volume`, `iusa_id`.

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

Cordell uploads Excel files via chat (pattern: `roger-N.xlsx`, `roger-test.xlsx`, or similarly named). These typically contain business-list exports (Company Name, Executive First/Last Name, Address, City, State, ZIP, Phone, SIC descriptions, credit score, etc.) — NOT already in CRM schema. Your job: dedupe (by name+phone), map fields into the schema above, classify into a `HOOKS` category, assign sequential IDs with the correct region prefix, and merge into `businesses.json` — never overwrite the whole file without merging in the other regions first.

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
- He is actively rolling out calling operations city-by-city; expect more `roger-*.xlsx`-style batches for new cities. Follow the same import pipeline every time.
