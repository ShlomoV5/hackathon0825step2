import { Router } from 'express';
import { extractAI } from '../lib/ai.js';

const r = Router();
r.post('/extract', (req, res) => {
  const { text, website } = req.body || {};
  if (!text && !website) return res.status(400).json({ error: 'Provide text or website' });
  res.json(extractAI({ text, website }));
});
export default r;