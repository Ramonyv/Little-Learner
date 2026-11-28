export interface BlogPostSection {
  heading: string;
  paragraphs: string[];
  tips?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: 'Olympiad Prep' | 'Handwriting & Motor Skills' | 'Parenting & Learning' | 'Maths & Logic' | 'Our Story';
  categoryColor: string;
  icon: string;
  publishedDate: string;
  updatedDate: string;
  readTime: string;
  author: string;
  keyTakeaways: string[];
  sections: BlogPostSection[];
  relatedActivity: {
    title: string;
    description: string;
    path: string;
    cta: string;
  };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'it-started-with-an-olympiad-tomorrow',
    title: 'It Started with an Olympiad Tomorrow',
    excerpt:
      'How an unexpected evening helping our son prepare for his Olympiad exams sparked the idea for Jugnu — an ad-free, joyful learning and creative world for every child.',
    category: 'Our Story',
    categoryColor: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: '✨',
    publishedDate: 'November 27, 2026',
    updatedDate: 'November 27, 2026',
    readTime: '2 min read',
    author: 'Raman (Founder & Dad, Jugnu)',
    keyTakeaways: [
      'Built by a father for his son’s Olympiad prep, and now shared with every little learner.',
      'Replacing endless scrolling with curiosity, creative tools, and meaningful discovery.',
      'Completely free, no ads, no login, and zero tracking — just learning, creativity, and magic.',
    ],
    sections: [
      {
        heading: 'The Night Before the Olympiad',
        paragraphs: [
          'One evening, my wife and I were both busy with work. Our son had his Science and English Olympiads the next day, and we needed to help him prepare.',
          "I knew handing him a stack of question papers wouldn't excite him. Printing a hundred questions wasn't particularly convenient either.",
          'So I opened ChatGPT and asked it to create a practice question set with answers.',
        ],
      },
      {
        heading: 'A Little Idea Struck Me',
        paragraphs: [
          "That's when a little idea struck me.",
          'What if I could build a small app where he could tap answers, get hints and practise questions in a fun, interactive way?',
          'So I built one. Just for him.',
        ],
      },
      {
        heading: 'From One Child to Something Much Bigger',
        paragraphs: [
          'But as I kept building, I realised this could become something much bigger. Something that could help other children and parents facing the same everyday challenges.',
          "Screens aren't going away from our children's lives. Instead of fighting screen time altogether, why not make it more meaningful?",
          'Why not replace endless scrolling with a little more curiosity, creativity and learning?',
          'And why should parents need a hundred different apps when children could learn, play, draw, practise and discover in one happy little place?',
        ],
      },
      {
        heading: 'How Jugnu Was Born',
        paragraphs: [
          "That's how Jugnu was born.",
          'An independent project built by a father, for his child, and now shared with every little learner.',
          '**Completely free. No ads. No login. Just learning, creativity and a little bit of magic.**',
        ],
      },
    ],
    relatedActivity: {
      title: 'Practice Class 1 Olympiads on Jugnu',
      description: 'Explore interactive Science, Math, and English Olympiad questions with hints, cheerful audio, and zero stress.',
      path: '/exam',
      cta: 'Try Olympiad Practice',
    },
  },
  {
    slug: 'class-1-maths-olympiad-guide',
    title: 'How to Prepare for Class 1 Maths Olympiad (IMO): A Stress-Free Parent Guide',
    excerpt:
      'Practical, playful ways to introduce your 5 to 7 year old to Class 1 International Mathematics Olympiad (IMO) concepts without stress, cramming, or rote memorization.',
    category: 'Olympiad Prep',
    categoryColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '🏆',
    publishedDate: 'November 15, 2026',
    updatedDate: 'November 26, 2026',
    readTime: '4 min read',
    author: 'Jugnu Learning Team',
    keyTakeaways: [
      'Focus on visual number sense and spatial patterns rather than high-speed calculation.',
      'Keep practice sessions short: 10 to 15 minutes of playful problem-solving is far more effective than long drills.',
      'Encourage children to explain their thought process out loud rather than rushing to an answer.',
    ],
    sections: [
      {
        heading: 'What Does Class 1 Maths Olympiad Actually Test?',
        paragraphs: [
          'Many parents worry that competitive exams like the SOF International Mathematics Olympiad (IMO) require advanced math skills. In reality, Class 1 Olympiads test basic conceptual clarity and logical thinking rather than advanced arithmetic.',
          'Instead of asking a child to quickly solve 8 + 7, an Olympiad question might show groups of apples, simple repeating shape sequences, or visual clocks. The goal is to see whether a child understands the underlying concept rather than mechanical calculation.',
        ],
      },
      {
        heading: 'The 4 Core Topics to Master',
        paragraphs: [
          'For Class 1 students, questions generally fall into four predictable pillars:',
        ],
        tips: [
          'Numbers & Place Value: Counting up to 100, number names, forward and backward counting, comparing numbers (<, >, =), and skip counting by 2s, 5s, and 10s.',
          'Basic Addition & Subtraction: Visual word problems, number line jumping, and simple single-digit addition and subtraction within 20.',
          'Shapes & Spatial Sense: Identifying 2D shapes (circles, squares, rectangles, triangles) and 3D shapes (spheres, cubes, cylinders), understanding straight vs. curved lines.',
          'Logical Reasoning: Pattern completion (shapes, numbers, colors), odd-one-out categorization, and spatial relationships (inside/outside, above/below, heavier/lighter).',
        ],
      },
      {
        heading: 'Daily 10-Minute Playful Routines',
        paragraphs: [
          'Consistency always beats cramming for 5 and 6 year olds. A simple 10-minute session every day builds confidence and curiosity without triggering math anxiety.',
          'Turn everyday moments into math challenges: count stairs while walking, compare grocery item weights, or ask which spoon is the longest on the dinner table.',
        ],
        tips: [
          'Celebrate the attempt, not just the correct answer.',
          'If a child gets stuck, use real physical objects (like blocks or coins) to demonstrate the question visually.',
          'Take zero-pressure practice quizzes where timer countdowns can be disabled.',
        ],
      },
    ],
    relatedActivity: {
      title: 'Practice Class 1 Mathematics on Jugnu',
      description: 'Explore interactive, multiple-choice questions on Numbers, Shapes, and Patterns with cheerful audio feedback.',
      path: '/topics/mathematics',
      cta: 'Start Math Practice',
    },
  },
  {
    slug: '4-line-handwriting-method-kindergarten',
    title: 'The 4-Line Handwriting Method: Helping Kindergarteners Master Letter Placement',
    excerpt:
      'Why four-line English ruled notebooks are the gold standard for teaching handwriting, pencil grip, and letter proportions to early learners.',
    category: 'Handwriting & Motor Skills',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: '✏️',
    publishedDate: 'November 18, 2026',
    updatedDate: 'November 26, 2026',
    readTime: '3 min read',
    author: 'Jugnu Learning Team',
    keyTakeaways: [
      'Four-line grids teach children the concept of "ascenders" and "descenders" through intuitive visual boundaries.',
      'Finger and hand motor strength develops best through tracing curves, zig-zags, and loops before tackling complex letters.',
      'Digital tracing boards give children an undo-friendly sandbox to gain confidence before writing on paper.',
    ],
    sections: [
      {
        heading: 'Understanding the Four Lines',
        paragraphs: [
          'When children first transition from blank drawing paper to ruled notebooks, they often feel overwhelmed. The traditional English four-line notebook provides four essential guidelines that give every letter a clear home:',
        ],
        tips: [
          'Top Red Line (Sky Line): Tall uppercase letters (like A, B, D) and tall lowercase ascenders (like b, d, h, l, t) touch this top boundary.',
          'Middle Blue Line (Plane Line): The baseline for small lowercase letters like a, c, e, m, n, o, r, s, u, v, w, x, z.',
          'Bottom Blue Line (Grass Line): Where almost every letter sits. This prevents handwriting from floating or sinking.',
          'Bottom Red Line (Worm Line): The basement reserved exclusively for descending lowercase tails: g, j, p, q, y.',
        ],
      },
      {
        heading: 'Step-by-Step Motor Skill Progression',
        paragraphs: [
          'Before forcing a young child to write entire words, break handwriting practice into three gentle milestones:',
          '1. Pre-writing strokes: Tracing standing lines, sleeping lines, slanting lines, and gentle waves.',
          '2. Uppercase letters first: Capital letters are composed mostly of straight lines and simple curves (L, T, I, E, F) which are easier for developing fingers.',
          '3. Lowercase letter families: Group letters by movement family (e.g., the "magic c" family: c, a, d, g, o, q) rather than alphabetical order.',
        ],
      },
      {
        heading: 'Bridging Digital Tracing with Paper Practice',
        paragraphs: [
          'Digital tracing on a touch screen or tablet allows children to practice line strokes without the frustration of tearing paper or messy erasers. Once muscle memory is established, translating those stroke patterns to pencil and physical notebooks becomes effortless.',
        ],
      },
    ],
    relatedActivity: {
      title: 'Freehand 4-Line Tracing Board',
      description: 'Practice handwriting on realistic 4-line English guidelines, 2-line Hindi grids, and math squares with 13 drawing brushes.',
      path: '/drawing-board',
      cta: 'Open Drawing Board',
    },
  },
  {
    slug: 'healthy-screen-time-early-learners',
    title: 'Healthy Screen Time for Early Learners: Passive Watching vs. Active Discovery',
    excerpt:
      'How parents can replace passive video autoplay with active, interactive digital play that fosters problem-solving, creativity, and calm focus.',
    category: 'Parenting & Learning',
    categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: '💡',
    publishedDate: 'November 22, 2026',
    updatedDate: 'November 26, 2026',
    readTime: '4 min read',
    author: 'Jugnu Learning Team',
    keyTakeaways: [
      'Not all screen time is equal: passive video watching triggers dopamine loops, whereas interactive educational games engage active problem-solving.',
      'Look for platforms that eliminate ads, algorithmic recommendations, and infinite feeds.',
      'Co-playing and asking questions about a game turns screen time into a conversational bonding activity.',
    ],
    sections: [
      {
        heading: 'Passive vs. Active Screen Time',
        paragraphs: [
          'When modern parents hear "screen time," they often picture a child hypnotized by brightly flashing short videos or endless cartoons. That is passive screen time — the child is a spectator receiving sensory stimulation with zero cognitive agency.',
          'Active screen time is fundamentally different. When a child drags puzzle pieces to reconstruct an image, selects the next number in a pattern, or chooses colors to paint an elephant, their brain is actively hypothesizing, testing choices, and experiencing natural cause-and-effect.',
        ],
      },
      {
        heading: 'What Makes a Digital Tool Healthy for Kids?',
        paragraphs: [
          'When evaluating apps and websites for your children, look for these three safety pillars:',
        ],
        tips: [
          'Strictly Zero Advertisements: Banners and video popups disrupt attention spans and accidentally direct children to unverified external links.',
          'Natural Stopping Points: Games should have clear round completions (e.g. 10 questions or finishing a puzzle) rather than endless, addictive gameplay loops.',
          'No Behavioral Tracking: Children should never be subjected to session recordings, user profiling, or high-pressure countdown timers.',
        ],
      },
      {
        heading: 'Simple Co-Learning Habits for Parents',
        paragraphs: [
          'You do not have to hover over your child continuously, but showing genuine interest in their digital creations makes a huge difference. Ask open-ended questions like: "Why did you choose that color?", "How did you figure out which puzzle tile went there?", or "Can you read that word to me?"',
          'By treating digital learning as an interactive workbook rather than a digital pacifier, children learn to use technology as a tool for creation and discovery.',
        ],
      },
    ],
    relatedActivity: {
      title: 'Explore Ad-Free Games on Jugnu',
      description: 'Engage in spatial thinking and memory with our sliding puzzle and obstacle adventures — 100% ad-free and tracker-free.',
      path: '/games',
      cta: 'Explore Kids Games',
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
