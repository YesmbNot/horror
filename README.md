# WKVN-9 on Vercel

## Deploy
1. Put this folder in a GitHub repo (or run `npx vercel` inside it).
2. vercel.com → Add New → Project → import the repo → Deploy. No build settings needed.

The site works right away. Knock tally and alert list show "line busy" until storage is connected.

## Turn on the knock tally + alert list
Vercel project → Storage → Create/Connect → **Upstash for Redis** (free tier) → connect to this project → Redeploy.
The env vars (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) are added automatically.

## Get the alert-list e-mails
Upstash console → your database → Data Browser → key `alerts` (hash: email → signup time).

## Domain
Vercel project → Settings → Domains → add e.g. `wkvn9.com`.

## Test the 3:33 live mode
Open `https://your-site/#calibrate`.

## Files
- `index.html` — main site. `404.html` — "SIGNAL LOST" page with easter eggs (try `/pepper`, `/333`, `/guest`).
- `robots.txt` → points to `/transmitter-room` (hidden engineer log).
- `og.jpg` — link preview picture (Telegram, Discord, TikTok bio link).
- `tapes/wkvn-tape-NN.mp3` — downloadable tape audio (spectrogram + reversed whisper survive).

## New episode = update the site
In `index.html`, search `var RELEASE`. Each episode has a release time in UTC:
```
var RELEASE = { 1:"...", 2:"...", 3:"2026-09-29T17:00:00Z", 4:"2026-09-30T17:00:00Z" };
```
When the time passes, the site unlocks on its own: new rule block, Dale's bio gets worse, new guestbook posts, new tape in the library, new staff memo.
To add episode 5+: add a line to `RELEASE`, `RULES`, `DALE`, `TAPES`, `MEMOS` (and guestbook posts with `ep:5`), put `wkvn-tape-05.mp3` into `tapes/`, redeploy.

## Link preview with a domain
Some apps need an absolute image URL. After adding a domain, change `/og.jpg` to `https://your-domain/og.jpg` in the `og:image` and `twitter:image` lines.
