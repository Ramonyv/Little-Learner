import type { SavedAnimationWork } from '../types';

const DB_NAME = 'jugnu-draw-animate';
const DB_VERSION = 2;
const DRAFT_STORE = 'drafts';
const CREATIONS_STORE = 'creations';
const LS_CREATIONS_META = 'll-animations-meta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE);
      }
      if (!db.objectStoreNames.contains(CREATIONS_STORE)) {
        db.createObjectStore(CREATIONS_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IDB open error'));
  });
}

export async function listCreations(): Promise<SavedAnimationWork[]> {
  try {
    const db = await openDb();
    const items = await new Promise<SavedAnimationWork[]>((resolve, reject) => {
      const tx = db.transaction(CREATIONS_STORE, 'readonly');
      const req = tx.objectStore(CREATIONS_STORE).getAll();
      req.onsuccess = () => resolve((req.result as SavedAnimationWork[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('IDB read error'));
    });
    db.close();
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function saveCreation(work: SavedAnimationWork): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CREATIONS_STORE, 'readwrite');
      tx.objectStore(CREATIONS_STORE).put(work);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IDB write error'));
    });
    db.close();

    // Sync lightweight metadata list for quick reference
    const existing = await listCreations();
    try {
      const meta = existing.slice(0, 20).map(({ id, title, move, scene, createdAt }) => ({
        id,
        title,
        move,
        scene,
        createdAt,
      }));
      localStorage.setItem(LS_CREATIONS_META, JSON.stringify(meta));
    } catch {
      // Ignore metadata quota error
    }
  } catch {
    // Ignore storage error
  }
}

export function makeThumbnailDataUrl(source: HTMLCanvasElement, size = 160): string {
  const thumb = document.createElement('canvas');
  thumb.width = size;
  thumb.height = size;
  const ctx = thumb.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min((size - 16) / source.width, (size - 16) / source.height);
  const w = source.width * scale;
  const h = source.height * scale;
  ctx.drawImage(source, (size - w) / 2, (size - h) / 2, w, h);
  return thumb.toDataURL('image/png');
}
