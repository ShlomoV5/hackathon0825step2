// routes/agent-api.js
import { Router } from 'express';
import twilio from 'twilio';
import { db } from '../lib/db.js';

const r = Router();

const BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';

// POST /api/agent/call-lead  { leadId }
r.post('/call-lead', async (req, res) => {
  const { leadId } = req.body || {};
  const lead = db.onboarding.find(x => x.id === leadId);
  if (!lead) return res.status(404).json({ error: 'lead not found' });

  // Determine destination number: request override -> env owner -> lead phone
  const toOverride = req.body?.to || process.env.AGENT_OWNER_PHONE || null;
  const to = toOverride || lead.phone;
  if (!to) return res.status(400).json({ error: 'no destination phone available' });

  // Read Twilio env at request time
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_TEST_SID;
  const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN  || process.env.TWILIO_TEST_AUTH;
  const FROM        = process.env.TWILIO_FROM        || process.env.TWILIO_TEST_FROM;

  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM) {
    return res.status(500).json({ error: 'Twilio credentials are missing in server process', details: { ACCOUNT_SID: ACCOUNT_SID || null, FROM: FROM || null } });
  }

  // Prefer an externally reachable PUBLIC_BASE_URL (ngrok) for Twilio callbacks
  const publicBase = process.env.PUBLIC_BASE_URL || BASE_URL;
  // Twilio requires a publicly reachable URL (prefer HTTPS). Reject localhost URLs.
  if (/^https?:\/\/localhost(:|$)/i.test(publicBase) || /^http:\/\/(127\.0\.0\.1|\[::1\])/.test(publicBase)) {
    return res.status(400).json({ error: 'PUBLIC_BASE_URL must be set to an externally reachable HTTPS URL (for example your ngrok https URL). Current PUBLIC_BASE_URL appears to be localhost or missing.', current: publicBase });
  }

  const url = `${publicBase.replace(/\/$/, '')}/voice/agent/start?leadId=${encodeURIComponent(lead.id)}`;
  const statusCb = `${publicBase.replace(/\/$/, '')}/voice/agent/status`;

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const call = await client.calls.create({ to, from: FROM, url, statusCallback: statusCb, statusCallbackEvent: ['initiated','ringing','answered','completed'] });
    res.json({ ok: true, callSid: call.sid, to });
  } catch (e) {
    console.error('[agent-api] Twilio call error:', e);
    res.status(500).json({ error: e.message, details: e });
  }
});

export default r;
