import fs from 'fs';

// Map official PDF questions directly
const officialAnswerKey = {
  1: 'B', 2: 'C', 3: 'B', 4: 'A', 5: 'C',
  6: 'B', 7: 'A', 8: 'B', 9: 'B', 10: 'C',
  11: 'D', 12: 'B', 13: 'A', 14: 'C', 15: 'D',
  16: 'B', 17: 'B', 18: 'C', 19: 'C', 20: 'B',
  21: 'B', 22: 'C', 23: 'B', 24: 'C', 25: 'B',
  26: 'A', 27: 'B', 28: 'C', 29: 'D', 30: 'B',
  31: 'C', 32: 'A', 33: 'B', 34: 'C', 35: 'B',
  36: 'A', 37: 'B', 38: 'B', 39: 'C', 40: 'A',
  41: 'B', 42: 'B', 43: 'B', 44: 'C', 45: 'A',
  46: 'B', 47: 'A', 48: 'C', 49: 'B', 50: 'C',
  51: 'B', 52: 'C', 53: 'A', 54: 'B', 55: 'C',
  56: 'B', 57: 'C', 58: 'C', 59: 'B', 60: 'C'
};

const charToIndex = { A: 0, B: 1, C: 2, D: 3 };

const questions = [
  // 1-5: Opposites
  {
    num: 1,
    topicId: 'opposites',
    difficulty: 'easy',
    illustration: 'sun',
    question: 'Which word means the opposite of HOT?',
    options: ['Warm', 'Cold', 'Sunny', 'Boiling'],
    explanation: 'The opposite of HOT is COLD, like ice!'
  },
  {
    num: 2,
    topicId: 'opposites',
    difficulty: 'easy',
    illustration: 'smile',
    question: 'Which word means the opposite of HAPPY?',
    options: ['Glad', 'Joyful', 'Sad', 'Kind'],
    explanation: 'When someone is not HAPPY, they feel SAD.'
  },
  {
    num: 3,
    topicId: 'opposites',
    difficulty: 'easy',
    illustration: 'elephant',
    question: 'Which word means the opposite of BIG?',
    options: ['Huge', 'Small', 'Large', 'Tall'],
    explanation: 'The opposite of BIG is SMALL, like a tiny ant compared to an elephant.'
  },
  {
    num: 4,
    topicId: 'opposites',
    difficulty: 'easy',
    illustration: 'clock',
    question: 'Which word means the opposite of EARLY?',
    options: ['Late', 'Soon', 'Quick', 'First'],
    explanation: 'The opposite of arriving EARLY is arriving LATE.'
  },
  {
    num: 5,
    topicId: 'opposites',
    difficulty: 'easy',
    illustration: 'dog',
    question: 'Which word means the opposite of CLEAN?',
    options: ['Neat', 'Fresh', 'Dirty', 'Tidy'],
    explanation: 'The opposite of CLEAN is DIRTY.'
  },

  // 6-8: Synonyms (Vocabulary)
  {
    num: 6,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'car',
    question: 'Which word means the same as QUICK?',
    options: ['Slow', 'Fast', 'Quiet', 'Soft'],
    explanation: 'QUICK and FAST both mean moving with high speed.'
  },
  {
    num: 7,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'cat',
    question: 'Which word means the same as TINY?',
    options: ['Little', 'Giant', 'Long', 'Wide'],
    explanation: 'TINY means very small or LITTLE.'
  },
  {
    num: 8,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'smile',
    question: 'Which word means the same as ANGRY?',
    options: ['Calm', 'Mad', 'Happy', 'Kind'],
    explanation: 'When you are ANGRY, you feel upset or MAD.'
  },

  // 9-11: Spelling
  {
    num: 9,
    topicId: 'spelling',
    difficulty: 'easy',
    illustration: 'pencil',
    question: 'Which is the correct spelling?',
    options: ['Becaus', 'Because', 'Becose', 'Beacuse'],
    explanation: 'The correct spelling is "Because" (B-E-C-A-U-S-E).'
  },
  {
    num: 10,
    topicId: 'spelling',
    difficulty: 'easy',
    illustration: 'boy',
    question: 'Which is the correct spelling?',
    options: ['Frend', 'Freind', 'Friend', 'Frind'],
    explanation: 'Remember "i before e" in "Friend" (F-R-I-E-N-D).'
  },
  {
    num: 11,
    topicId: 'spelling',
    difficulty: 'medium',
    illustration: 'elephant',
    question: 'Which is the correct spelling?',
    options: ['Elefant', 'Eliphant', 'Elephent', 'Elephant'],
    explanation: 'The big animal with a trunk is spelled "Elephant" (E-L-E-P-H-A-N-T).'
  },

  // 12-15: Rhyming & Odd one out (Vocabulary)
  {
    num: 12,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'cake',
    question: 'Which word rhymes with CAKE?',
    options: ['Book', 'Lake', 'Cup', 'Cat'],
    explanation: 'CAKE and LAKE end with the same rhyming sound "-ake".'
  },
  {
    num: 13,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'sun',
    question: 'Which word rhymes with LIGHT?',
    options: ['Night', 'Late', 'Leaf', 'Little'],
    explanation: 'LIGHT and NIGHT have the exact same ending sound "-ight".'
  },
  {
    num: 14,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'apple',
    question: 'Which word does NOT belong?',
    options: ['Apple', 'Banana', 'Carrot', 'Mango'],
    explanation: 'Apple, Banana, and Mango are all fruits, while Carrot is a vegetable.'
  },
  {
    num: 15,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'pencil',
    question: 'Which word does NOT belong?',
    options: ['Run', 'Jump', 'Sleep', 'Pencil'],
    explanation: 'Run, Jump, and Sleep are all action verbs, while Pencil is a stationary thing (noun).'
  },

  // 16-20: Articles, verbs, pronouns (Grammar)
  {
    num: 16,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'apple',
    question: 'Choose the correct word: ___ apple is red.',
    options: ['A', 'An', 'Thee', 'Am'],
    explanation: '"Apple" begins with a vowel sound (A), so we use "An apple".'
  },
  {
    num: 17,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'dog',
    question: 'Choose the correct word: I saw ___ dog.',
    options: ['an', 'a', 'are', 'am'],
    explanation: '"Dog" starts with a consonant sound (D), so we say "a dog".'
  },
  {
    num: 18,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'boy',
    question: 'Choose the correct word: She ___ my sister.',
    options: ['am', 'are', 'is', 'be'],
    explanation: 'With singular pronoun "She", we use "is": "She is my sister."'
  },
  {
    num: 19,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'park',
    question: 'Choose the correct word: They ___ playing.',
    options: ['is', 'am', 'are', 'was'],
    explanation: '"They" is plural (more than one), so we use "are": "They are playing."'
  },
  {
    num: 20,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'boy',
    question: 'Choose the correct word: I ___ seven years old.',
    options: ['is', 'am', 'are', 'be'],
    explanation: 'With the pronoun "I", we always use "am" in present tense: "I am."'
  },

  // 21-26: Has/Have, Plurals & Singulars (Grammar)
  {
    num: 21,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'school',
    question: 'Choose the correct word: He ___ a blue bag.',
    options: ['have', 'has', 'having', 'had'],
    explanation: 'We use "has" with singular pronouns: "He has a blue bag."'
  },
  {
    num: 22,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'pencil',
    question: 'Choose the correct word: We ___ two pencils.',
    options: ['has', 'is', 'have', 'am'],
    explanation: 'We use "have" with plural pronoun "We": "We have two pencils."'
  },
  {
    num: 23,
    topicId: 'grammar',
    difficulty: 'medium',
    illustration: 'boy',
    question: 'Choose the plural of CHILD.',
    options: ['Childs', 'Children', 'Childes', 'Childrens'],
    explanation: 'The special plural of ONE child is MANY children.'
  },
  {
    num: 24,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'box',
    question: 'Choose the plural of BOX.',
    options: ['Boxs', 'Boxies', 'Boxes', 'Boxen'],
    explanation: 'Nouns ending in -x add "-es": one box, two boxes.'
  },
  {
    num: 25,
    topicId: 'grammar',
    difficulty: 'medium',
    illustration: 'boy',
    question: 'Choose the plural of FOOT.',
    options: ['Foots', 'Feet', 'Feets', 'Footes'],
    explanation: 'One foot, two feet! The plural of foot is feet.'
  },
  {
    num: 26,
    topicId: 'grammar',
    difficulty: 'medium',
    illustration: 'cat',
    question: 'Choose the singular of MICE.',
    options: ['Mouse', 'Mouses', 'Rat', 'Mices'],
    explanation: '"Mice" is plural. The singular form for just one is "Mouse".'
  },

  // 27-29: Pronouns (Grammar)
  {
    num: 27,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'girl',
    question: 'Choose the correct pronoun: Riya is singing. ___ is happy.',
    options: ['He', 'She', 'It', 'They'],
    explanation: 'Riya is a girl, so we use the pronoun "She".'
  },
  {
    num: 28,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'boy',
    question: 'Choose the correct pronoun: Rahul is running. ___ is fast.',
    options: ['She', 'It', 'He', 'We'],
    explanation: 'Rahul is a boy, so we use the pronoun "He".'
  },
  {
    num: 29,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'ball',
    question: 'Choose the correct pronoun: The ball is red. ___ is round.',
    options: ['He', 'She', 'They', 'It'],
    explanation: 'A ball is a thing, so we use the pronoun "It".'
  },

  // 30-31: Sentence structure (Sentence Formation)
  {
    num: 30,
    topicId: 'sentence-formation',
    difficulty: 'easy',
    illustration: 'book',
    question: 'Choose the correct sentence.',
    options: ['i like milk.', 'I like milk.', 'I like milk', 'i Like milk.'],
    explanation: 'A sentence starts with a capital "I" and ends with a full stop: "I like milk."'
  },
  {
    num: 31,
    topicId: 'sentence-formation',
    difficulty: 'medium',
    illustration: 'school',
    question: 'Choose the correct sentence.',
    options: ['She go to school.', 'She going to school.', 'She goes to school.', 'She gone to school.'],
    explanation: 'With singular third-person "She", we add "-es" to the verb: "She goes to school."'
  },

  // 32-33: Verbs (Grammar)
  {
    num: 32,
    topicId: 'grammar',
    difficulty: 'medium',
    illustration: 'bird',
    question: 'Choose the correct word: The birds ___ in the sky.',
    options: ['fly', 'flies', 'flying', 'flys'],
    explanation: 'Plural subject "The birds" takes base verb "fly": "The birds fly in the sky."'
  },
  {
    num: 33,
    topicId: 'grammar',
    difficulty: 'medium',
    illustration: 'house',
    question: 'Choose the correct word: My mother ___ tea every morning.',
    options: ['drink', 'drinks', 'drinking', 'drank'],
    explanation: 'Singular subject "My mother" takes "drinks": "My mother drinks tea every morning."'
  },

  // 34-36: Parts of speech (Grammar)
  {
    num: 34,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'school',
    question: 'Which word is a naming word (noun)?',
    options: ['Dance', 'Beautiful', 'Teacher', 'Slowly'],
    explanation: '"Teacher" is the name of a person, which makes it a naming word (noun).'
  },
  {
    num: 35,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'boy',
    question: 'Which word is an action word (verb)?',
    options: ['Chair', 'Jump', 'Blue', 'Happy'],
    explanation: '"Jump" describes an action, so it is an action word (verb).'
  },
  {
    num: 36,
    topicId: 'grammar',
    difficulty: 'medium',
    illustration: 'flower',
    question: 'Which word is a describing word (adjective)?',
    options: ['Pretty', 'Eat', 'Table', 'Under'],
    explanation: '"Pretty" describes how something looks, so it is a describing word (adjective).'
  },

  // 37-40: Prepositions & Articles (Grammar)
  {
    num: 37,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'umbrella',
    question: 'Choose the correct word: This is ___ umbrella.',
    options: ['a', 'an', 'are', 'am'],
    explanation: '"Umbrella" begins with a vowel sound (U), so we say "an umbrella".'
  },
  {
    num: 38,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'cat-table',
    question: 'Choose the correct word: The cat is ___ the table. (It is below it.)',
    options: ['on', 'under', 'above', 'beside'],
    explanation: 'Below the table means "under the table".'
  },
  {
    num: 39,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'house',
    question: 'Choose the correct word: The picture is ___ the wall.',
    options: ['in', 'under', 'on', 'between'],
    explanation: 'Pictures hang "on the wall".'
  },
  {
    num: 40,
    topicId: 'grammar',
    difficulty: 'easy',
    illustration: 'sun',
    question: 'Choose the correct word: I wake up ___ the morning.',
    options: ['in', 'on', 'at', 'by'],
    explanation: 'We say "in the morning", "in the afternoon", and "at night".'
  },

  // 41-42: Alphabetical order (Spelling)
  {
    num: 41,
    topicId: 'spelling',
    difficulty: 'medium',
    illustration: 'apple',
    question: 'Which word comes FIRST in a dictionary?',
    options: ['Ball', 'Apple', 'Cat', 'Dog'],
    explanation: '"Apple" starts with "A", which is the first letter of the alphabet.'
  },
  {
    num: 42,
    topicId: 'spelling',
    difficulty: 'medium',
    illustration: 'fish',
    question: 'Which word comes LAST in alphabetical order?',
    options: ['Fish', 'Frog', 'Fan', 'Fox'],
    explanation: 'Looking at second letters (a, i, o, r): Fan, Fish, Fox, Frog. So "Frog" comes last!'
  },

  // 43-45: Question marks & sentences (Sentence Formation)
  {
    num: 43,
    topicId: 'sentence-formation',
    difficulty: 'easy',
    illustration: 'question',
    question: 'Which is a question?',
    options: ['I am fine.', 'What is your name?', 'The sun is hot.', 'Please sit down.'],
    explanation: '"What is your name?" asks something, which makes it a question.'
  },
  {
    num: 44,
    topicId: 'sentence-formation',
    difficulty: 'easy',
    illustration: 'question',
    question: 'Which punctuation mark ends a question?',
    options: ['.', '!', '?', ','],
    explanation: 'Every question finishes with a question mark (?).'
  },
  {
    num: 45,
    topicId: 'sentence-formation',
    difficulty: 'easy',
    illustration: 'school',
    question: 'Choose the correct sentence.',
    options: ['Where is my bag?', 'Where is my bag.', 'where is my bag?', 'Where is my bag!'],
    explanation: 'Starts with capital "Where" and finishes with a question mark: "Where is my bag?"'
  },

  // 46-50: GK & Pairs (Vocabulary)
  {
    num: 46,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'bird',
    question: 'Complete: A bird lives in a ___.',
    options: ['kennel', 'nest', 'stable', 'den'],
    explanation: 'Birds build and live in a nest.'
  },
  {
    num: 47,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'school',
    question: 'Complete: A doctor works in a ___.',
    options: ['hospital', 'farm', 'bakery', 'post office'],
    explanation: 'Doctors care for unwell patients in a hospital.'
  },
  {
    num: 48,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'boy',
    question: 'Complete: We use our ears to ___.',
    options: ['see', 'smell', 'hear', 'taste'],
    explanation: 'Our ears are the sense organs for hearing sounds and music.'
  },
  {
    num: 49,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'boy',
    question: 'Complete: I brush my ___ every morning.',
    options: ['hands', 'teeth', 'eyes', 'ears'],
    explanation: 'We use a toothbrush and toothpaste to brush our teeth.'
  },
  {
    num: 50,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'sun',
    question: 'Which pair is correct?',
    options: ['Day - Moon', 'Night - Sun', 'Day - Sun', 'Night - Rainbow'],
    explanation: 'During the day, the bright sun shines in the sky.'
  },

  // 51-52: Word order (Sentence Formation)
  {
    num: 51,
    topicId: 'sentence-formation',
    difficulty: 'easy',
    illustration: 'school',
    question: 'Choose the correct order:',
    options: ['school / to / I / go', 'I go to school.', 'Go school I to.', 'To I school go.'],
    explanation: '"I go to school." is the only correct sentence order.'
  },
  {
    num: 52,
    topicId: 'sentence-formation',
    difficulty: 'easy',
    illustration: 'book',
    question: 'Choose the correct order:',
    options: ['Is my this book.', 'Book this is my.', 'This is my book.', 'My is book this.'],
    explanation: '"This is my book." makes complete, correct sense.'
  },

  // 53-55: Gender & Days (Vocabulary)
  {
    num: 53,
    topicId: 'vocabulary',
    difficulty: 'medium',
    illustration: 'crown',
    question: 'What is the female of KING?',
    options: ['Queen', 'Princess', 'Lady', 'Mother'],
    explanation: 'The female counterpart of a King is a Queen.'
  },
  {
    num: 54,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'family',
    question: 'What is the opposite gender of UNCLE?',
    options: ['Sister', 'Aunt', 'Mother', 'Niece'],
    explanation: 'The opposite gender of Uncle is Aunt.'
  },
  {
    num: 55,
    topicId: 'vocabulary',
    difficulty: 'easy',
    illustration: 'calendar',
    question: 'Choose the correct word: There are ___ days in a week.',
    options: ['five', 'six', 'seven', 'eight'],
    explanation: 'There are seven days in a week (Monday through Sunday).'
  },

  // 56-60: Reading Comprehension
  {
    num: 56,
    topicId: 'reading-comprehension',
    difficulty: 'easy',
    illustration: 'dog',
    passage: 'Mina has a small brown puppy named Coco. Coco likes to play with a red ball. Every evening, Mina takes Coco to the park. Coco drinks water after playing.',
    question: "What is the puppy's name?",
    options: ['Mina', 'Coco', 'Rani', 'Bobo'],
    explanation: 'The first sentence tells us: "a small brown puppy named Coco."'
  },
  {
    num: 57,
    topicId: 'reading-comprehension',
    difficulty: 'easy',
    illustration: 'dog',
    passage: 'Mina has a small brown puppy named Coco. Coco likes to play with a red ball. Every evening, Mina takes Coco to the park. Coco drinks water after playing.',
    question: 'What colour is Coco?',
    options: ['White', 'Black', 'Brown', 'Golden'],
    explanation: 'The story says: "a small brown puppy".'
  },
  {
    num: 58,
    topicId: 'reading-comprehension',
    difficulty: 'easy',
    illustration: 'dog',
    passage: 'Mina has a small brown puppy named Coco. Coco likes to play with a red ball. Every evening, Mina takes Coco to the park. Coco drinks water after playing.',
    question: 'What does Coco play with?',
    options: ['A kite', 'A doll', 'A red ball', 'A toy car'],
    explanation: 'Coco loves playing with "a red ball".'
  },
  {
    num: 59,
    topicId: 'reading-comprehension',
    difficulty: 'medium',
    illustration: 'park',
    passage: 'Mina has a small brown puppy named Coco. Coco likes to play with a red ball. Every evening, Mina takes Coco to the park. Coco drinks water after playing.',
    question: 'When does Mina take Coco to the park?',
    options: ['Every morning', 'Every evening', 'At midnight', 'At lunchtime'],
    explanation: 'The story says: "Every evening, Mina takes Coco to the park."'
  },
  {
    num: 60,
    topicId: 'reading-comprehension',
    difficulty: 'easy',
    illustration: 'dog',
    passage: 'Mina has a small brown puppy named Coco. Coco likes to play with a red ball. Every evening, Mina takes Coco to the park. Coco drinks water after playing.',
    question: 'What does Coco drink after playing?',
    options: ['Milk', 'Juice', 'Water', 'Soup'],
    explanation: 'The story finishes: "Coco drinks water after playing."'
  }
];

// Validate and format questions
const formattedQuestions = questions.map(q => {
  const correctLetter = officialAnswerKey[q.num];
  const correctIdx = charToIndex[correctLetter];

  return {
    id: `c1-eng-q${q.num.toString().padStart(2, '0')}`,
    classNumber: 1,
    subjectId: 'english',
    topicId: q.topicId,
    difficulty: q.difficulty,
    question: q.question,
    passage: q.passage,
    illustration: q.illustration,
    options: q.options,
    correctAnswer: correctIdx,
    explanation: q.explanation
  };
});

fs.writeFileSync(
  './src/data/questions/class1/english.json',
  JSON.stringify(formattedQuestions, null, 2)
);

console.log(`✅ Successfully imported and saved ${formattedQuestions.length} official questions to src/data/questions/class1/english.json`);
