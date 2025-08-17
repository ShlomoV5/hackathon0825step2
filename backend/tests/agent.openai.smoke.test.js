import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = 'test';

import { describe, it, expect } from 'vitest';
import { agentDecideTurn } from '../lib/agent.js';

const hasLive =
  process.env.LLM_PROVIDER === 'openai' &&
  !!process.env.LLM_API_KEY &&
  process.env.AGENT_FAKE_MODE !== '1';

(hasLive ? describe : describe.skip)('Agent decider (OpenAI live smoke)', () => {
  it('returns a valid decision object', async () => {
    const lead = {
      name: 'ישראל',
      intent: null,
      industry: null,
      budget: null,
      notes: ''
    };

    const { reply, updates, next } = await agentDecideTurn({
      lead,
      history: [],
      userText: 'אני מתעניין בנדל״ן משרדים, תקציב בערך 250 אלף, לקנייה'
    });

    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);

    expect(['continue', 'end']).toContain(next);

    expect(updates).toBeTypeOf('object');
    if (updates.budget != null) {
      expect(typeof updates.budget).toBe('number');
      expect(isNaN(updates.budget)).toBe(false);
    }
  }, 20000);

  it('handles missing userText gracefully', async () => {
    const lead = {
      name: 'ישראל',
      intent: null,
      industry: null,
      budget: null,
      notes: ''
    };

    const { reply, updates, next } = await agentDecideTurn({
      lead,
      history: [],
      userText: ''
    });

    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
    expect(['continue', 'end']).toContain(next);
    expect(updates).toBeTypeOf('object');
  }, 20000);

  it('handles partial lead info', async () => {
    const lead = {
      name: 'ישראל',
      intent: 'לקנייה',
      industry: null,
      budget: null,
      notes: ''
    };

    const { reply, updates, next } = await agentDecideTurn({
      lead,
      history: [],
      userText: 'תקציב שלי הוא 300 אלף'
    });

    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
    expect(['continue', 'end']).toContain(next);
    expect(updates).toBeTypeOf('object');
    if (updates.budget != null) {
      expect(typeof updates.budget).toBe('number');
      expect(isNaN(updates.budget)).toBe(false);
    }
  }, 20000);

  it('handles gibberish input', async () => {
    const lead = {
      name: 'ישראל',
      intent: null,
      industry: null,
      budget: null,
      notes: ''
    };

    const { reply, updates, next } = await agentDecideTurn({
      lead,
      history: [],
      userText: 'asdfghjkl'
    });

    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
    expect(['continue', 'end']).toContain(next);
    expect(updates).toBeTypeOf('object');
  }, 20000);

  it('handles user not interested', async () => {
    const lead = {
      name: 'ישראל',
      intent: null,
      industry: null,
      budget: null,
      notes: ''
    };

    const { reply, updates, next } = await agentDecideTurn({
      lead,
      history: [],
      userText: 'לא מעוניין'
    });

    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
    expect(next).toBe('end');
    expect(updates).toBeTypeOf('object');
  }, 20000);
});