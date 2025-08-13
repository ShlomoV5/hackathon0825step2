# Sales AI – Local Dev Guide

This repo contains a **frontend** (React + Vite) and a **backend** (Express).  
Goal: run everything **locally** and test the existing API endpoints.

---

## Prerequisites
- Node.js ≥ 18
- npm ≥ 9

---

## Folder Structure
```
project-root/
├─ frontend/      # React + Vite dashboard
└─ backend/       # Express API
```

---

## 1) Backend – Run locally

### Install deps
```bash
cd backend
npm install
```

### (Optional) Env file for Twilio **test** endpoint
Create `backend/.env` with **Twilio Test Credentials** (no charges; from Twilio Console):
```
TWILIO_TEST_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_TEST_AUTH_TOKEN=your_test_auth_token
# Optional, used as the "from" in test mode:
TWILIO_TEST_FROM=+15005550006
```

> If you don’t set these, the `/api/call/test` route will return an error.

### Start server
```bash
npm run dev    # if nodemon configured
# or
node server.js
```
Server runs on: `http://localhost:5000`

---

## 2) Frontend – Run locally

### Install deps
```bash
cd frontend
npm install
```

### Dev proxy (already configured)
`frontend/vite.config.js` forwards `/api/*` → `http://localhost:5000`, so you can call `/api/...` from the browser without CORS issues.

### Start Vite
```bash
npm run dev
```
Open: `http://localhost:5173`

---

## Existing API Endpoints

### Health Check
**GET** `/api/health`  
**Response:**
```json
{ "ok": true }
```
**Test:**
```bash
curl http://localhost:5000/api/health
```

### KPIs (mock)
**GET** `/api/kpi`  
**Response (example):**
```json
{
  "callsToday": 52,
  "successRate": 38,
  "leads": 17,
  "avgCallDuration": "03:12"
}
```
**Test:**
```bash
curl http://localhost:5000/api/kpi
```

### Test Call (no credit, Twilio **test**)
**POST** `/api/call/test`  
Uses Twilio **Test Credentials** and “magic” number; returns a simulated Call SID/status (won’t appear in Monitor; no billing).

**Request body:** _none_  
**Response (example):**
```json
{ "simulated": true, "callSid": "CAxxxxxxxx", "status": "queued" }
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/call/test
```

> For this to work, set the three `TWILIO_TEST_*` vars in `backend/.env` and restart the backend.

---

## Frontend Integration Notes
- Frontend calls `/api/kpi` to populate the 4 KPI tiles.
- “Test Call” button calls `/api/call/test` and shows the result in-app.
- No database yet: metrics are mocked from the backend.

---

## Common Issues

- **CORS error** in the browser  
  Ensure you started the backend (`http://localhost:5000`) **before** the frontend (`http://localhost:5173`). The Vite proxy handles `/api/*`.

- **`/api/call/test` fails**  
  Add the Twilio test environment variables in `.env` and restart the server.
