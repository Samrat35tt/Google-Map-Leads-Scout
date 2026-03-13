import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // --- API Routes ---

  // Send Email (SendGrid)
  app.post('/api/send-email', async (req, res) => {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      return res.status(500).json({ error: "SendGrid API Key or From Email is missing from the backend." });
    }

    try {
      sgMail.setApiKey(SENDGRID_API_KEY);
      const { to, subject, text, html } = req.body;

      if (!to || !subject || (!text && !html)) {
        return res.status(400).json({ error: "Missing required fields: to, subject, text/html" });
      }

      const msg = {
        to,
        from: SENDGRID_FROM_EMAIL,
        subject,
        text: text || '',
        html: html || '',
      };

      await sgMail.send(msg);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("SendGrid Error:", error.response?.body || error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Send SMS (Twilio)
  app.post('/api/send-sms', async (req, res) => {
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      return res.status(500).json({ error: "Twilio credentials are missing from the backend." });
    }

    try {
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const { to, body } = req.body;

      if (!to || !body) {
        return res.status(400).json({ error: "Missing required fields: to, body" });
      }

      const message = await client.messages.create({
        body,
        from: TWILIO_FROM_NUMBER,
        to
      });

      res.json({ success: true, messageId: message.sid });
    } catch (error: any) {
      console.error("Twilio Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Apify Search
  app.post('/api/apify/search', async (req, res) => {
    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    if (!APIFY_TOKEN) {
      return res.status(500).json({ error: "Apify API Token is missing from the backend." });
    }

    try {
      const response = await fetch(`https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Apify Search Failed" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Apify Ads
  app.post('/api/apify/ads', async (req, res) => {
    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    if (!APIFY_TOKEN) {
      return res.status(500).json({ error: "Apify API Token is missing from the backend." });
    }

    try {
      const response = await fetch(`https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Apify Ads Scrape Failed" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Apollo Match
  app.post('/api/apollo/match', async (req, res) => {
    const APOLLO_KEY = process.env.APOLLO_API_KEY || 'lmPEKhCqBUHmllC0oaf_Ww';
    
    try {
      const response = await fetch('https://api.apollo.io/v1/people/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...req.body, api_key: APOLLO_KEY }),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Apollo API Error" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // LLM Chat
  app.post('/api/llm/chat', async (req, res) => {
    const { provider, model, systemPrompt, userPrompt } = req.body;

    try {
      if (provider === 'openai') {
        const key = process.env.OPENAI_API_KEY;
        if (!key) return res.status(500).json({ error: "OpenAI API Key not configured in backend." });
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.7 })
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "OpenAI Error" });
        return res.json({ text: data.choices?.[0]?.message?.content || "" });
      } 
      else if (provider === 'deepseek') {
        const key = process.env.DEEPSEEK_API_KEY;
        if (!key) return res.status(500).json({ error: "DeepSeek API Key not configured in backend." });
        
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.7 })
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "DeepSeek Error" });
        return res.json({ text: data.choices?.[0]?.message?.content || "" });
      }
      else if (provider === 'anthropic') {
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) return res.status(500).json({ error: "Anthropic API Key not configured in backend." });
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model, system: systemPrompt, messages: [{ role: "user", content: userPrompt }], max_tokens: 4096 })
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "Anthropic Error" });
        return res.json({ text: data.content?.[0]?.text || "" });
      }
      
      res.status(400).json({ error: "Unknown provider" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('(.*)', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
