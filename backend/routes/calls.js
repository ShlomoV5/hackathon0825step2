import { Router } from 'express';
import { db } from '../lib/db.js';
import { parseRange } from '../lib/utils.js';

const r = Router();

// GET /api/calls?from&to&limit=50
r.get('/', (req, res) => {
  const { start, end } = parseRange(req.query);
  const limit = Number(req.query.limit || 50);
  const s = start.getTime(), e = end.getTime();

  const items = db.calls
    .filter(r => {
      const t = new Date(r.ts).getTime();
      return t >= s && t <= e;
    })
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, limit)
    .map(c => ({
      id: c.id,
      ts: c.ts,
      clientId: c.clientId,
      clientName: (db.clients.find(x => x.id === c.clientId) || {}).name || null,
      result: c.result,
      durationSec: c.durationSec
    }));

  res.json({ from: start.toISOString(), to: end.toISOString(), items });
});

export default r;
