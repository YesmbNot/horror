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
