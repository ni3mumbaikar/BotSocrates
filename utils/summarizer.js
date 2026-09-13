const axios = require('axios');
const chatLogger = require('./chatLogger');

// Default API configuration (OpenClaw / AnyAPI / OpenAI-compatible endpoint)
const DEFAULT_API_URL = 'http://localhost:11434/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';
const MIN_MESSAGES_FOR_SUMMARY = 2;

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

📱 FORMAT RULES (Clean WhatsApp formatting with emojis and *bold*):

*🔥 Daily Bakchodi Bulletin (${dateString})*

*🗞️ Kal Ka Lafda & Gossip (Key Highlights):*
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

  // Format transcript cleanly for the LLM
  const transcript = messages.map(m => {
    const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

    const summaryText = response.data?.choices?.[0]?.message?.content?.trim();

    if (!summaryText) {
      throw new Error('Received empty summary response from AI Agent API');
    }

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
