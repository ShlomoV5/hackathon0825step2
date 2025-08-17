import { Router } from 'express';
const r = Router();

// /api/time-periods/presets
r.get('/presets', (req, res) => {
  const tz = (req.query.tz || 'Asia/Jerusalem'); // mock only; not shifting times here
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1);
  const thisWeekStart = new Date(todayStart); thisWeekStart.setDate(todayStart.getDate() - ((todayStart.getDay() + 6) % 7)); // Monday
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const fmt = d => d.toISOString();
  res.json({
    tz,
    presets: {
      today:     { from: fmt(todayStart),    to: fmt(now) },
      yesterday: { from: fmt(yesterdayStart), to: fmt(todayStart) },
      thisWeek:  { from: fmt(thisWeekStart), to: fmt(now) },
      thisMonth: { from: fmt(monthStart),    to: fmt(now) },
      custom:    { from: null, to: null }
    }
  });
});

export default r;