const axios = require('axios');
const chatLogger = require('./chatLogger');

const DEFAULT_HERMES_URL = 'http://localhost:11434/v1/chat/completions';
const DEFAULT_HERMES_MODEL = 'hermes3';
const MIN_MESSAGES_FOR_SUMMARY = 2;

/**
 * Summarizes chat messages for a specific group using the Hermes agent API.
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

  const apiUrl = process.env.HERMES_API_URL || DEFAULT_HERMES_URL;
  const apiKey = process.env.HERMES_API_KEY || '';
  const modelName = process.env.HERMES_MODEL || DEFAULT_HERMES_MODEL;

  const systemPrompt = 
`You are an executive WhatsApp group summarizer.
Your goal is to produce a concise, insightful daily summary of this WhatsApp group's discussion from the previous day.

Format rules for WhatsApp:
- Use *bold* for headings and key highlights.
- Structure clearly with bullet points:
  *📅 Daily Group Summary (${dateString})*
  
  *💡 Key Discussions & Topics:*
  - Brief bullet points of main conversations.
  
  *📌 Decisions & Conclusions:*
  - Any agreements or decisions made (or "None" if purely conversational).
  
  *⚡ Action Items & Next Steps:*
  - Assigned tasks or follow-ups (or "None" if none).

- Do not summarize simple greetings, spam, or one-word banter.
- Keep it concise, professional, and easy to read on mobile.`;

  const userPrompt = `Here is the group chat transcript from yesterday (${dateString}):\n\n${transcript}\n\nPlease generate the executive daily summary.`;

  try {
    console.log(`[Summarizer] Sending ${messages.length} messages from group ${groupId} to Hermes API (${apiUrl})...`);

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
      throw new Error('Received empty summary response from Hermes API');
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
  summarizeGroup,
  generateDailySummaries
};
