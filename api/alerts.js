import { redis } from "./_redis.js";
// POST { email } -> stores the address in the "alerts" set
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!redis) return res.status(503).json({ error: "storage not connected" });
  const email = req.body && typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return res.status(400).json({ error: "bad email" });
  await redis.hset("alerts", { [email]: new Date().toISOString() });
  return res.status(200).json({ ok: true });
}
