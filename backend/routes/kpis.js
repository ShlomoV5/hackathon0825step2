import { Router } from 'express';
import { db } from '../lib/db.js';
import { parseRange, filterByRange } from '../lib/utils.js';

const r = Router();

r.get('/', (req, res) => {
  const { start, end } = parseRange(req.query);
  const windowCalls = filterByRange(db.calls, start, end);
  const answered = windowCalls.filter(c => c.result === 'answered');
  const total = windowCalls.length;
  const answerRate = total ? Math.round((answered.length / total) * 100) : 0;

  const totalDurationSec = windowCalls.reduce((sum, c) => sum + c.durationSec, 0);
  const avgDurationSec = total > 0 ? Math.round(totalDurationSec / total) : 0;
  const avgCallDuration = `${String(Math.floor(avgDurationSec / 60)).padStart(2, '0')}:${String(avgDurationSec % 60).padStart(2, '0')}`;

  const windowLeads = filterByRange(db.onboarding, start, end);

  res.json({
    from: start.toISOString(),
    to: end.toISOString(),
    kpis: {
      totalCalls: total,
      answeredCalls: answered.length,
      answerRatePct: answerRate,
      avgCallDuration: avgCallDuration,
      leads: windowLeads.length
    }
  });
});

export default r;
