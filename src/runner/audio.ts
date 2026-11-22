import { getEnabledAudioContext } from '../utils/soundEffects';

const files = ['ram-coin', 'special-coin', 'jump', 'flight-start', 'shield-break',
  'heart-lost', 'temple-bell', 'temple-jai-shri-ram'] as const;
type Clip = typeof files[number];
export type RunnerCue = Exclude<Clip, 'temple-bell' | 'temple-jai-shri-ram'> | 'temple';

export class RunnerAudio {
  private buffers = new Map<Clip, Promise<AudioBuffer>>();
  private voices = new Set<AudioBufferSourceNode>();
  private generation = 0;
  private lastCoin = -Infinity;
  private note = 0;

  private load(clip: Clip, context: AudioContext) {
    let buffer = this.buffers.get(clip);
    if (!buffer) {
      buffer = fetch('/Hanuman Run/SFX Sounds/' + clip + '.wav')
        .then(response => {
          if (!response.ok) throw new Error('Sound unavailable');
          return response.arrayBuffer();
        })
        .then(bytes => context.decodeAudioData(bytes))
        .catch(error => { this.buffers.delete(clip); throw error; });
      this.buffers.set(clip, buffer);
    }
    return buffer;
  }

  preload() {
    const context = getEnabledAudioContext();
    if (context) void Promise.allSettled(files.map(file => this.load(file, context)));
  }

  stop() {
    this.generation++;
    for (const voice of this.voices) voice.stop();
    this.voices.clear();
    this.lastCoin = -Infinity;
  }

  async play(cue: RunnerCue) {
    const context = getEnabledAudioContext();
    if (!context) return;
    const generation = this.generation;
    const clips: Clip[] = cue === 'temple' ? ['temple-bell', 'temple-jai-shri-ram'] : [cue];
    let pitch = 1;
    if (cue === 'ram-coin') {
      this.note = context.currentTime - this.lastCoin < 0.45 ? (this.note + 1) % 3 : 0;
      this.lastCoin = context.currentTime;
      pitch = [1, 1.122, 1.26][this.note];
    }
    try {
      const buffers = await Promise.all(clips.map(clip => this.load(clip, context)));
      if (generation !== this.generation || !getEnabledAudioContext()) return;
      const start = context.currentTime;
      buffers.forEach((buffer, i) => {
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = buffer;
        source.playbackRate.value = pitch;
        gain.gain.value = clips[i] === 'temple-bell' ? .25 : clips[i] === 'temple-jai-shri-ram' ? .75 : .45;
        source.connect(gain).connect(context.destination);
        this.voices.add(source);
        source.onended = () => { this.voices.delete(source); source.disconnect(); gain.disconnect(); };
        source.start(start + i * .25);
      });
    } catch { /* Audio availability never interrupts a run. */ }
  }
}
