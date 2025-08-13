// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Example API endpoint (mock data for dashboard)
app.get('/api/kpi', (req, res) => {
  res.json({
    leads: 125,
    successRate: 36,
    avgCallDuration: '03:15',
    callsToday: 52
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
