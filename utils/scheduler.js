/**
 * Scheduler utility to trigger jobs at midnight (00:00 AM) every day.
 */

let scheduledTimer = null;

function scheduleMidnightJob(jobFunction) {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  function getMsUntilNextMidnight() {
    const now = new Date();
    // Schedule for 00:00:05 (5 seconds past midnight) to ensure date has rolled over completely
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      5,
      0
    );
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
