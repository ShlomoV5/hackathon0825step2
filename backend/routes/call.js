import { Router } from 'express';
import twilio from 'twilio';
import { db, nextId } from '../lib/db.js';

const r = Router();

// POST /api/call/test
r.post('/test', async (req, res) => {
  const { lead } = req.body;
  if (!lead || !lead.id) {
    return res.status(400).json({ error: 'Missing lead information' });
  }

  try {
    const client = twilio(process.env.TWILIO_TEST_SID, process.env.TWILIO_TEST_AUTH);
    const call = await client.calls.create({
      to: '+15005550006',        // Twilio magic test number
      from: process.env.TWILIO_TEST_FROM,
      url: 'http://demo.twilio.com/docs/voice.xml'
    });

    const results = ['answered', 'no_answer', 'voicemail', 'bad_number'];
    const randomResult = results[Math.floor(Math.random() * results.length)];

    const newCall = {
      id: nextId('call'),
      ts: new Date().toISOString(),
      clientId: lead.id,
      result: randomResult,
      durationSec: randomResult === 'answered' ? Math.floor(Math.random() * 240) : 0
    };
    db.calls.unshift(newCall);

    res.json({ status: call.status, callSid: call.sid, callRecord: newCall });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default r;