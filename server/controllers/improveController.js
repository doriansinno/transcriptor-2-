import fetch from 'node-fetch';
import { validateLicense, incrementUsage, remainingRequests } from './licenseController.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY ist nicht gesetzt.');
  }

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
            'Du bist ein pädagogischer Assistent. Du verbesserst Mitschriften, strukturierst sie mit klaren Überschriften, erklärst Fachbegriffe und formst prägnante Bulletpoints. Du arbeitest nur auf Grundlage des übergebenen Textes.'
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
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function improveNotes(req, res) {
  const { key, text } = req.body || {};
  if (!key || !text) {
    return res.status(400).json({ success: false, message: 'Lizenzschlüssel und Text sind erforderlich.' });
  }

  const validation = validateLicense(key);
  if (!validation.valid) {
    return res.status(401).json({ success: false, message: validation.message });
  }

  try {
    const improved = await callOpenAI(
      `Verbessere und strukturiere folgende Mitschrift. Verwende klare Überschriften, nummerierte Schritte, kurze Erklärungen und Merkhilfen. Text:\n${text}`
    );

    incrementUsage(validation.license);
    return res.json({
      success: true,
      improved,
      remainingRequests: remainingRequests(validation.license)
    });
  } catch (error) {
    console.error('improveNotes error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
