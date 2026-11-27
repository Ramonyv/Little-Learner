import type { PixelDocument } from '../engine/types';

const DB_NAME = 'jugnu-pixel-art-db';
const STORE_NAME = 'autosave';
const AUTOSAVE_KEY = 'current-session';
const LS_FALLBACK_KEY = 'll-pixel-art-autosave';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePixelAutosave(doc: PixelDocument): Promise<void> {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(doc));
  } catch {
    /* ignore quota errors */
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(doc, AUTOSAVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* localStorage fallback already written */
  }
}

export async function loadPixelAutosave(): Promise<PixelDocument | null> {
  try {
    const db = await openDb();
    const result = await new Promise<PixelDocument | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(AUTOSAVE_KEY);
      req.onsuccess = () => resolve((req.result as PixelDocument | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (result && Array.isArray(result.pixels)) return result;
  } catch {
    /* fall through to localStorage */
  }
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PixelDocument;
    if (parsed && Array.isArray(parsed.pixels)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}
