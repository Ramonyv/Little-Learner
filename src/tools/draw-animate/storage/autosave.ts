import type { MoveKind, SceneKind } from '../types';

export interface DrawAnimateDraft {
  dataUrl: string;
  move: MoveKind;
  speed: number;
  scene: SceneKind;
  updatedAt: number;
}

const DB_NAME = 'jugnu-draw-animate';
const DB_VERSION = 2;
const STORE_NAME = 'drafts';
const CREATIONS_STORE = 'creations';
const DRAFT_KEY = 'active-draft';
const LS_FALLBACK_KEY = 'll-draw-animate-draft';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(CREATIONS_STORE)) {
        db.createObjectStore(CREATIONS_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IDB open error'));
  });
}

export async function saveDraft(draft: DrawAnimateDraft): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(draft, DRAFT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IDB write error'));
    });
    db.close();
  } catch {
    try {
      localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(draft));
    } catch {
      // Ignore quota errors on fallback
    }
  }
}

export async function loadDraft(): Promise<DrawAnimateDraft | null> {
  try {
    const db = await openDb();
    const result = await new Promise<DrawAnimateDraft | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY);
      req.onsuccess = () => resolve((req.result as DrawAnimateDraft | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error('IDB read error'));
    });
    db.close();
    if (result) return result;
  } catch {
    // Fallback to localStorage
  }

  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    return raw ? (JSON.parse(raw) as DrawAnimateDraft) : null;
  } catch {
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(DRAFT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Ignore
  }
  try {
    localStorage.removeItem(LS_FALLBACK_KEY);
  } catch {
    // Ignore
  }
}
