import type { Question, Question3DSceneId, SubjectId, TopicId } from '../../../types';

/**
 * Compact deterministic question builder:
 * Each line: "question|correctAnswer|wrong1|wrong2|wrong3|explanation|optionalScene3d"
 * Rotates the correct option index across 0..3 deterministically so A/B/C/D stay balanced.
 */
export function buildCompactQuestions(
  subjectId: SubjectId,
  prefix: string,
  groups: [TopicId, string][],
): Question[] {
  const out: Question[] = [];
  let seq = 1;

  for (const [topicId, block] of groups) {
    for (const rawLine of block.trim().split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;
      const [question, correct, d1, d2, d3, explanation, scene3d] = line.split('|');
      const slot = ((seq - 1) % 4) as 0 | 1 | 2 | 3;
      const distractors = [d1, d2, d3];
      const options: [string, string, string, string] = ['', '', '', ''];
      let di = 0;
      for (let i = 0; i < 4; i++) {
        options[i] = i === slot ? correct : distractors[di++];
      }
      out.push({
        id: `${prefix}-${String(seq).padStart(2, '0')}`,
        classNumber: 1,
        subjectId,
        topicId,
        difficulty: seq % 5 === 0 ? 'hard' : seq % 3 === 0 ? 'medium' : 'easy',
        question,
        ...(scene3d ? { scene3d: scene3d.trim() as Question3DSceneId } : {}),
        options,
        correctAnswer: slot,
        explanation: explanation || `The correct answer is ${correct}.`,
      });
      seq++;
    }
  }
  return out;
}
