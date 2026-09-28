import { redis } from "./_redis.js";
// GET -> { counts: { "7": 12, "8": 3 } }   POST { n } -> adds one report
export default async function handler(req, res) {
  if (!redis) return res.status(503).json({ error: "storage not connected" });
  if (req.method === "POST") {
    const n = req.body && req.body.n;
    if (!Number.isInteger(n) || n < 0 || n > 99) return res.status(400).json({ error: "bad number" });
    await redis.hincrby("knocks", String(n), 1);
  } else if (req.method !== "GET") return res.status(405).end();
  const counts = (await redis.hgetall("knocks")) || {};
  for (const k in counts) counts[k] = Number(counts[k]);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ counts });
}
