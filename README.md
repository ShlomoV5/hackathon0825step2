# AI Sales agent Dashboard + Phone call maker

## Overview
This is a small Node/Express + Vite React project: a mock CRM and voice agent that can call leads using Twilio and run a conversational agent (either a local fake flow or a real LLM-driven flow).

Folders
- `backend/` — Express server, mock in-memory DB, Twilio voice/TwiML endpoints, agent logic and tests.
- `frontend/` — Vite + React UI for listing leads and triggering calls.

Tech
- Node.js (ES modules), Express
- Twilio Node SDK for outbound calls and TwiML
- Optional LLM provider: OpenAI (configured via `LLM_API_KEY` or `OPENAI_API_KEY`)
- Vitest + supertest for tests

## What I implemented (key changes)
- Fixed failing tests in `backend/tests` (moved `it` blocks outside hooks, deterministic seeding).
- Stabilized the fake agent logic so tests are deterministic (budget/intent extraction, end conditions).
- Added `POST /api/agent/call-lead` which creates an outbound Twilio call and points Twilio to the in-app TwiML endpoints at `/voice/agent/*`.
- Implemented TwiML voice flow in `backend/routes/agent-voice.js` that:
  - Greets the lead
  - Uses speech recognition (`<Gather input="speech">`) to collect user responses
  - Calls `agentDecideTurn` (LLM or fake) to build the next assistant reply and update lead fields
- Ensured `.env` is read early so modules see config at import time (moved `dotenv.config()` in `server.js`).
- Added request-time validation to ensure `PUBLIC_BASE_URL` is a public HTTPS URL (ngrok recommended).
- Added small debugging helpers during development (later removed in cleanup).

## What we didn't finish / known issues
- Twilio speech recognition language: Twilio's Google Speech V2 backend supports a limited set of language codes (English variants, major languages, Chinese, Japanese, Korean, etc.). `he-IL` is not supported and Twilio warns about this; speech recognition for Hebrew may not work with the current Twilio setup.
- LLM integration: the code supports both a fake local agent and calling an LLM (OpenAI). If `LLM_API_KEY` is missing, the agent will throw (unless you previously used a temporary fallback) — make sure the backend process has the env set before starting.
- Production readiness: no persistent DB, no auth, Twilio credentials are in `.env` for local testing only. Don't commit real secrets.

## How to run (local dev)
1. Install dependencies
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`

2. Create a `backend/.env` (example)
```
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_FROM=+1xxxxx
PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
AGENT_OWNER_PHONE=+9725...

# LLM (optional)
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=sk-...

AGENT_FAKE_MODE=0
```

3. Start ngrok (recommended for Twilio webhooks - needs to install ngrok first, and sign up to get an authtoken)
```
ngrok http 5000
# copy the https://... forwarding URL and put it in PUBLIC_BASE_URL
```

4. Start backend
```
cd backend
npm start
```

5. Start frontend
```
cd frontend
npm run dev
```

6. Use the UI to seed leads and click the call button, or trigger:
```powershell
# Seed one lead and call it (PowerShell example)
$seed = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/onboarding/seed?count=1'
$leadId = $seed.items[0].id
$body = @{ leadId = $leadId } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/agent/call-lead' -ContentType 'application/json' -Body $body
```

## Files of interest
- `backend/server.js` — Express app setup, dotenv load
- `backend/routes/agent-api.js` — API to create outbound Twilio calls
- `backend/routes/agent-voice.js` — TwiML endpoints for the voice agent (`/start`, `/gather`, `/status`)
- `backend/lib/agent.js` — agent logic and LLM integration
- `backend/lib/ai.js` — small heuristics to extract intent/industry/budget
- `frontend/src/components/LeadsBox.jsx` — UI wiring to call leads

## What I would do next (post-hackathon)
- Resolve speech recognition for Hebrew (use a supported STT or send audio to a Hebrew-capable service).
- Add persisted DB (SQLite/Postgres) and secure secrets via env management.
- Harden Twilio retry handling and logging for production.
- Add more tests covering TwiML flows and end-to-end call behavior.

## LLM environment variables (required)
The backend reads these env variables at startup. Set them in `backend/.env` or export them in the shell that runs the server.

- `LLM_PROVIDER` (optional) — provider id, e.g. `openai`.
- `LLM_MODEL` (optional) — model name, e.g. `gpt-4o-mini`.
- `LLM_API_KEY` or `OPENAI_API_KEY` — the secret API key used to call the LLM. This is required if you want to use the real LLM (not the fake agent).
- `LLM_BASE_URL` (optional) — custom base URL for the LLM API (useful for proxying or alternative providers).

Example `backend/.env` snippet:
```
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=sk-...your-key...
LLM_BASE_URL=https://api.openai.com/v1
```

Security note: never commit real API keys to source control. Use a secrets manager or CI/CD environment variables for production.

## Speech (STT/TTS) — constraints and recommended tech
Short summary: Twilio provides telephony and a built-in TTS/STT surface, but its speech recognition (Google Speech V2) supports a limited set of languages — Hebrew (`he-IL`) is not in the supported list and will emit warnings or produce poor results. For production-quality Hebrew voice flows you should use an external STT/TTS provider and integrate it with Twilio (Media Streams or by hosting generated audio).

Recommended architecture (low friction):
- Use Twilio for PSTN connect and call control (outbound call creation, status webhooks).
- Use Twilio Media Streams (WebSocket) to stream the live audio to your service.
- Forward the audio stream to an external STT provider (or use the provider's streaming websocket) to get near-real-time transcripts.
- Feed transcripts into the agent (LLM or fake), get reply text.
- Synthesize reply text using an external TTS provider that supports Hebrew, and make Twilio play it back to the caller (either by returning a `<Play>` URL to a hosted MP3 or by streaming audio back).

Provider options (examples):
- Google Cloud Speech-to-Text + Text-to-Speech — good Hebrew support and global infra; pay-as-you-go.
- Azure Speech (Speech Services) — STT + TTS, good language coverage including Hebrew.
- Deepgram (STT) — streaming STT with low-latency options; check Hebrew coverage.
- AssemblyAI (STT) — high-quality STT and streaming; check language support for Hebrew.
- ElevenLabs / Google TTS / Azure TTS — for higher-quality TTS (voice cloning, multi-voice options). ElevenLabs focuses on TTS; check Hebrew support and licensing.
- Vosk / Kaldi — self-hosted/offline options (if you need on-prem or no-network). Vosk has community Hebrew models but requires more ops work.

Integration tips
- Use Twilio Media Streams for real-time STT. Alternatively, record short segments and send them for batch transcription (higher latency).
- For TTS: generating audio and hosting it (S3 or similar) then returning a `<Play>` URL is simple and reliable. Streaming synthesized audio back into the live call is lower-level but possible.
- Test fallback: keep a small local TTS (or Twilio <Say>) for non-critical languages, but rely on external TTS for Hebrew.

Env variables for STT/TTS providers (examples)
- `GOOGLE_APPLICATION_CREDENTIALS` (path to JSON key) or `GOOGLE_API_KEY`
- `AZURE_SPEECH_KEY` and `AZURE_REGION`
- `DEEPGRAM_API_KEY`
- `ASSEMBLYAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `TTS_STORAGE_URL` / cloud storage credentials (optional) for hosting synthesized audio
