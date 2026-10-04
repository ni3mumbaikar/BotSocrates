const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log("=== Running Automated Tests for Chat Summarization Flow ===");

// 1. Test Chat Logger
const logger = require('../utils/chatLogger');

const groupA = 'groupA_test@g.us';
const groupB = 'groupB_test@g.us';

// Clean any previous test runs
logger.db.prepare("DELETE FROM messages WHERE group_id IN (?, ?)").run(groupA, groupB);
const initialStats = logger.getStats();

const now = new Date();
// Today timestamp
const todayTime = now.getTime();
// Yesterday 14:00 timestamp
const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0, 0, 0);
const yesterdayTime = yesterday.getTime();
// 3 days ago timestamp
const oldTime = now.getTime() - (3 * 24 * 60 * 60 * 1000);


// Log message for Group A yesterday
logger.logMessage({
  groupId: groupA,
  senderJid: 'user1@s.whatsapp.net',
  senderName: 'Alice',
  text: 'Deployment for v2 is ready for review.',
  timestamp: yesterdayTime
});

logger.logMessage({
  groupId: groupA,
  senderJid: 'user2@s.whatsapp.net',
  senderName: 'Bob',
  text: 'Reviewed and approved!',
  timestamp: yesterdayTime + 60000
});

// Log command (should be ignored)
logger.logMessage({
  groupId: groupA,
  senderJid: 'user1@s.whatsapp.net',
  senderName: 'Alice',
  text: '/help admin',
  timestamp: yesterdayTime + 120000
});

// Log message for Group B yesterday (isolation test)
logger.logMessage({
  groupId: groupB,
  senderJid: 'user3@s.whatsapp.net',
  senderName: 'Charlie',
  text: 'Discussing marketing budget.',
  timestamp: yesterdayTime
});

// Log message for Group A today (should NOT appear in yesterday's summary)
logger.logMessage({
  groupId: groupA,
  senderJid: 'user1@s.whatsapp.net',
  senderName: 'Alice',
  text: 'Good morning from today!',
  timestamp: todayTime
});

// Log message for Group A 3 days ago (for pruning test)
logger.logMessage({
  groupId: groupA,
  senderJid: 'user1@s.whatsapp.net',
  senderName: 'Alice',
  text: 'Old message from 3 days ago',
  timestamp: oldTime
});

// Verify yesterday's query for Group A
const resA = logger.getYesterdayMessages(groupA, now);
console.log(`[Test] Group A yesterday messages count: ${resA.messages.length}`);
assert.strictEqual(resA.messages.length, 2, 'Group A should have exactly 2 messages from yesterday (commands excluded)');
assert.strictEqual(resA.messages[0].text, 'Deployment for v2 is ready for review.');
assert.strictEqual(resA.messages[1].text, 'Reviewed and approved!');

// Verify yesterday's query for Group B (Isolated!)
const resB = logger.getYesterdayMessages(groupB, now);
console.log(`[Test] Group B yesterday messages count: ${resB.messages.length}`);
assert.strictEqual(resB.messages.length, 1, 'Group B should have exactly 1 message');
assert.strictEqual(resB.messages[0].text, 'Discussing marketing budget.');

// Test 48h pruning
const oldMsgCheckBefore = logger.db.prepare("SELECT COUNT(*) as count FROM messages WHERE group_id = ? AND timestamp = ?").get(groupA, oldTime);
assert.strictEqual(oldMsgCheckBefore.count, 1, 'Old message should exist before prune');

logger.pruneOldMessages(48);

const oldMsgCheckAfter = logger.db.prepare("SELECT COUNT(*) as count FROM messages WHERE group_id = ? AND timestamp = ?").get(groupA, oldTime);
assert.strictEqual(oldMsgCheckAfter.count, 0, '3-day-old message should be pruned');

const yesterdayCheckAfter = logger.db.prepare("SELECT COUNT(*) as count FROM messages WHERE group_id = ? AND timestamp = ?").get(groupA, yesterdayTime);
assert.strictEqual(yesterdayCheckAfter.count, 1, 'Yesterday message should NOT be pruned');
console.log('[Test] 48h message pruning successfully pruned old messages while keeping yesterday messages.');



// 2. Test Scheduler
const { scheduleMidnightJob } = require('../utils/scheduler');
let ran = false;
const timer = scheduleMidnightJob(() => { ran = true; });
assert(timer && typeof timer.cancel === 'function', 'Scheduler should return a cancelable controller');
timer.cancel();
console.log('[Test] Scheduler initialization and cancellation successful.');

// 3. Test Summarizer Truncation & Continuation Helpers
const {
  stripTruncationNotice,
  isTruncated,
  stitchChunks,
  sanitizeWhatsAppFormatting,
  getSystemPrompt
} = require('../utils/summarizer');

// Test stripTruncationNotice
const sampleWithWarning = `• *Topic:* Big debate on philosophy.\n\n⚠️ Reply truncated at the model's output token limit. The text above is partial — ask to continue it.`;
const stripped = stripTruncationNotice(sampleWithWarning);
assert(!stripped.includes('Reply truncated'), 'Should strip truncation banner');
assert(!stripped.includes('partial'), 'Should strip partial text note');
assert.strictEqual(stripped, '• *Topic:* Big debate on philosophy.');
console.log('[Test] stripTruncationNotice works cleanly.');

// Test isTruncated
assert(isTruncated('Some text', 'length'), 'Should detect finish_reason: length');
assert(isTruncated(sampleWithWarning, 'stop'), 'Should detect truncation text even if finish_reason is stop');
assert(!isTruncated('Complete text ending normally.', 'stop'), 'Should not flag complete text');
console.log('[Test] isTruncated detection works as expected.');

// Test stitchChunks with word overlap
const chunk1 = 'Shivam L countered with equal energy. Vivek roasted';
const chunk2 = 'Vivek roasted him for bringing up old drama.';
const stitched = stitchChunks(chunk1, chunk2);
assert.strictEqual(stitched, 'Shivam L countered with equal energy. Vivek roasted him for bringing up old drama.');
console.log('[Test] stitchChunks cleanly dedupes overlapping boundary words.');

// Test sanitizeWhatsAppFormatting
const unformatted = `**🔥 Daily Bakchodi Bulletin**\n*🗞️ Kal Ka Lafda & Gossip (Key Highlights):*\n•*"Quote"* from Prasad\n\n⚠️ Reply truncated at the model's output token limit.\nThe text above is partial — ask to continue it.`;
const formatted = sanitizeWhatsAppFormatting(unformatted);
assert(!formatted.includes('**'), 'Should not have markdown double asterisks');
assert(!formatted.includes('*🗞️ Kal Ka Lafda'), 'Kal Ka Lafda header should not be bolded');
assert(!formatted.includes('Reply truncated'), 'Should strip truncation notice');
assert(!formatted.includes('The text above is partial'), 'Should strip partial text notice');
console.log('[Test] sanitizeWhatsAppFormatting produces clean WhatsApp text.');

// Test getSystemPrompt does not contain the repetitive phrase
const prompt = getSystemPrompt('2026-10-04');
assert(!prompt.includes('Ghanta kuch decide nahi hua'), 'Prompt should not contain repetitive boilerplate phrase');
assert(prompt.includes('DYNAMIC VARIETY'), 'Prompt should instruct dynamic variety');
// Clean up test fixtures from DB
logger.db.prepare("DELETE FROM messages WHERE group_id IN (?, ?)").run(groupA, groupB);

console.log("\n>>> ALL AUTOMATED TESTS PASSED SUCCESSFULLY! <<<\n");


