const fs = require('fs');
const path = require('path');

// Base directory for chat logs
const DATA_DIR = path.join(__dirname, '..', 'data', 'chats');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Ensure base data directory exists
ensureDir(DATA_DIR);

function sanitizeGroupId(groupId) {
  return (groupId || 'unknown').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFilePathForDate(groupId, date) {
  const cleanGroup = sanitizeGroupId(groupId);
  const groupDir = path.join(DATA_DIR, cleanGroup);
  ensureDir(groupDir);
  return path.join(groupDir, `${formatDate(date)}.jsonl`);
}

/**
 * Logs an incoming text message from a group into daily rolling storage.
 * Works across all Node.js versions (v18, v20, v22, v24) with zero native dependencies.
 */
function logMessage({ groupId, senderJid, senderName, text, timestamp }) {
  if (!groupId || !text || !text.trim()) return;

  const prefix = process.env.PREFIX || '/';
  const cleanText = text.trim();

  // Do not log bot commands (e.g. /help, /sticker)
  if (cleanText.startsWith(prefix)) {
    return;
  }

  const msgTimestamp = timestamp ? Number(timestamp) : Date.now();
  const msgDate = new Date(msgTimestamp);
  const filePath = getFilePathForDate(groupId, msgDate);

  const entry = JSON.stringify({
    sender_name: senderName || 'Unknown',
    sender_jid: senderJid || '',
    text: cleanText,
    timestamp: msgTimestamp
  }) + '\n';

  try {
    fs.appendFileSync(filePath, entry, 'utf8');
  } catch (err) {
    console.error(`[ChatLogger] Failed to log message to ${filePath}:`, err);
  }
}

/**
 * Returns messages for a specific group within an epoch timestamp range (inclusive).
 */
function getMessagesForDateRange(groupId, startTime, endTime) {
  const cleanGroup = sanitizeGroupId(groupId);
  const groupDir = path.join(DATA_DIR, cleanGroup);
  if (!fs.existsSync(groupDir)) return [];

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const targetDates = new Set();
  const cur = new Date(startDate);
  while (cur <= endDate) {
    targetDates.add(formatDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  targetDates.add(formatDate(endDate));

  const messages = [];
  for (const d of targetDates) {
    const file = path.join(groupDir, `${d}.jsonl`);
    if (fs.existsSync(file)) {
      try {
        const lines = fs.readFileSync(file, 'utf8').split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          const parsed = JSON.parse(line);
          if (parsed.timestamp >= startTime && parsed.timestamp <= endTime) {
            messages.push(parsed);
          }
        }
      } catch (err) {
        console.error(`[ChatLogger] Error reading log file ${file}:`, err);
      }
    }
  }

  messages.sort((a, b) => a.timestamp - b.timestamp);
  return messages;
}

/**
 * Returns yesterday's messages for a specific group (00:00:00.000 to 23:59:59.999).
 */
function getYesterdayMessages(groupId, baseDate = new Date()) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - 1);

  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

  return {
    dateString: formatDate(d),
    startTime: startOfDay,
    endTime: endOfDay,
    messages: getMessagesForDateRange(groupId, startOfDay, endOfDay)
  };
}

/**
 * Prunes log files older than hoursToKeep (defaults to 48 hours).
 */
function pruneOldMessages(hoursToKeep = 48) {
  if (!fs.existsSync(DATA_DIR)) return;

  const cutoff = Date.now() - (hoursToKeep * 60 * 60 * 1000);
  const cutoffDateStr = formatDate(new Date(cutoff));

  try {
    const groups = fs.readdirSync(DATA_DIR);
    for (const group of groups) {
      const groupDir = path.join(DATA_DIR, group);
      if (!fs.statSync(groupDir).isDirectory()) continue;

      const files = fs.readdirSync(groupDir);
      for (const file of files) {
        if (!file.endsWith('.jsonl')) continue;
        const fileDateStr = file.replace('.jsonl', '');
        // Compare YYYY-MM-DD
        if (fileDateStr < cutoffDateStr) {
          const filePath = path.join(groupDir, file);
          fs.unlinkSync(filePath);
          console.log(`[ChatLogger] Pruned old log file: ${file}`);
        }
      }
    }
  } catch (err) {
    console.error('[ChatLogger] Error pruning old log files:', err);
  }
}

/**
 * Get total count of stored messages and stats.
 */
function getStats() {
  let totalMessages = 0;
  if (fs.existsSync(DATA_DIR)) {
    try {
      const groups = fs.readdirSync(DATA_DIR);
      for (const group of groups) {
        const groupDir = path.join(DATA_DIR, group);
        if (!fs.statSync(groupDir).isDirectory()) continue;
        const files = fs.readdirSync(groupDir);
        for (const file of files) {
          if (!file.endsWith('.jsonl')) continue;
          const content = fs.readFileSync(path.join(groupDir, file), 'utf8');
          totalMessages += content.split('\n').filter(l => l.trim().length > 0).length;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    totalMessages,
    storageType: 'daily_jsonl',
    dataDir: DATA_DIR
  };
}

module.exports = {
  logMessage,
  getMessagesForDateRange,
  getYesterdayMessages,
  pruneOldMessages,
  getStats
};
