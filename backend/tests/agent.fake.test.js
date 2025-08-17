process.env.NODE_ENV = 'test';
process.env.AGENT_FAKE_MODE = '1';

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import app from '../server.js';
import { db } from '../lib/db.js';

describe('Outbound AI agent (FAKE MODE) E2E', () => {
  let leadId;

  beforeEach(async () => {
    // reset leads only
    db.onboarding.length = 0;

    // create a fresh lead missing intent/industry/budget
    const res = await request(app)
      .post('/api/onboarding/submissions')
      .send({ name: 'ישראל', phone: '+972500000000', notes: '' })
      .expect(201);
    leadId = res.body.id;
  });

  it('should not qualify lead if missing required fields', async () => {
    // Start call with incomplete lead
    const start = await request(app)
      .get('/voice/agent/start')
      .query({ leadId })
      .expect(200);

    expect(start.text).toContain('<Gather');

    // Only answer intent
    const t1 = await request(app)
      .post('/voice/agent/gather')
      .query({ leadId })
      .type('form')
      .send({ CallSid: 'CA_FAKE_2', SpeechResult: 'לקנייה' })
      .expect(200);

    expect(t1.text).toContain('<Say');
    expect(t1.text).toContain('<Gather');

    // Only answer industry
    const t2 = await request(app)
      .post('/voice/agent/gather')
      .query({ leadId })
      .type('form')
      .send({ CallSid: 'CA_FAKE_2', SpeechResult: 'משרדים' })
      .expect(200);

    expect(t2.text).toContain('<Say');
    expect(t2.text).toContain('<Gather');

    // Do not answer budget
    const list = await request(app).get('/api/onboarding/submissions').expect(200);
    const lead = list.body.items.find(x => x.id === leadId);
    expect(lead.intent).toBeTruthy();
    expect(lead.industry).toBeTruthy();
    expect(lead.budget).toBeNull();
  });

  it('should hang up if user says "לא מעוניין"', async () => {
    // Start call
    await request(app)
      .get('/voice/agent/start')
      .query({ leadId })
      .expect(200);

    // User says not interested
    const t1 = await request(app)
      .post('/voice/agent/gather')
      .query({ leadId })
      .type('form')
      .send({ CallSid: 'CA_FAKE_3', SpeechResult: 'לא מעוניין' })
      .expect(200);

    expect(t1.text).toMatch(/<Hangup\/?>>|<Hangup\/?\s*>/);

    // Lead should not be qualified
    const list = await request(app).get('/api/onboarding/submissions').expect(200);
    const lead = list.body.items.find(x => x.id === leadId);
    expect(lead.intent).toBeNull();
    expect(lead.industry).toBeNull();
    expect(lead.budget).toBeNull();
  });

  it('should handle invalid speech input gracefully', async () => {
    await request(app)
      .get('/voice/agent/start')
      .query({ leadId })
      .expect(200);

    // User gives gibberish
    const t1 = await request(app)
      .post('/voice/agent/gather')
      .query({ leadId })
      .type('form')
      .send({ CallSid: 'CA_FAKE_4', SpeechResult: 'asdfghjkl' })
      .expect(200);

    expect(t1.text).toContain('<Say');
    expect(t1.text).toContain('<Gather');
  });

  it('should complete when user provides budget digits', async () => {
    await request(app)
      .get('/voice/agent/start')
      .query({ leadId })
      .expect(200);

    // Answer intent first
    await request(app)
      .post('/voice/agent/gather')
      .query({ leadId })
      .type('form')
      .send({ CallSid: 'CA_FAKE_1', SpeechResult: 'לקנייה' })
      .expect(200);

    // Answer industry next
    await request(app)
      .post('/voice/agent/gather')
      .query({ leadId })
      .type('form')
      .send({ CallSid: 'CA_FAKE_1', SpeechResult: 'משרדים' })
      .expect(200);

    // Finally provide budget digits
    const final = await request(app)
      .post('/voice/agent/gather')
      .query({ leadId })
      .type('form')
      .send({ CallSid: 'CA_FAKE_1', SpeechResult: '250000' })
      .expect(200);

    // In fake mode we should be done
    expect(final.text).toMatch(/<Hangup\/?>>|<Hangup\/?\s*>/);

    // Verify lead updated (structured)
    const list = await request(app).get('/api/onboarding/submissions').expect(200);
    const lead = list.body.items.find(x => x.id === leadId);
    expect(lead.intent).toBeTruthy();
    expect(lead.industry).toBeTruthy();
    expect(lead.budget).toBe(250000);
  });
});
