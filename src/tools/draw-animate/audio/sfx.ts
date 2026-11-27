import { getEnabledAudioContext } from '../../../utils/soundEffects';

const MASTER_VOL = 0.5;

function vary(base: number): number {
  return base * (0.95 + Math.random() * 0.1); // ±5% pitch variation
}

export function playMagicWhooshDing(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Soft upward whoosh
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(vary(240), now);
    osc1.frequency.exponentialRampToValueAtTime(vary(680), now + 0.24);
    g1.gain.setValueAtTime(0.001, now);
    g1.gain.linearRampToValueAtTime(0.18 * MASTER_VOL, now + 0.06);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(g1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Sparkle ding
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(vary(880), now + 0.16);
    osc2.frequency.exponentialRampToValueAtTime(vary(1320), now + 0.36);
    g2.gain.setValueAtTime(0.001, now + 0.16);
    g2.gain.linearRampToValueAtTime(0.22 * MASTER_VOL, now + 0.19);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.5);
  } catch {
    // Ignore audio errors
  }
}

export function playBoing(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(vary(190), now);
    osc.frequency.exponentialRampToValueAtTime(vary(420), now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(vary(260), now + 0.22);
    gain.gain.setValueAtTime(0.14 * MASTER_VOL, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // Ignore
  }
}

export function playFootstepPop(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(vary(180), now);
    osc.frequency.exponentialRampToValueAtTime(vary(95), now + 0.06);
    gain.gain.setValueAtTime(0.1 * MASTER_VOL, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Ignore
  }
}

export function playFlutter(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(vary(420), now);
    osc.frequency.exponentialRampToValueAtTime(vary(560), now + 0.08);
    gain.gain.setValueAtTime(0.08 * MASTER_VOL, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  } catch {
    // Ignore
  }
}

export function playBubbleBlip(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(vary(320), now);
    osc.frequency.exponentialRampToValueAtTime(vary(740), now + 0.1);
    gain.gain.setValueAtTime(0.11 * MASTER_VOL, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // Ignore
  }
}

export function playDanceBeatStep(accent: boolean): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = accent ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(vary(accent ? 330 : 220), now);
    osc.frequency.exponentialRampToValueAtTime(vary(accent ? 165 : 110), now + 0.09);
    gain.gain.setValueAtTime((accent ? 0.12 : 0.08) * MASTER_VOL, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Ignore
  }
}

export function playGiggle(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const notes = [520, 660, 580, 780];
    notes.forEach((freq, i) => {
      const t0 = now + i * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(vary(freq), t0);
      osc.frequency.exponentialRampToValueAtTime(vary(freq * 1.15), t0 + 0.05);
      gain.gain.setValueAtTime(0.14 * MASTER_VOL, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.065);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.07);
    });
  } catch {
    // Ignore
  }
}

export function playStickerPop(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(vary(380), now);
    osc.frequency.exponentialRampToValueAtTime(vary(760), now + 0.08);
    gain.gain.setValueAtTime(0.16 * MASTER_VOL, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  } catch {
    // Ignore
  }
}

export function playPoofSound(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(vary(340), now);
    osc.frequency.exponentialRampToValueAtTime(vary(110), now + 0.18);
    gain.gain.setValueAtTime(0.16 * MASTER_VOL, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  } catch {
    // Ignore
  }
}

export function playBrushTick(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(vary(420), now);
    gain.gain.setValueAtTime(0.025 * MASTER_VOL, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Ignore
  }
}
