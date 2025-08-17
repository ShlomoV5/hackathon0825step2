import { Router } from 'express';
const r = Router();

r.get('/', (_req, res) => {
  res.send('Welcome to the AI Marketing app API');
});

r.get('/healthz', (_req, res) => res.json({ ok: true }));

export default r;