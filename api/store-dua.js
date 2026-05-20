/**
 * POST /api/store-dua
 *
 * Accepts a JSON payload (the dua data), stores it in Upstash Redis
 * with a 30-day TTL, and returns a short random ID.
 *
 * The client then shares:
 *   https://daleel-hajj-app.vercel.app/receive?id=<ID>
 *
 * Requires env vars:
 *   UPSTASH_REDIS_REST_URL   — the REST URL from your Upstash dashboard
 *   UPSTASH_REDIS_REST_TOKEN — the REST token from your Upstash dashboard
 */

export default async function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Env check ───────────────────────────────────────────────────
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'Upstash Redis is not set up. See SETUP.md for instructions.',
    });
  }

  // ── Parse body ──────────────────────────────────────────────────
  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!payload || typeof payload !== 'object') throw new Error('invalid');
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // ── Generate a short ID (10 URL-safe chars) ──────────────────────
  const id =
    Math.random().toString(36).slice(2, 7) +
    Math.random().toString(36).slice(2, 7);

  // ── Store in Upstash Redis — 30-day TTL ─────────────────────────
  const value = JSON.stringify(payload);
  const TTL = 30 * 24 * 60 * 60; // 30 days in seconds

  let upstashRes;
  try {
    upstashRes = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', `dua:${id}`, value, 'EX', TTL]),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Redis unreachable', detail: err.message });
  }

  if (!upstashRes.ok) {
    const text = await upstashRes.text().catch(() => '');
    return res.status(500).json({ error: 'Redis write failed', detail: text });
  }

  return res.status(200).json({ id });
}
