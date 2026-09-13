const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log("=== Running Automated Tests for Chat Summarization Flow ===");

// 1. Test Chat Logger
const logger = require('../utils/chatLogger');

const groupA = 'groupA@g.us';
const groupB = 'groupB@g.us';

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

// Verify total before pruning
const statsBefore = logger.getStats();
console.log(`[Test] Total messages before prune: ${statsBefore.totalMessages}`);
assert.strictEqual(statsBefore.totalMessages, 5); // 2 from groupA yest, 1 from groupB yest, 1 today, 1 old

// Test 48h pruning
logger.pruneOldMessages(48);
const statsAfter = logger.getStats();
console.log(`[Test] Total messages after 48h prune: ${statsAfter.totalMessages}`);
assert.strictEqual(statsAfter.totalMessages, 4, '3-day-old message should be pruned');

// 2. Test Scheduler
const { scheduleMidnightJob } = require('../utils/scheduler');
let ran = false;
const timer = scheduleMidnightJob(() => { ran = true; });
assert(timer && typeof timer.cancel === 'function', 'Scheduler should return a cancelable controller');
timer.cancel();
console.log('[Test] Scheduler initialization and cancellation successful.');

console.log("\n>>> ALL AUTOMATED TESTS PASSED SUCCESSFULLY! <<<\n");
