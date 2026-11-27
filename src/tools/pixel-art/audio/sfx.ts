import { getEnabledAudioContext, isSoundEnabled } from '../../../utils/soundEffects';

const SCALE_NOTES = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];

/**
 * Plays a soft musical "pip" that rises gently along a stroke.
 * Volume is capped low (<= 0.09) so rapid drawing stays gentle on kids' ears.
 */
export function playPixelPip(stepInStroke = 0): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const note = SCALE_NOTES[Math.min(SCALE_NOTES.length - 1, stepInStroke % SCALE_NOTES.length)];
    const jitter = 1 + (Math.random() - 0.5) * 0.03;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(note * jitter * 1.06, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    /* Web Audio optional */
  }
}

export function playPixelErasePop(): void {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.07);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    /* Web Audio optional */
  }
}

export function speakPixelLabel(text: string): void {
  if (!isSoundEnabled() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.96;
    utter.pitch = 1.08;
    utter.volume = 0.7;
    window.speechSynthesis.speak(utter);
  } catch {
    /* SpeechSynthesis optional */
  }
}
