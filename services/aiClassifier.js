/**
 * AI Classifier Service (Module M6)
 * Hybrid: rules → cache → AI API → time heuristic fallback.
 */
import { classifyPrompt, summarizeLinksPrompt, batchClassifyPrompt } from './aiPrompts.js';
import { categorize, needsAiFallback, CATEGORIES } from '../logic/categorizer.js';

const classificationCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

export async function classify(url, title = '', timeSpent = 0, scrollCount = 0, apiKey = null) {
  const ruleResult = categorize(url, title);
  if (!needsAiFallback(ruleResult)) return ruleResult;

  const cacheKey = extractDomain(url);
  const cached = classificationCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return { ...cached.result, source: 'cache' };

  if (apiKey) {
    try {
      const prompt = classifyPrompt(url, title, timeSpent, scrollCount);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let parsed = {};
      try {
        parsed = parseJsonSafe(text);
      } catch (e) {
        console.warn('[Classifier] AI parse failed:', e.message);
      }
      const aiResult = {
        category: parsed.category || CATEGORIES.UNKNOWN,
        confidence: parsed.confidence || 0.7,
        source: 'ai',
        reason: parsed.reason || '',
      };
      classificationCache.set(cacheKey, { result: aiResult, ts: Date.now() });
      return aiResult;
    } catch (err) {
      console.warn('[Classifier] AI failed:', err.message);
    }
  }

  // Fallback: time heuristic
  const scrollRate = timeSpent > 0 ? scrollCount / (timeSpent / 60) : 0;
  if (scrollRate > 30) return { category: CATEGORIES.BRAINROT, confidence: 0.4, source: 'heuristic' };
  if (timeSpent > 300) return { category: CATEGORIES.TIME_WASTE, confidence: 0.35, source: 'heuristic' };
  return { category: CATEGORIES.MIXED, confidence: 0.3, source: 'heuristic' };
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

export async function summarizeLinks(links, category, apiKey = null) {
  if (!apiKey) {
    return { summary: "No API key provided. AI summary disabled." };
  }
  try {
    const prompt = summarizeLinksPrompt(links.map(l => ({ url: l.url, title: l.title })), category);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed = {};
    try {
      parsed = parseJsonSafe(text);
    } catch (e) {
      console.warn('[Classifier] JSON parse failed, returning fallback:', e.message);
      return { summary: text.slice(0, 300) + "... (Summary generated but formatting was irregular)" };
    }
    return { summary: parsed.summary || text.slice(0, 300) };
  } catch (err) {
    console.warn('[Classifier] Summary failed:', err.message);
    return { summary: "Failed to generate summary." };
  }
}

/**
 * Robust JSON extraction from AI response.
 */
function parseJsonSafe(text) {
  try {
    // 1. Try direct parse
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
    // 2. Try to find JSON block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        // 3. Last ditch: if it's unterminated, try to close it
        if (e2.message.includes('Unterminated') || e2.message.includes('Expected property name')) {
          try {
            // Very basic heuristic to close open brackets
            let attempt = jsonMatch[0].trim();
            if (attempt.endsWith(',')) attempt = attempt.slice(0, -1);
            if (!attempt.endsWith('}')) attempt += '}';
            return JSON.parse(attempt);
          } catch (e3) { throw e3; }
        }
        throw e2;
      }
    }
    throw e;
  }
}

export async function batchClassifyLinks(links, apiKey = null) {
  if (!apiKey || links.length === 0) return {};
  
  const BATCH_SIZE = 40;
  let allAiResults = {};

  try {
    for (let i = 0; i < links.length; i += BATCH_SIZE) {
      const batch = links.slice(i, i + BATCH_SIZE);
      const linksWithIds = batch.map((l, index) => ({ id: index + 1, url: l.url, title: l.title }));
      const prompt = batchClassifyPrompt(linksWithIds);
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt),
        signal: AbortSignal.timeout(15000),
      });
      
      if (!res.ok) {
        console.warn(`[Classifier] Batch API failed at index ${i}: ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let parsed = {};
      try {
        parsed = parseJsonSafe(text);
      } catch (e) {
        console.warn('[Classifier] Batch JSON parse failed at index', i);
        continue;
      }
      
      if (parsed.classifications && Array.isArray(parsed.classifications)) {
        parsed.classifications.forEach(c => {
          if (c.id !== undefined && c.category) {
            const originalLink = linksWithIds.find(l => l.id === Number(c.id));
            if (originalLink) {
              allAiResults[originalLink.url] = c.category;
            }
          }
        });
      }
    }
    return allAiResults;
  } catch (err) {
    console.warn('[Classifier] Batch classification failed:', err.message);
    return allAiResults;
  }
}
