const axios = require('axios');
const chatLogger = require('./chatLogger');

// Default API configuration (OpenClaw / OpenAI-compatible endpoint)
const DEFAULT_API_URL = 'http://localhost:18789/v1/chat/completions';
const DEFAULT_MODEL = 'openclaw';
const MIN_MESSAGES_FOR_SUMMARY = 2;

/**
 * Normalizes and sanitizes text for WhatsApp formatting:
 * - Replaces Markdown double asterisks (**) with WhatsApp single asterisks (*).
 * - Fixes quotes inside asterisks so bold doesn't break into raw stars.
 * - Ensures "Kal Ka Lafda" section header is clean and never bolded.
 * - Ensures clean spacing between bullet points and bold tags.
 */
function sanitizeWhatsAppFormatting(text) {
  if (!text) return text;
  let clean = text;

  // 1. Ensure "Kal Ka Lafda" section header is NEVER bolded (strip surrounding asterisks)
  clean = clean.replace(/\*+(🗞️\s*Kal Ka Lafda[^*]*)\*+/gi, '$1');

  // 2. Fix double asterisks around quotes: **"text"** or *"text"* -> "*text*"
  clean = clean.replace(/\*\*"([^"]+)"\*\*/g, '"*$1*"');
  clean = clean.replace(/\*"([^"]+)"\*/g, '"*$1*"');

  // 3. Replace all remaining Markdown double asterisks **text** with single asterisk *text*
  clean = clean.replace(/\*\*(.*?)\*\*/g, '*$1*');

  // 4. Strip any leftover double asterisks
  clean = clean.replace(/\*\*/g, '*');

  // 5. Ensure clean space between bullet point and bold tag: •*text* -> • *text*
  clean = clean.replace(/([•\-])\*([^\s*])/g, '$1 *$2');

  return clean;
}

/**
 * Builds the system prompt for chat summarization.
 * Supports multilingual WhatsApp chats including English, Hinglish, and Romanized Marathi (Manglish).
 */
function getSystemPrompt(dateString) {
  // If user provided a custom prompt in .env, use it
  if (process.env.SUMMARY_SYSTEM_PROMPT && process.env.SUMMARY_SYSTEM_PROMPT.trim()) {
    return process.env.SUMMARY_SYSTEM_PROMPT.replace('{dateString}', dateString);
  }

  // Built-in witty bakchodi + multilingual summary prompt
  return `You are the witty, sassy AI reporter for a fun WhatsApp group of close friends.
Your job is to roast the group and provide a hilarious, entertaining daily summary of yesterday's (${dateString}) chats.
Bring 100% "AI Bakchodi", sarcasm, playful roasting, and witty commentary while still genuinely summarizing what everyone talked about.

🌐 MULTILINGUAL UNDERSTANDING:
- The chat will have a lot of Hinglish, Marathi written in English script (Manglish), slang (e.g., scene kya hai, rada, timepass, bakwaas, ghanta, jugad, bro, etc.), and code-switching.
- Understand the context, jokes, teasing, and inside references perfectly.
- Write your summary in an entertaining, witty English/Hinglish blend that feels like a natural roast among friends.

📱 WHATSAPP FORMATTING RULES (STRICT):
- WhatsApp bold uses a SINGLE asterisk (*word*). NEVER use double asterisks (**word**).
- Ensure there is a space before the opening asterisk and after the closing asterisk (e.g. "• *Name:* said this").
- Never place asterisks around quotes (use "*quote*" instead of *"quote"* or **"quote"**).
- Keep "🗞️ Kal Ka Lafda & Gossip (Key Highlights):" as PLAIN TEXT without any asterisks.

*🔥 Daily Bakchodi Bulletin (${dateString})*

🗞️ Kal Ka Lafda & Gossip (Key Highlights):
- Breakdown of the main topics/arguments/discussions with funny commentary and sarcasm.
- Mention members by name and what drama or topic they brought up.

*🏆 Daily Bakchodi Awards:*
- 👑 *Bakchod of the Day*: (The person who spoke the most nonsense, stirred the pot, or dominated the chat with chaos).
- 🤡 *Clown Moment / Roast of the Day*: (The person who got roasted, took an L, or said something funny/dumb).

*📌 Final Verdict / Faisla:*
- Was anything actually decided or productive achieved? (e.g. "Ghanta kuch decide nahi hua, sirf timepass" or actual decision if any).

*☕ AI's Parting Advice:*
- One sharp, funny parting roast or advice for today.

Keep it punchy, funny, respectful (no hate speech), but full of spice and friendly roast!`;
}

/**
 * Summarizes chat messages for a specific group using the OpenClaw / AI agent API.
 * @param {Object} whatsappSock - Active Baileys WhatsApp socket connection
 * @param {string} groupId - Target WhatsApp group JID (e.g. 120363xxxx@g.us)
 * @param {Date} [baseDate] - Base date (summarizes the day prior to baseDate)
 * @returns {Promise<Object>} Result status and summary
 */
async function summarizeGroup(whatsappSock, groupId, baseDate = new Date()) {
  const { dateString, messages } = chatLogger.getYesterdayMessages(groupId, baseDate);

  if (!messages || messages.length === 0) {
    console.log(`[Summarizer] No messages found for group ${groupId} on ${dateString}. Skipping.`);
    return { groupId, status: 'skipped', reason: 'no_messages', date: dateString };
  }

  if (messages.length < MIN_MESSAGES_FOR_SUMMARY) {
    console.log(`[Summarizer] Group ${groupId} only had ${messages.length} message(s) on ${dateString}. Skipping summary.`);
    return { groupId, status: 'skipped', reason: 'insufficient_messages', messageCount: messages.length, date: dateString };
  }

  const timeZone = process.env.TZ || 'Asia/Kolkata';

  // Format transcript cleanly for the LLM with IST timestamps
  const transcript = messages.map(m => {
    const time = new Date(m.timestamp).toLocaleTimeString('en-IN', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const sender = m.sender_name || (m.sender_jid ? m.sender_jid.split('@')[0] : 'Member');
    return `[${time}] ${sender}: ${m.text}`;
  }).join('\n');

  // Support OPENCLAW, ANYAPI, AI, or HERMES environment variables
  const apiUrl = 
    process.env.OPENCLAW_API_URL || 
    process.env.AI_API_URL || 
    process.env.HERMES_API_URL || 
    DEFAULT_API_URL;

  const apiKey = 
    process.env.OPENCLAW_API_KEY || 
    process.env.AI_API_KEY || 
    process.env.HERMES_API_KEY || 
    '';

  const modelName = 
    process.env.OPENCLAW_MODEL || 
    process.env.AI_MODEL || 
    process.env.HERMES_MODEL || 
    DEFAULT_MODEL;

  const systemPrompt = getSystemPrompt(dateString);
  const userPrompt = `Here is the group chat transcript from yesterday (${dateString}):\n\n${transcript}\n\nPlease generate the executive daily summary.`;

  try {
    console.log(`[Summarizer] Sending ${messages.length} messages from group ${groupId} to AI Agent API (${apiUrl}) using model '${modelName}'...`);

    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey && apiKey !== 'none') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await axios.post(
      apiUrl,
      {
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      },
      {
        headers,
        timeout: 120000 // 2 minutes timeout for LLM generation
      }
    );

    const rawSummary = response.data?.choices?.[0]?.message?.content?.trim();

    if (!rawSummary) {
      throw new Error('Received empty summary response from AI Agent API');
    }

    const summaryText = sanitizeWhatsAppFormatting(rawSummary);

    // Send the summary strictly and isolatedly to this specific group
    if (whatsappSock) {
      await whatsappSock.sendMessage(groupId, { text: summaryText });
      console.log(`[Summarizer] Successfully delivered summary to group ${groupId}`);
    } else {
      console.warn(`[Summarizer] whatsappSock not available, summary generated but not sent.`);
    }

    return {
      groupId,
      status: 'success',
      date: dateString,
      messageCount: messages.length,
      summary: summaryText
    };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error(`[Summarizer] Failed to summarize for group ${groupId}:`, errorDetails);
    return {
      groupId,
      status: 'failed',
      date: dateString,
      error: error.message,
      details: errorDetails
    };
  }
}

/**
 * Runs daily summarization across all configured SUMMARY_GROUP_IDS isolatedly.
 * @param {Object} whatsappSock - Active Baileys WhatsApp socket connection
 * @param {Date} [baseDate] - Base date (summarizes the day prior to baseDate)
 * @returns {Promise<Array>} Results for each group
 */
async function generateDailySummaries(whatsappSock, baseDate = new Date()) {
  const summaryGroupsEnv = process.env.SUMMARY_GROUP_IDS || '';
  const targetGroups = summaryGroupsEnv
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);

  if (targetGroups.length === 0) {
    console.log('[Summarizer] No SUMMARY_GROUP_IDS configured in environment. Skipping daily summarization.');
    return [];
  }

  console.log(`[Summarizer] Starting daily summarization for ${targetGroups.length} group(s)...`);
  const results = [];

  for (const group of targetGroups) {
    try {
      const res = await summarizeGroup(whatsappSock, group, baseDate);
      results.push(res);
      // 2-second pause between groups to respect WhatsApp rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`[Summarizer] Unexpected error processing group ${group}:`, err);
      results.push({ groupId: group, status: 'error', error: err.message });
    }
  }

  // Rolling retention: prune messages older than 48 hours to prevent database growth
  try {
    chatLogger.pruneOldMessages(48);
    console.log('[Summarizer] Auto-pruned messages older than 48 hours.');
  } catch (err) {
    console.error('[Summarizer] Failed to auto-prune old messages:', err);
  }

  return results;
}

module.exports = {
  getSystemPrompt,
  summarizeGroup,
  generateDailySummaries
};
