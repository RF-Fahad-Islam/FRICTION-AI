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
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
        parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
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
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.warn('[Classifier] JSON parse failed, returning fallback:', e.message);
      return { summary: text.slice(0, 200) + "... (Summary generated but formatting failed)" };
    }
    return { summary: parsed.summary || "Summary generation failed." };
  } catch (err) {
    console.warn('[Classifier] Summary failed:', err.message);
    return { summary: "Failed to generate summary." };
  }
}

export async function batchClassifyLinks(links, apiKey = null) {
  if (!apiKey || links.length === 0) return {};
  
  try {
    const prompt = batchClassifyPrompt(links.map(l => ({ url: l.url, title: l.title })));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.warn('[Classifier] Batch JSON parse failed:', e.message);
      return {};
    }
    
    // Convert array to URL -> Category map
    const map = {};
    if (parsed.classifications && Array.isArray(parsed.classifications)) {
      parsed.classifications.forEach(c => {
        if (c.url && c.category) map[c.url] = c.category;
      });
    }
    return map;
  } catch (err) {
    console.warn('[Classifier] Batch classification failed:', err.message);
    return {};
  }
}
