/**
 * GET /api/load-dua?id=<ID>
 *
 * Retrieves a stored dua payload from Upstash Redis by ID.
 * Returns the original JSON payload, or 404 if expired / not found.
 *
 * Requires env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

export default async function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── Validate ID ─────────────────────────────────────────────────
  const { id } = req.query;
  if (!id || typeof id !== 'string' || id.length > 20) {
    return res.status(400).json({ error: 'Missing or invalid id' });
  }

  // ── Env check ───────────────────────────────────────────────────
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({ error: 'not_configured' });
  }

  // ── Fetch from Upstash ──────────────────────────────────────────
  let upstashRes;
  try {
    upstashRes = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['GET', `dua:${id}`]),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Redis unreachable', detail: err.message });
  }

  if (!upstashRes.ok) {
    return res.status(500).json({ error: 'Redis read failed' });
  }

  const data = await upstashRes.json();

  if (!data.result) {
    return res.status(404).json({
      error: 'not_found',
      message: 'This link has expired or does not exist. Ask the sender to share a new link.',
    });
  }

  // ── Parse and return ────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(data.result);
  } catch {
    return res.status(500).json({ error: 'Corrupt data in storage' });
  }

  // Cache for a short time since the data won't change
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  return res.status(200).json(payload);
}
