import { redis } from "./_redis.js";
// Night Shift results. POST { n: night, r: result } -> { counts: { survived: 12, counted: 30, ... } }
// GET ?n=1 -> same counts without adding.
const RESULTS = ["survived", "door", "peephole", "counted", "answered", "waved", "looked", "twice", "outside", "followed", "carrier"];
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!redis) return res.status(503).json({ error: "storage not connected" });
  let n;
  if (req.method === "POST") {
    const b = req.body || {};
    n = b.n;
    if (!Number.isInteger(n) || n < 1 || n > 12 || !RESULTS.includes(b.r)) return res.status(400).json({ error: "bad input" });
    await redis.hincrby("shift:" + n, b.r, 1);
  } else if (req.method === "GET") {
    n = parseInt(req.query && req.query.n, 10);
    if (!(n >= 1 && n <= 12)) return res.status(400).json({ error: "bad night" });
  } else return res.status(405).end();
  const counts = (await redis.hgetall("shift:" + n)) || {};
  for (const k in counts) counts[k] = Number(counts[k]);
  return res.status(200).json({ counts });
}
