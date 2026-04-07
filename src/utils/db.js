import Dexie from 'dexie';

export const db = new Dexie('DaleelDB');

// Version 1 — original schema
db.version(1).stores({
  progress:      '++id, stepId, completedAt',
  bookmarks:     '++id, duaId, createdAt',
  notes:         '++id, title, body, createdAt',
  documents:     '++id, type, imageData, createdAt',
  settings:      'key',
});

// Version 2 — adds personal duas
// NATIVE MIGRATION NOTE: Replace with SQLite table:
//   CREATE TABLE personal_duas (id INTEGER PRIMARY KEY AUTOINCREMENT,
//     title TEXT, body TEXT, arabic TEXT, tags TEXT, created_at TEXT);
db.version(2).stores({
  progress:      '++id, stepId, completedAt',
  bookmarks:     '++id, duaId, createdAt',
  notes:         '++id, title, body, createdAt',
  documents:     '++id, type, imageData, createdAt',
  settings:      'key',
  personal_duas: '++id, title, createdAt',
});

// --- Settings helpers ---
export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key);
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

// --- Progress helpers ---
export async function markStepComplete(stepId) {
  const existing = await db.progress.where('stepId').equals(stepId).first();
  if (!existing) {
    await db.progress.add({ stepId, completedAt: new Date().toISOString() });
  }
}

export async function unmarkStep(stepId) {
  await db.progress.where('stepId').equals(stepId).delete();
}

export async function getCompletedStepIds() {
  const rows = await db.progress.toArray();
  return new Set(rows.map(r => r.stepId));
}

// --- Bookmarks helpers ---
export async function toggleBookmark(duaId) {
  const existing = await db.bookmarks.where('duaId').equals(duaId).first();
  if (existing) {
    await db.bookmarks.delete(existing.id);
    return false;
  } else {
    await db.bookmarks.add({ duaId, createdAt: new Date().toISOString() });
    return true;
  }
}

export async function getBookmarkedDuaIds() {
  const rows = await db.bookmarks.toArray();
  return new Set(rows.map(r => r.duaId));
}

// --- Personal Duas helpers ---
// NATIVE MIGRATION NOTE: Wrap these with SQLite async queries via expo-sqlite or react-native-sqlite-storage
export async function addPersonalDua({ title, body, arabic = '', tags = [] }) {
  return db.personal_duas.add({
    title:     title.trim(),
    body:      body.trim(),
    arabic:    arabic.trim(),
    tags:      Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
  });
}

export async function updatePersonalDua(id, updates) {
  return db.personal_duas.update(id, updates);
}

export async function deletePersonalDua(id) {
  return db.personal_duas.delete(id);
}

export async function getAllPersonalDuas() {
  return db.personal_duas.orderBy('createdAt').reverse().toArray();
}
