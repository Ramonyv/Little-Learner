import type { Question, Question3DSceneId } from '../types';

/**
 * Resolves the best 3D candy-clay visual scene for any question.
 * Uses explicit `question.scene3d` first, then falls back to safe keyword + topic matching
 * so every subject and question feels alive without giving away the answer.
 */
export function resolveQuestion3DScene(question: Question): Question3DSceneId | null {
  if (question.scene3d) return question.scene3d;
  if (question.illustration) return null; // Preserve existing 2D SVG clues where explicitly set

  const q = question.question.toLowerCase();

  // Safe keyword matching (shows contextual theme without spoiling)
  if (q.includes('saturn') || q.includes('rings')) return 'saturn';
  if (q.includes('moon')) return 'moon';
  if (q.includes('rainbow')) return 'rainbow';
  if (q.includes('rain') || q.includes('monsoon') || q.includes('cloud') || q.includes('snow')) return 'cloud-rain';
  if (q.includes('sun') || q.includes('summer')) return 'sun';
  if (q.includes('earth') || q.includes('planet')) return 'earth';
  if (q.includes('clock') || q.includes("o'clock") || q.includes('time')) return 'clock-3';
  if (q.includes('coin') || q.includes('₹') || q.includes('money') || q.includes('cost')) return 'coins';
  if (q.includes('heavy') || q.includes('heavier') || q.includes('weigh')) return 'balance';
  if (q.includes('longer') || q.includes('longest') || q.includes('shorter') || q.includes('ruler') || q.includes('cube')) return 'ruler';
  if (q.includes('flag') || q.includes('india') || q.includes('diwali') || q.includes('holi')) return 'flag-india';
  if (q.includes('tree') || q.includes('plant') || q.includes('leaf') || q.includes('leaves') || q.includes('seed')) return 'tree';
  if (q.includes('flower') || q.includes('rose') || q.includes('lotus') || q.includes('spring')) return 'flower';
  if (q.includes('apple') || q.includes('fruit') || q.includes('mango')) return 'apple';
  if (q.includes('car') || q.includes('bus') || q.includes('train') || q.includes('vehicle')) return 'car';
  if (q.includes('house') || q.includes('home') || q.includes('school') || q.includes('library')) return 'house';
  if (q.includes('book') || q.includes('read') || q.includes('story')) return 'book';
  if (q.includes('pencil') || q.includes('write') || q.includes('spell')) return 'pencil';
  if (q.includes('pattern') || q.includes('sequence') || q.includes('comes next')) return 'pattern-shapes';

  // Topic-level fallback so every question has a cheerful 3D companion
  switch (question.topicId) {
    case 'numbers':
    case 'addition-subtraction':
      return 'pattern-blocks';
    case 'shapes':
      return 'cube';
    case 'time-and-money':
      return 'clock-4';
    case 'measurement':
      return 'balance';
    case 'plants':
    case 'living-things':
      return 'flower';
    case 'earth-and-sky':
    case 'air-and-water':
    case 'space-and-seasons':
      return 'earth';
    case 'india-and-festivals':
      return 'flag-india';
    case 'community':
      return 'house';
    case 'odd-one-out':
    case 'analogies':
    case 'directions-and-order':
      return 'robot';
    case 'patterns':
      return 'pattern-shapes';
    case 'vocabulary':
    case 'grammar':
    case 'spelling':
    case 'reading-comprehension':
    case 'sentence-formation':
    case 'opposites':
      return 'book';
    default:
      return 'cube';
  }
}
