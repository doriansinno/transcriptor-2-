import fetch from 'node-fetch';
import { validateLicense, incrementUsage, remainingRequests } from './licenseController.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function callEmergency(text) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY ist nicht gesetzt.');
  }

  const prompt = `Erstelle zwei Teile basierend auf dieser Mitschrift:\n1) Eine extrem kurze, verständliche Antwort oder Handlungsempfehlung in 3-5 Sätzen.\n2) Eine ausführliche, leicht verständliche Erklärung zum Lernen (Absätze, Bulletpoints).\nMitschrift:\n${text}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein zuverlässiger Tutor. Deine Antworten sind sachlich korrekt, hilfreich und kompakt. Du fasst dich kurz, wenn kurz gefordert ist, und erklärst ausführlich, wenn gewünscht.'
        },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI Fehler: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const [shortAnswer, ...rest] = content.split(/\n\n+/);
  return {
    short_answer: shortAnswer?.trim() || content.trim(),
    detailed_explanation: rest.join('\n\n').trim() || content.trim()
  };
}

export async function emergencyHelp(req, res) {
  const { key, text } = req.body || {};
  if (!key || !text) {
    return res.status(400).json({ message: 'Lizenzschlüssel und Text sind erforderlich.' });
  }

  const validation = validateLicense(key);
  if (!validation.valid) {
    return res.status(401).json({ message: validation.message });
  }

  try {
    const result = await callEmergency(text);
    incrementUsage(validation.license);
    return res.json({ ...result, remainingRequests: remainingRequests(validation.license) });
  } catch (error) {
    console.error('emergencyHelp error', error);
    return res.status(500).json({ message: error.message });
  }
}
