import { useSyncExternalStore } from 'react';

let recent: string[] = [];
const listeners = new Set<() => void>();

export function rememberColor(value: string) {
  const hex = value.toLowerCase();
  const color = hex.length === 4
    ? '#' + [...hex.slice(1)].map(digit => digit + digit).join('')
    : hex;
  if (recent[0] === color) return;
  recent = [color, ...recent.filter(previous => previous !== color)].slice(0, 8);
  listeners.forEach(notify => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}

export function useRecentColors() {
  return useSyncExternalStore(subscribe, () => recent, () => recent);
}
