import { Router } from 'express';
import { db } from '../lib/db.js';
import { parseRange, filterByRange, groupByDay } from '../lib/utils.js';

const r = Router();

// /api/metrics/calls-per-day
r.get('/calls-per-day', (req, res) => {
  const { start, end } = parseRange(req.query);
  const windowCalls = filterByRange(db.calls, start, end);
  res.json({
    from: start.toISOString(),
    to: end.toISOString(),
    series: groupByDay(windowCalls)
  });
});

// /api/metrics/call-results
r.get('/call-results', (req, res) => {
  const { start, end } = parseRange(req.query);
  const windowCalls = filterByRange(db.calls, start, end);
  const buckets = {};
  for (const c of windowCalls) buckets[c.result] = (buckets[c.result] || 0) + 1;
  res.json({
    from: start.toISOString(),
    to: end.toISOString(),
    breakdown: Object.entries(buckets).map(([label, value]) => ({ label, value }))
  });
});

export default r;