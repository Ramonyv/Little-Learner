type Effect = 'ui-tap' | 'tile-slide' | 'puzzle-shuffle' | 'hint-reveal'
  | 'answer-correct' | 'try-again' | 'activity-complete' | 'work-saved';

let enabled = false;
let current: AudioBufferSourceNode | undefined;
let context: AudioContext | undefined;
let sequence = 0;
const clips = new Map<Effect, Promise<AudioBuffer>>();

export const getEnabledAudioContext = () => enabled ? context : undefined;

export function resumeAudioContext() {
  if (!enabled || !context || context.state === 'running') return;
  void context.resume().catch(() => {});
}

export const isSoundEnabled = () => enabled;

export function setSoundEnabled(value: boolean) {
  enabled = value;
  if (!enabled) {
    sequence++;
    current?.stop();
    current = undefined;
  } else {
    try {
      context ??= new AudioContext();
      // Start a silent source during the tap itself. Mobile Safari can keep a
      // context locked when its first source starts after an async fetch.
      const unlock = context.createBufferSource();
      unlock.buffer = context.createBuffer(1, 1, context.sampleRate);
      unlock.connect(context.destination);
      unlock.start();
      unlock.onended = () => unlock.disconnect();
      resumeAudioContext();
      void playEffect('ui-tap');
    } catch { /* Playback is optional on devices without Web Audio. */ }
  }
}

export async function playEffect(effect: Effect, delay = 0) {
  const audio = context;
  if (!enabled || !audio) return;
  resumeAudioContext();
  const ticket = ++sequence;
  try {
    const startAt = audio.currentTime + delay;
    let clip = clips.get(effect);
    if (!clip) {
      clip = fetch('/SFX/' + effect + '.wav').then(response => {
        if (!response.ok) throw new Error('Sound unavailable');
        return response.arrayBuffer();
      }).then(bytes => audio.decodeAudioData(bytes)).catch(error => {
        clips.delete(effect);
        throw error;
      });
      clips.set(effect, clip);
    }
    const buffer = await clip;
    if (!enabled || ticket !== sequence) return;
    const source = audio.createBufferSource();
    const gain = audio.createGain();
    gain.gain.value = 0.55;
    source.buffer = buffer;
    source.connect(gain).connect(audio.destination);
    current?.stop();
    current = source;
    source.onended = () => {
      if (current === source) current = undefined;
      source.disconnect();
      gain.disconnect();
    };
    source.start(Math.max(startAt, audio.currentTime));
  } catch { /* Continue the activity when audio is unavailable. */ }
}

export const playClickSound = () => playEffect('ui-tap');
export const playCorrectSound = () => playEffect('answer-correct');
export const playIncorrectSound = () => playEffect('try-again');
export const playCelebrationFanfare = () => playEffect('activity-complete');
