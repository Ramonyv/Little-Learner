export const workKeys = ['ll-drawings','ll-coloring','ll-results','ll-voxels'] as const;

export function readWork<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}
export function saveWork(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { window.dispatchEvent(new CustomEvent('work-save-error')); }
}
