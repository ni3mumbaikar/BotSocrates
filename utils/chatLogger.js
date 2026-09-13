const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Ensure db directory or file exists
const DB_PATH = path.join(__dirname, '..', 'chats.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrency and initialize schema
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    sender_jid TEXT NOT NULL,
    sender_name TEXT,
    text TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_group_timestamp ON messages (group_id, timestamp);
`);

// Prepared statements for high performance
const insertStmt = db.prepare(`
  INSERT INTO messages (group_id, sender_jid, sender_name, text, timestamp)
  VALUES (?, ?, ?, ?, ?)
`);

const selectRangeStmt = db.prepare(`
  SELECT sender_name, sender_jid, text, timestamp
  FROM messages
  WHERE group_id = ? AND timestamp >= ? AND timestamp <= ?
  ORDER BY timestamp ASC
`);

const deleteOldStmt = db.prepare(`
  DELETE FROM messages WHERE timestamp < ?
`);

const countStmt = db.prepare(`
  SELECT COUNT(*) as total FROM messages
`);

/**
 * Logs an incoming text message from a group into the database.
 */
function logMessage({ groupId, senderJid, senderName, text, timestamp }) {
  if (!groupId || !text || !text.trim()) return;

  const prefix = process.env.PREFIX || '/';
  const cleanText = text.trim();

  // Do not log bot commands (e.g. /help, /sticker)
  if (cleanText.startsWith(prefix)) {
    return;
  }

  const msgTimestamp = timestamp || Date.now();
  insertStmt.run(groupId, senderJid || '', senderName || 'Unknown', cleanText, msgTimestamp);
}

/**
 * Returns messages for a specific group within an epoch timestamp range (inclusive).
 */
function getMessagesForDateRange(groupId, startTime, endTime) {
  return selectRangeStmt.all(groupId, startTime, endTime);
}

/**
 * Returns yesterday's messages for a specific group (00:00:00.000 to 23:59:59.999).
 * If targetDate is provided, it calculates for the day prior to targetDate.
 */
function getYesterdayMessages(groupId, baseDate = new Date()) {
  const d = new Date(baseDate);
  // Yesterday
  d.setDate(d.getDate() - 1);

  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

  return {
    dateString: d.toISOString().split('T')[0],
    startTime: startOfDay,
    endTime: endOfDay,
    messages: getMessagesForDateRange(groupId, startOfDay, endOfDay)
  };
}

/**
 * Prunes messages older than hoursToKeep (defaults to 48 hours) to prevent disk accumulation.
 */
function pruneOldMessages(hoursToKeep = 48) {
  const cutoff = Date.now() - (hoursToKeep * 60 * 60 * 1000);
  const result = deleteOldStmt.run(cutoff);
  try {
    db.exec('PRAGMA optimize;');
  } catch (e) {
    // ignore optimize errors
  }
  return result;
}

/**
 * Get total count of stored messages.
 */
function getStats() {
  const row = countStmt.get();
  return {
    totalMessages: row ? row.total : 0,
    dbPath: DB_PATH
  };
}

module.exports = {
  logMessage,
  getMessagesForDateRange,
  getYesterdayMessages,
  pruneOldMessages,
  getStats
};
