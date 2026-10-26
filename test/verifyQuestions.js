// Automated verification script for question bank integrity
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questionsPath = path.resolve(__dirname, '../src/data/questions/class1/english.json');
const rawData = fs.readFileSync(questionsPath, 'utf8');
const questions = JSON.parse(rawData);

console.log(`\n🔍 Verifying Little Learner Question Bank: ${questions.length} total questions found.`);

let passed = true;
const idSet = new Set();
const topicCounts = {};

questions.forEach((q, idx) => {
  // 1. Check ID uniqueness
  if (!q.id || idSet.has(q.id)) {
    console.error(`❌ Duplicate or missing ID at index ${idx}: ${q.id}`);
    passed = false;
  }
  idSet.add(q.id);

  // 2. Check required fields
  if (q.classNumber !== 1) {
    console.error(`❌ Invalid classNumber for ${q.id}: ${q.classNumber}`);
    passed = false;
  }
  if (q.subjectId !== 'english') {
    console.error(`❌ Invalid subjectId for ${q.id}: ${q.subjectId}`);
    passed = false;
  }
  if (!q.topicId) {
    console.error(`❌ Missing topicId for ${q.id}`);
    passed = false;
  }
  topicCounts[q.topicId] = (topicCounts[q.topicId] || 0) + 1;

  // 3. Check options length
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    console.error(`❌ Expected exactly 4 options for ${q.id}, got ${q.options?.length}`);
    passed = false;
  }

  // 4. Check correctAnswer bounds
  if (![0, 1, 2, 3].includes(q.correctAnswer)) {
    console.error(`❌ Invalid correctAnswer for ${q.id}: ${q.correctAnswer}`);
    passed = false;
  }

  // 5. Check explanation
  if (!q.explanation || q.explanation.trim().length === 0) {
    console.error(`❌ Missing explanation for ${q.id}`);
    passed = false;
  }

  // 6. Check question text
  if (!q.question || q.question.trim().length === 0) {
    console.error(`❌ Missing question text for ${q.id}`);
    passed = false;
  }
});

console.log('\n📊 Questions per topic:');
Object.entries(topicCounts).forEach(([topic, count]) => {
  console.log(`  • ${topic}: ${count} questions`);
});

if (passed) {
  console.log(`\n✅ ALL ${questions.length} QUESTIONS PASSED INTEGRITY & VALIDATION CHECKS!`);
} else {
  console.error('\n❌ VALIDATION FAILED!');
  process.exit(1);
}
