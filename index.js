// Minimal Express proxy to forward prompts to Gemini API using a server-side API key
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = process.env.API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5:generateContent';

// Simple per-IP cooldown to reduce abuse (milliseconds)
const lastRequest = new Map();
const MIN_INTERVAL = 700; // 700ms between requests per IP

app.post('/api/generate', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const last = lastRequest.get(ip) || 0;
    if (now - last < MIN_INTERVAL) {
      return res.status(429).json({ error: 'Too many requests - slow down' });
    }
    lastRequest.set(ip, now);

    if (!API_KEY) {
      return res.status(500).json({ error: 'Server API key not configured' });
    }

    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    // Build Gemini request body (keep same shape as frontend expects)
    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const apiRes = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error('Gemini API error:', apiRes.status, text);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = await apiRes.json();

    // Extract text from response safely
    let text = '';
    try {
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      text = '';
    }

    return res.json({ text });
  } catch (err) {
    console.error('Proxy error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Xiuchatbot proxy running on port ${PORT}. Endpoint: POST /api/generate`);
});
