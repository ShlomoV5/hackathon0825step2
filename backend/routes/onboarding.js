import { Router } from 'express';
import { db, nextId } from '../lib/db.js';
import { extractAI } from '../lib/ai.js';

const r = Router();

// Create submission (structured fields only + notes)
// Fills missing industry/budget/intent from AI extract (does NOT override manual)
r.post('/submissions', (req, res) => {
  const {
    name, email, phone, website,
    company, industry, budget, intent, location,
    notes // ONLY free-text we store
  } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  // AI suggestions (from notes+website) – used only if field is missing
  const ai = extractAI({ text: notes || '', website: website || '' });

  const row = {
    id: nextId('ob'),
    ts: new Date().toISOString(),

    // structured/manual
    name: String(name).trim(),
    email: email ? String(email).trim() : null,
    phone: phone ? String(phone).trim() : null,
    website: website ? String(website).trim() : '',
    company: company ? String(company).trim() : null,
    industry: industry ?? (ai.industry || null),
    budget: (typeof budget === 'number')
      ? budget
      : (budget ? Number(budget) : (ai.budget ? Number(ai.budget) : null)),
    intent: intent ?? (ai.intent || null),
    location: location || null,

    // free-text for phone AI agent
    notes: notes || ''
  };

  db.onboarding.push(row);
  res.status(201).json(row);
});

// List / Get unchanged
r.get('/submissions', (_req, res) => res.json({ items: db.onboarding }));
r.get('/submissions/:id', (req, res) => {
  const row = db.onboarding.find(r => r.id === req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});
r.post('/reset', (_req, res) => { db.onboarding.length = 0; res.json({ ok: true }); });

// POST /api/onboarding/seed?count=1
// Creates mock leads in-memory (current server session)
r.post('/seed', (req, res) => {
  const count = Math.max(1, Math.min(100, Number(req.query.count || 1)));

  const industries = ['מגורים','משרדים','מסחר/קמעונאות','תעשייה/לוגיסטיקה','אירוח/מלונאות','בריאות','מולטיפמילי','נתונים/דאטה-סנטרים','קרקע/פיתוח','שימוש מעורב'];
  const intents = ['לקנייה', 'לשכירות'];
  const cities = ['ת״א','חיפה','ירושלים','ב״ש','אילת'];

  const created = [];
  for (let i = 0; i < count; i++) {
    const row = {
      id: nextId('ob'),
      ts: new Date().toISOString(),

      // structured fields:
      name: `ליד ${db.onboarding.length + i + 1}`,
      email: `lead${Math.floor(Math.random()*10000)}@example.com`,
      phone: `+9725${Math.floor(10000000 + Math.random()*89999999)}`,
      website: '',
      company: `חברת נדל״ן ${Math.floor(Math.random()*900)+100}`,
      industry: industries[Math.floor(Math.random()*industries.length)],
      budget: (Math.floor(Math.random()*90)+10) * 10000, // 100k–1M
      intent: intents[Math.floor(Math.random()*intents.length)],
      location: cities[Math.floor(Math.random()*cities.length)],

      // notes only (no freeText duplication)
      notes: ''
    };

    db.onboarding.push(row);
    created.push(row);
  }

  res.json({ ok: true, added: created.length, items: created });
});

export default r;