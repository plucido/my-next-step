const STORAGE_KEY = "mns_analytics_queue";
const MAX_QUEUE_SIZE = 500;
const isDev = typeof window !== "undefined" && window.location?.hostname === "localhost";

function getQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  try {
    // Trim to max size, keeping newest events
    const trimmed = queue.length > MAX_QUEUE_SIZE ? queue.slice(-MAX_QUEUE_SIZE) : queue;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — silently drop
  }
}

let sessionId = null;
let userId = null;

function getSessionId() {
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  return sessionId;
}

/**
 * Track an analytics event.
 * @param {string} event - Event name (e.g. "step_completed", "chat_sent")
 * @param {Object} [properties] - Optional event properties
 */
export function track(event, properties = {}) {
  const entry = {
    event,
    properties,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    userId: userId || null,
  };

  if (isDev) {
    console.log("[analytics]", event, properties);
  }

  const queue = getQueue();
  queue.push(entry);
  saveQueue(queue);
}

/**
 * Identify the current user for analytics attribution.
 * @param {string} uid - User ID
 */
export function identify(uid) {
  userId = uid;
  track("identify", { uid });
}

/**
 * Track a page or screen view.
 * @param {string} pageName - Name of the page/screen
 */
export function pageView(pageName) {
  track("page_view", { page: pageName });
}

/**
 * Flush the event queue to the analytics endpoint.
 * For now this is a no-op placeholder — events stay in localStorage.
 * When /api/analytics is built, this will batch-send and clear the queue.
 */
export async function flush() {
  const queue = getQueue();
  if (queue.length === 0) return;

  // Future: POST to /api/analytics
  // try {
  //   await fetch("/api/analytics", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ events: queue }),
  //   });
  //   saveQueue([]);
  // } catch {
  //   // Retry next time
  // }

  if (isDev) {
    console.log(`[analytics] ${queue.length} events queued (flush is a no-op until /api/analytics is built)`);
  }
}

// Auto-track session start and page load
if (typeof window !== "undefined") {
  track("session_start");
  track("page_load", {
    url: window.location.pathname,
    referrer: document.referrer || null,
  });
}
