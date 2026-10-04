/**
 * Scheduler utility to trigger jobs at midnight (00:00 AM) every day.
 */

const DEFAULT_TIMEZONE = process.env.TZ || 'Asia/Kolkata';

function getTimeZoneOffsetMs(date, timeZone = DEFAULT_TIMEZONE) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return tzDate.getTime() - utcDate.getTime();
}

function getZonedDate(year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0, timeZone = DEFAULT_TIMEZONE) {
  const utcCandidate = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
  const offset = getTimeZoneOffsetMs(utcCandidate, timeZone);
  return new Date(utcCandidate.getTime() - offset);
}

function getTzParts(d, timeZone = DEFAULT_TIMEZONE) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false
  });
  const parts = Object.fromEntries(f.formatToParts(d).map(p => [p.type, p.value]));
  return {
    year: parseInt(parts.year),
    month: parseInt(parts.month),
    day: parseInt(parts.day)
  };
}

let scheduledTimer = null;

function scheduleMidnightJob(jobFunction) {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  function getMsUntilNextMidnight() {
    const timeZone = process.env.TZ || 'Asia/Kolkata';
    const now = new Date();
    const parts = getTzParts(now, timeZone);
    // Target 00:00:05 in target timezone (5 seconds past midnight)
    const nextMidnight = getZonedDate(parts.year, parts.month, parts.day + 1, 0, 0, 5, 0, timeZone);
    return nextMidnight.getTime() - now.getTime();
  }

  function runAndReschedule() {
    console.log(`[Scheduler] Midnight reached at ${new Date().toISOString()}. Executing scheduled job...`);
    try {
      const result = jobFunction();
      if (result && typeof result.then === 'function') {
        result.catch(err => console.error('[Scheduler] Error in scheduled job execution:', err));
      }
    } catch (err) {
      console.error('[Scheduler] Synchronous error in scheduled job:', err);
    }

    // Schedule next run
    const msUntilNext = getMsUntilNextMidnight();
    console.log(`[Scheduler] Next midnight run scheduled in ${(msUntilNext / 1000 / 60 / 60).toFixed(2)} hours.`);
    scheduledTimer = setTimeout(runAndReschedule, msUntilNext);
  }

  const msUntilMidnight = getMsUntilNextMidnight();
  console.log(`[Scheduler] Midnight scheduler initialized. Next run in ${(msUntilMidnight / 1000 / 60 / 60).toFixed(2)} hours.`);
  scheduledTimer = setTimeout(runAndReschedule, msUntilMidnight);

  return {
    cancel: () => {
      if (scheduledTimer) {
        clearTimeout(scheduledTimer);
        scheduledTimer = null;
        console.log('[Scheduler] Midnight job cancelled.');
      }
    }
  };
}

module.exports = {
  scheduleMidnightJob
};
