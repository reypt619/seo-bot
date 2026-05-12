// In-memory session store: Map<userId, SessionData>
const sessions = new Map();

/**
 * @typedef {Object} SessionData
 * @property {number} step - Current question index (0-5)
 * @property {Object} answers - Collected answers keyed by question key
 * @property {string} platform - 'Telegram' | 'Line'
 * @property {number} startedAt - Unix timestamp
 */

function getSession(userId) {
  return sessions.get(String(userId)) || null;
}

function createSession(userId, platform = 'Telegram') {
  const session = {
    step: 0,
    answers: {},
    platform,
    startedAt: Date.now(),
  };
  sessions.set(String(userId), session);
  return session;
}

function updateSession(userId, updates) {
  const session = sessions.get(String(userId));
  if (!session) return null;
  const updated = { ...session, ...updates };
  sessions.set(String(userId), updated);
  return updated;
}

function deleteSession(userId) {
  sessions.delete(String(userId));
}

function hasSession(userId) {
  return sessions.has(String(userId));
}

module.exports = { getSession, createSession, updateSession, deleteSession, hasSession };
