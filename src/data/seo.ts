import { informationPages } from '../pages/InformationPage';
import { SUBJECTS, getAllSubjectQuestions, getTopics } from './questionRepository';
import { getBlogPost } from './blogPosts';
import { SubjectId } from '../types';

export const SITE_URL = 'https://www.jugnu.fun';
export const SITE_NAME = 'Jugnu';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface RouteSeo {
  title: string;
  fullTitle: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: 'website' | 'article';
  jsonLd: Record<string, unknown>[];
}

export const INDEXABLE_ROUTES = [
  '/',
  '/topics/english',
  '/topics/mathematics',
  '/topics/science',
  '/topics/general-knowledge',
  '/topics/logical-reasoning',
  '/drawing-board',
  '/voxel-studio',
  '/tools/pixel-art',
  '/tools/draw-animate',
  '/learning-tools',
  '/games',
  '/games/hanuman-runner',
  '/games/sliding-puzzle',
  '/explore/seed',
  '/about',
  '/whats-new',
  '/contact',
  '/information/faq',
  '/information/parent-guide',
  '/information/privacy',
  '/information/terms',
  '/information/disclaimer',
  '/blog',
  '/blog/class-1-maths-olympiad-guide',
  '/blog/4-line-handwriting-method-kindergarten',
  '/blog/healthy-screen-time-early-learners',
] as const;

const staticPages: Record<string, { title: string; description: string; ogType?: 'website' | 'article' }> = {
  '/blog': {
    title: 'Learning Guides & Early Education Tips for Parents',
    description:
      'Practical, research-backed guides on Class 1 Olympiad prep, handwriting motor skills, early reading, and healthy screen time for kids.',
  },
  '/': {
    title: '3D Voxel Studio, Drawing, Tracing, Kids Games & Class 1 Practice',
    description:
      'Free, ad-free creative and learning studio for kids (Ages 4–8): 3D Voxel block builder, 13-brush drawing and handwriting tracing board, printable A4 worksheets, brain games, and Class 1 Olympiad practice with zero login.',
  },
  '/games': {
    title: 'Educational Games for Kids',
    description:
      'Play free, ad-free educational games for children including Sliding Picture Puzzle (3×3, 4×4, 5×5) and Hanuman Run obstacle adventure.',
  },
  '/games/hanuman-runner': {
    title: 'Hanuman Run — Kids Adventure Runner Game',
    description:
      'Play Hanuman Run on Jugnu: leap over obstacles, fly through clouds, collect Ram Coins, and enjoy Classic or 3D clay artwork with keyboard or touch controls.',
  },
  '/games/sliding-puzzle': {
    title: 'Sliding Picture Puzzle for Kids (3×3, 4×4 & 5×5)',
    description:
      'Solve 12 colourful sliding picture puzzles or upload your own photo to turn it into a playable 3×3, 4×4, or 5×5 puzzle with hints and timer tracking.',
  },
  '/about': {
    title: 'About Jugnu',
    description:
      'Learn about Jugnu’s privacy-first design: zero data collection, instant browser access, client-side session memory, and children’s book artwork.',
  },
  '/whats-new': {
    title: "What's New on Jugnu — Latest Features & Updates",
    description:
      'See the newest learning tools, 3D Voxel Studio updates, Olympiad question banks, and Drawing Board improvements on Jugnu.fun.',
  },
  '/contact': {
    title: 'Contact Jugnu',
    description:
      'Report a question correction, drawing board issue, or privacy concern to the Jugnu team.',
  },
  '/drawing-board': {
    title: 'Drawing Board & Tracing Worksheets for Kids',
    description:
      'Trace letters, numbers, words, shapes, and pictures, practice 6-row worksheets, color deities, or free-draw with 13 brushes and image tracing.',
  },
  '/voxel-studio': {
    title: 'Voxel Studio — 3D Block Builder for Kids',
    description:
      'Build 3D houses, castles, trees, animals, cars, and robots with rounded candy blocks in Jugnu Voxel Studio. Free, ad-free, and works right in your browser.',
  },
  '/tools/pixel-art': {
    title: 'Pixel Art Studio — Kids Pixel Drawing & Templates',
    description:
      'Make tiny pictures, one square at a time! Free, ad-free pixel art editor for kids ages 4–12 with Trace mode, Paint-by-Number, Magic Mirror, and 3D export.',
  },
  '/tools/draw-animate': {
    title: 'Draw & Animate — Kids Drawing & Animation Studio',
    description:
      'Draw it. Tap it. Watch it move! Kids draw anything with crayons and bring it to life on an animated 3D stage with Wiggle, Bounce, Walk, Fly, Swim, and Dance.',
  },
  '/learning-tools': {
    title: 'Printable Tracing Pack & Mistake Revision Tools',
    description:
      'Create custom A4 printable tracing sheets for names, letters, words, and numbers, or retry missed Olympiad practice questions.',
  },
  '/explore/seed': {
    title: 'Help a Seed Grow — Interactive Nature Activity',
    description:
      'Trace a seed, explore roots and leaves, and learn how plants grow through a short guided interactive activity for young children.',
  },
  '/progress': {
    title: 'My Session Progress',
    description: 'View completed Olympiad practice sets, accuracy, and question totals from your current browser session.',
  },
  '/my-work': {
    title: 'My Saved Drawings & Practice Backups',
    description: 'Review saved browser drawings, coloring sheets, and export or restore JSON backups locally.',
  },
  '/insights': {
    title: 'Jugnu Insights',
    description: 'Private aggregate product analytics dashboard for Jugnu owners.',
  },
};

const websiteNode = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: 'Jugnu',
  url: SITE_URL,
  inLanguage: 'en',
  description:
    'Free, ad-free creative and learning studio for kids (Ages 4–8): 3D Voxel Studio, interactive drawing & handwriting tracing board, printable A4 worksheets, brain games, and Class 1 Olympiad practice.',
};

const organizationNode = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/Favicon/favicon/yellow/32.svg`,
  email: 'ramandesigns9@gmail.com',
  sameAs: ['https://ramanyv.work'],
};

function breadcrumb(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function getRouteSeo(rawPathname: string): RouteSeo {
  const pathname = rawPathname === '/' ? '/' : rawPathname.replace(/\/+$/, '');
  const canonical = `${SITE_URL}${pathname}`;
  const isNoIndex =
    pathname.startsWith('/exam/') ||
    pathname === '/progress' ||
    pathname === '/my-work' ||
    pathname === '/insights';
  const robots =
    pathname === '/insights'
      ? 'noindex,nofollow'
      : isNoIndex
        ? 'noindex,follow'
        : 'index,follow,max-image-preview:large,max-snippet:-1';

  const infoSlug = pathname.startsWith('/information/') ? pathname.split('/information/')[1] : '';
  const info = infoSlug ? informationPages[infoSlug] : undefined;

  if (info) {
    const jsonLd: Record<string, unknown>[] = [
      breadcrumb([
        { name: 'Home', path: '/' },
        { name: info.title, path: pathname },
      ]),
    ];
    if (infoSlug === 'faq') {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: info.sections.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })),
      });
    } else {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: info.title,
        description: info.description,
        url: canonical,
      });
    }
    return {
      title: info.title,
      fullTitle: `${info.title} | ${SITE_NAME}`,
      description: info.description,
      canonical,
      robots,
      ogType: 'article',
      jsonLd,
    };
  }

  if (pathname.startsWith('/topics/')) {
    const subjectId = pathname.split('/')[2] as SubjectId;
    const subject = SUBJECTS.find((s) => s.id === subjectId);
    const subjectTitle = subject?.title ?? (subjectId ? subjectId[0].toUpperCase() + subjectId.slice(1) : 'Practice');
    const questionCount = subject ? getAllSubjectQuestions(1, subject.id).length : 0;
    const topics = subject ? getTopics(subject.id) : [];
    const title = `${subjectTitle} Olympiad Practice Topics (Class 1)`;
    const description = subject
      ? `${subject.shortDesc} Practice ${questionCount} interactive Class 1 ${subjectTitle} questions across ${topics.length} topics and papers.`
      : 'Choose a practice paper or topic for Class 1 Olympiad learning.';
    return {
      title,
      fullTitle: `${title} | ${SITE_NAME}`,
      description,
      canonical,
      robots,
      ogType: 'website',
      jsonLd: [
        breadcrumb([
          { name: 'Home', path: '/' },
          { name: `${subjectTitle} Practice`, path: pathname },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: title,
          description,
          url: canonical,
          educationalLevel: 'Class 1 (Ages 5-7)',
          learningResourceType: 'Practice Quiz',
          isAccessibleForFree: true,
          inLanguage: 'en',
          provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        },
      ],
    };
  }

  if (pathname.startsWith('/blog/')) {
    const slug = pathname.replace('/blog/', '');
    const post = getBlogPost(slug);
    if (post) {
      const canonical = `${SITE_URL}/blog/${slug}`;
      const jsonLd: Record<string, unknown>[] = [
        breadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Learning Guides', path: '/blog' },
          { name: post.title, path: `/blog/${slug}` },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
          url: canonical,
          datePublished: post.publishedDate,
          dateModified: post.updatedDate,
          author: {
            '@type': 'Organization',
            name: 'Jugnu',
            url: SITE_URL,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Jugnu',
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_URL}/Logo/Jugnu%20Logo%20V1.svg`,
            },
          },
          image: OG_IMAGE,
          mainEntityOfPage: canonical,
        },
      ];
      return {
        title: post.title,
        fullTitle: `${post.title} | ${SITE_NAME}`,
        description: post.excerpt,
        canonical,
        robots: 'index,follow,max-image-preview:large,max-snippet:-1',
        ogType: 'article',
        jsonLd,
      };
    }
  }

  const page = staticPages[pathname];
  if (page) {
    const jsonLd: Record<string, unknown>[] = [];
    if (pathname === '/') {
      jsonLd.push(
        websiteNode,
        organizationNode,
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is Jugnu completely free? Are there any in-app ads or subscriptions?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, Jugnu is 100% free forever. There are zero subscriptions, zero microtransactions, and strictly no advertisements, banner popups, or sponsored links. We believe early childhood learning should be peaceful, safe, and universally accessible.',
              },
            },
            {
              '@type': 'Question',
              name: 'What grade levels and curriculum does Jugnu cover?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Jugnu is tailored for children ages 4 to 8 (Nursery, LKG, UKG, and CBSE/ICSE Class 1). Content spans Mathematics, English Phonics & Grammar, General Science (EVS), and Logical Reasoning aligned with International Olympiad exams (IMO, IEO, NSO).',
              },
            },
            {
              '@type': 'Question',
              name: 'Do children need an account or login to play?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No account, email, or sign-up is required. Children can jump straight into drawing, games, or quiz practice with one click. We do not track, collect, or store any personal information or child identity.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can kids use the Drawing Board for handwriting and pencil grip?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! The Drawing Board includes specialized ruled guidelines: 4-line English handwriting grids, 2-line Hindi guidelines, and math squares. With 13 creative brushes and stroke stabilization, kids develop line control and motor confidence before or alongside pencil and paper.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I use Jugnu on iPad, tablets, or touchscreen laptops?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Absolutely. Jugnu is designed touch-first with responsive touch controls, stylus/Apple Pencil support, and instant browser access without needing to download anything from the App Store or Play Store.',
              },
            },
          ],
        },
      );
    } else {
      jsonLd.push(
        breadcrumb([
          { name: 'Home', path: '/' },
          { name: page.title, path: pathname },
        ]),
      );
      if (pathname === '/drawing-board' || pathname === '/learning-tools' || pathname === '/voxel-studio' || pathname === '/tools/pixel-art' || pathname === '/tools/draw-animate') {
        jsonLd.push({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: page.title,
          description: page.description,
          url: canonical,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          browserRequirements: 'Requires HTML5 and Canvas support',
          isAccessibleForFree: true,
          audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
        });
      } else if (pathname === '/games/hanuman-runner' || pathname === '/games/sliding-puzzle') {
        jsonLd.push({
          '@context': 'https://schema.org',
          '@type': 'VideoGame',
          name: page.title,
          description: page.description,
          url: canonical,
          genre: ['Educational', 'Kids'],
          gamePlatform: 'Web Browser',
          applicationCategory: 'Game',
          isAccessibleForFree: true,
        });
      } else if (pathname === '/explore/seed') {
        jsonLd.push({
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: page.title,
          description: page.description,
          url: canonical,
          educationalLevel: 'Class 1 (Ages 5-7)',
          isAccessibleForFree: true,
        });
      }
    }
    return {
      title: page.title,
      fullTitle: `${page.title} | ${SITE_NAME}`,
      description: page.description,
      canonical,
      robots,
      ogType: page.ogType ?? 'website',
      jsonLd,
    };
  }

  const fallbackTitle = pathname.startsWith('/intro/')
    ? 'Practice Activity Setup'
    : 'Practice with Jugnu';
  const fallbackDesc =
    'Interactive Class 1 Olympiad practice, tracing worksheets, drawing tools, and educational games for young learners.';
  return {
    title: fallbackTitle,
    fullTitle: `${fallbackTitle} | ${SITE_NAME}`,
    description: fallbackDesc,
    canonical,
    robots,
    ogType: 'website',
    jsonLd: [],
  };
}

