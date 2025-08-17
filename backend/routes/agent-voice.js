import { Router } from 'express';
import twilio from 'twilio';
import { db } from '../lib/db.js';
import { agentDecideTurn } from '../lib/agent.js';

const r = Router();
const { VoiceResponse } = twilio.twiml;

// simple in-memory transcript per call
const sessions = new Map(); // CallSid -> { leadId, history: [{role:'user'|'assistant', content:string}] }

function say(vr, text) {
  vr.say({ language: 'he-IL' }, text);
}

function applyUpdates(lead, up) {
  if (!up) return;
  if (up.name && (!lead.name || lead.name === 'ממתין לשם')) lead.name = up.name;
  if (up.intent && !lead.intent) lead.intent = up.intent;
  if (up.industry && !lead.industry) lead.industry = up.industry;
  if (up.budget && !lead.budget) lead.budget = up.budget;
  if (up.notes) lead.notes = ((lead.notes||'') + `\n${up.notes}`).slice(-4000);
}

function gatherTo(vr, path, leadId) {
  vr.gather({
    input: 'speech', language: 'he-IL', speechTimeout: 'auto',
    action: `/voice/agent/${path}?leadId=${encodeURIComponent(leadId)}`,
    method: 'POST'
  });
}

// GET/POST /voice/agent/start?leadId=...
r.all('/start', async (req, res) => {
  const leadId = String(req.query.leadId||'').trim();
  const vr = new VoiceResponse();
  const lead = db.onboarding.find(x => x.id === leadId);

  if (!lead) { say(vr, 'לא נמצא ליד מתאים.'); vr.hangup(); return res.type('text/xml').send(vr.toString()); }

  const callSid = req.body?.CallSid || `SIM_${Math.random().toString(36).slice(2,8)}`;
  sessions.set(callSid, { leadId, history: [] });

  const { reply, next } = await agentDecideTurn({
    lead, history: [], userText: '__start__',
    offer: db.offer,
    catalog: db.properties
  });

  sessions.get(callSid).history.push({ role:'assistant', content: reply });

  say(vr, reply);
  if (next === 'end') { vr.hangup(); }
  else { gatherTo(vr, 'gather', leadId); }

  res.type('text/xml').send(vr.toString());
});

// POST /voice/agent/gather
r.post('/gather', async (req, res) => {
  const vr = new VoiceResponse();
  const leadId = String(req.query.leadId||'').trim();
  const lead = db.onboarding.find(x => x.id === leadId);
  if (!lead) { say(vr, 'שגיאה פנימית.'); vr.hangup(); return res.type('text/xml').send(vr.toString()); }

  const callSid = req.body?.CallSid || 'SIM';
  const sess = sessions.get(callSid) || { leadId, history: [] };

  const userText = (req.body.SpeechResult || '').trim();
  if (userText) sess.history.push({ role:'user', content: userText });

  const { reply, updates, next, suggest, cta } = await agentDecideTurn({
    lead, history: sess.history, userText,
    offer: db.offer,
    catalog: db.properties
  });

  // persist field updates
  applyUpdates(lead, updates);
  if (updates?.status) lead.status = updates.status;
  if (Array.isArray(suggest) && suggest.length) {
    const ids = suggest.map(s=>s.id).join(', ');
    lead.notes = (lead.notes || '') + `\n[המלצות] ${ids}`;
  }
  if (cta === 'send_details') {
    lead.status = lead.status || 'details_sent';
    lead.notes = (lead.notes || '') + `\n[פעולה] לשלוח פרטים ותמונות לנכסים שהוצעו`;
  }
  if (cta === 'meeting') {
    lead.status = 'scheduled';
    lead.notes = (lead.notes || '') + `\n[פעולה] לתאם סיור/פגישה`;
  }
  console.log('Lead after update:', lead);

  // append assistant turn
  sess.history.push({ role:'assistant', content: reply });
  sessions.set(callSid, sess);

  say(vr, reply);
  if (next === 'end') {
    lead.lastCallTs = new Date().toISOString();
    lead.callOutcome = 'completed';
    vr.hangup();
    sessions.delete(callSid);
  } else {
    gatherTo(vr, 'gather', leadId);
  }

  res.type('text/xml').send(vr.toString());
});

// optional status webhook
r.post('/status', (_req, res) => res.sendStatus(204));

export default r;
