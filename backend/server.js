import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load .env as early as possible so imported modules see the variables at module-eval time
dotenv.config();

import root from './routes/root.js';
import kpis from './routes/kpis.js';
import metrics from './routes/metrics.js';
import timePeriods from './routes/time-periods.js';
import onboarding from './routes/onboarding.js';
import ai from './routes/ai.js';
import calls from './routes/calls.js';
import mock from './routes/mock.js';
import call from './routes/call.js';

import agentApi from './routes/agent-api.js';
import agentVoice from './routes/agent-voice.js';

import { seedMock } from './lib/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); 

// Only seed in-memory mock data outside tests
if (process.env.NODE_ENV !== 'test') {
  seedMock();
}

// Routes
app.use('/', root);
app.use('/api/kpis', kpis);               // windowed KPIs
app.use('/api/metrics', metrics);         // charts
app.use('/api/time-periods', timePeriods);// presets
app.use('/api/onboarding', onboarding);   // onboarding CRUD (mock)
app.use('/api/ai', ai);                   // extract (single place!)
app.use('/api/calls', calls);             // calls list for table
app.use('/api/mock', mock);               // reseed

app.use('/api/agent', agentApi);       // POST /api/agent/call-lead
app.use('/voice/agent', agentVoice);   // TwiML: /start, /consent, /gather, /status

// Twilio (kept separate for clarity)
app.use('/api/call', call);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;           // <-- export the app

// Only start the server outside tests
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log('Listening on', PORT));
}