import { Router } from 'express';
import { seedMock, db } from '../lib/db.js';

const r = Router();

// POST /api/mock/seed
r.post('/seed', (_req, res) => {
  seedMock();
  res.json({ ok: true, calls: db.calls.length, clients: db.clients.length });
});

export default r;