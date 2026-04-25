/**
 * AI Prompts (Module: shared)
 * Centralized prompt templates for classification, summarization, and chat.
 */

/**
 * Classification prompt for unknown URLs.
 */
export function classifyPrompt(url, title, timeSpent, scrollCount) {
  return {
    system_instruction: {
      role: 'system',
      parts: [{ text: `You are a browsing activity classifier for a focus app. Classify the user's activity into exactly one category.

Categories:
- productivity: Work tools, coding, docs, design
- learning: Courses, tutorials, educational content
- entertainment: Movies, music, games, streaming
- timeWaste: Social media browsing, news feeds
- brainrot: Short-form addictive content (reels, shorts, TikTok)

Respond with ONLY valid JSON without markdown formatting: { "category": "...", "confidence": 0.0-1.0, "reason": "one sentence" }` }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: `URL: ${url}\nPage Title: ${title}\nTime Spent: ${timeSpent}s\nScroll Count: ${scrollCount}` }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 100,
      temperature: 0.3,
    }
  };
}

/**
 * Summary generation prompt.
 */
export function summarizePrompt(sessions, profileSummary) {
  const sessionData = sessions.map(s => ({
    type: s.type,
    duration: s.duration,
    brainrotScore: s.totalBrainrotScore,
    sites: s.sites?.length || 0,
    frictionEvents: s.frictionEvents?.length || 0,
  }));

  return {
    system_instruction: {
      role: 'system',
      parts: [{ text: `You are a focus coach generating session summaries. Be concise and actionable.
User profile:\n${profileSummary}

Respond with ONLY valid JSON without markdown formatting:
{
  "summary": "2-3 sentence summary",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "focusScore": 0-100,
  "recommendation": "one actionable tip"
}` }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: `Recent sessions:\n${JSON.stringify(sessionData, null, 2)}` }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.5,
    }
  };
}

/**
 * Chat prompt with system context.
 */
export function chatPrompt(userMessage, profileSummary, chatHistory, recentSessions, todayStats = {}, blockBypasses = []) {
  const todayContext = `
Today's Stats:
- Reels Watched: ${todayStats.reelCount || 0}
- Reel Time: ${Math.round((todayStats.reelTime || 0) / 60)} min
- Today's Brainrot Ratio: ${todayStats.brainrotScore || 0}%
`;

  const sessionContext = recentSessions.slice(0, 3).map(s =>
    `${s.type} session: ${Math.round(s.duration / 60)}min, brainrot: ${s.totalBrainrotScore}`
  ).join('\n');

  const blockContext = blockBypasses.length > 0
    ? `Block Bypasses (today):
${blockBypasses.map(b => `- ${b.domain}: ${b.reason} (${b.timestamp})`).join('\n')}`
    : 'Block Bypasses: None today';

  // Convert chatHistory to Gemini format
  const formattedHistory = chatHistory.slice(-6).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  return {
    system_instruction: {
      role: 'system',
      parts: [{ text: `You are a focus coach for Study Friction AI. You help users understand and improve their attention habits.

User Profile:
${profileSummary}

${todayContext}

${blockContext}

Recent Activity:
${sessionContext || 'No recent sessions'}

Rules:
1. Be encouraging but honest
2. Reference the user's actual data when possible
3. Keep responses under 100 words
4. If the user wants to change a setting, include this on a new line at the end:
   ACTION:{"field":"value"}
   Valid actions: {"frictionTolerance":1-5}, {"tone":"strict|balanced|chill"}, {"pomodoroLength":number}, {"goal":"study|work|relax_balance"}
5. Do NOT fabricate data the user doesn't have` }]
    },
    contents: [
      ...formattedHistory,
      { role: 'user', parts: [{ text: userMessage }] }
    ],
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.7,
    }
  };
}

/**
 * Parse AI response for actions.
 * @param {string} responseText
 * @returns {{ text: string, actions: object[] }}
 */
export function parseAiResponse(responseText) {
  const lines = responseText.split('\n');
  const actions = [];
  const textLines = [];

  for (const line of lines) {
    if (line.startsWith('ACTION:')) {
      try {
        const actionJson = JSON.parse(line.substring(7));
        actions.push(actionJson);
      } catch {
        // Ignore malformed actions
      }
    } else {
      textLines.push(line);
    }
  }

  return {
    text: textLines.join('\n').trim(),
    actions,
  };
}

export function summarizeLinksPrompt(links, category) {
  return {
    system_instruction: {
      role: 'system',
      parts: [{ text: `You are a focus coach summarizing a user's browsing history for a specific category (${category}).
Provide a brief, insightful summary of the content they consumed based on the URLs and titles.

Respond with ONLY valid JSON format. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. The response should start with { and end with }.
{ "summary": "2-3 sentences overview" }` }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: `Links:\n${JSON.stringify(links, null, 2)}` }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.5,
      responseMimeType: "application/json",
    }
  };
}

/**
 * Batch classification prompt.
 */
export function batchClassifyPrompt(linksWithIds) {
  return {
    system_instruction: {
      role: 'system',
      parts: [{ text: `You are a web browsing classifier. Group the following URLs into specific, highly descriptive categories based on their content.
You can create NEW categories that describe the content accurately (e.g., 'E-commerce', 'News', 'Web Development', 'Social Media', 'Health & Fitness', 'Banking', etc.).

Respond with ONLY valid JSON format. Do NOT wrap the JSON in markdown code blocks.
{
  "classifications": [
    { "id": 1, "category": "category_name" }
  ]
}` }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: `Links to classify (ID: Title - URL):\n${linksWithIds.map(l => `${l.id}: ${l.title} - ${l.url}`).join('\n')}` }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  };
}

/**
 * Prompt for generating dynamic friction messages (shaming/encouraging).
 */
export function frictionMessagePrompt(reels, timeSpent, tone, lastReason) {
  return {
    system_instruction: {
      role: 'system',
      parts: [{ text: `You are a focus coach for Study Friction AI. The user is doomscrolling reels.
Generate a short, impactful message to show on their screen to snap them out of the trance.

Tone: ${tone} (strict: very direct/harsh, balanced: firm but helpful, chill: supportive/gentle)

Context:
- Reels watched: ${reels}
- Time spent: ${Math.round(timeSpent / 60)} min
- Last reason given for scrolling: ${lastReason}

Rules:
1. Keep it under 20 words.
2. Be creative.
3. Reference the specific number of reels (${reels}) to make it feel real.
4. If tone is strict, be a bit mean about the "brainrot".
5. Return ONLY the text message.` }]
    },
    contents: [
      { role: 'user', parts: [{ text: `Generate a message for ${reels} reels.` }] }
    ],
    generationConfig: {
      maxOutputTokens: 50,
      temperature: 0.8,
    }
  };
}
/**
 * Prompt for deciding the friction level dynamically based on behavior.
 */
export function frictionDecisionPrompt(metrics, profile) {
  return {
    system_instruction: {
      role: 'system',
      parts: [{ text: `You are the Friction Intelligence Engine for Study Friction AI.
Your job is to decide the optimal friction level (1-5) for a user based on their current behavior.

Friction Levels:
1: Gentle (slight resistance)
2: Moderate (intent checks)
3: Strong (warning overlays)
4: Aggressive (cooldown periods)
5: Maximum (full block)

User Context:
- Reels Watched: ${metrics.reels}
- Time in Void: ${Math.round(metrics.timeSpent / 60)} min
- Last Reason: ${metrics.lastReason}
- User Friction Tolerance: ${profile?.behavior?.frictionTolerance || 2}

Respond with ONLY valid JSON:
{
  "level": 1-5,
  "reasoning": "one sentence explaining the decision",
  "aiMessage": "A short coach message"
}` }]
    },
    contents: [
      { role: 'user', parts: [{ text: `Current state: ${metrics.reels} reels, ${metrics.timeSpent}s spent.` }] }
    ],
    generationConfig: {
      maxOutputTokens: 100,
      temperature: 0.3,
      responseMimeType: "application/json",
    }
  };
}
