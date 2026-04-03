import Dexie from 'dexie';

export const db = new Dexie('DaleelDB');

db.version(1).stores({
  progress:   '++id, stepId, completedAt',
  bookmarks:  '++id, duaId, createdAt',
  notes:      '++id, title, body, createdAt',
  documents:  '++id, type, imageData, createdAt',
  settings:   'key',
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
