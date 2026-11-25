import { informationPages } from '../pages/InformationPage';
import { SUBJECTS, getAllSubjectQuestions, getTopics } from './questionRepository';
import { SubjectId } from '../types';

export const SITE_URL = 'https://www.jugnu.fun';
export const SITE_NAME = 'Little Learner';
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
  '/drawing-board',
  '/learning-tools',
  '/games',
  '/games/hanuman-runner',
  '/games/sliding-puzzle',
  '/explore/seed',
  '/about',
  '/contact',
  '/information/faq',
  '/information/parent-guide',
  '/information/privacy',
  '/information/terms',
  '/information/disclaimer',
] as const;

const staticPages: Record<string, { title: string; description: string; ogType?: 'website' | 'article' }> = {
  '/': {
    title: 'Class 1 Olympiad Practice, Tracing & Kids Games',
    description:
      'Free, child-safe CBSE Class 1 learning platform: English, Maths, Science & GK Olympiad practice, letter & word tracing, creative drawing board, and kids games with zero login.',
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
      'Solve 12 colourful sliding picture puzzles including Ganesha, Krishna, Shiva, and festive illustrations with picture hints and timer tracking.',
  },
  '/about': {
    title: 'About Little Learner',
    description:
      'Learn about Little Learner’s privacy-first design: zero data collection, instant browser access, client-side session memory, and children’s book artwork.',
  },
  '/contact': {
    title: 'Contact Little Learner',
    description:
      'Report a question correction, drawing board issue, or privacy concern to the Little Learner team.',
  },
  '/drawing-board': {
    title: 'Drawing Board & Tracing Worksheets for Kids',
    description:
      'Trace letters, numbers, words, shapes, and pictures, practice 6-row worksheets, color deities, or free-draw with 13 brushes and image tracing.',
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
};

const websiteNode = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: 'Jugnu',
  url: SITE_URL,
  inLanguage: 'en',
  description:
    'Free, ad-free CBSE Class 1 Olympiad practice, interactive tracing & drawing board, printable worksheets, and educational kids games.',
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
    pathname.startsWith('/exam/') || pathname === '/progress' || pathname === '/my-work';
  const robots = isNoIndex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1';

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

  const page = staticPages[pathname];
  if (page) {
    const jsonLd: Record<string, unknown>[] = [];
    if (pathname === '/') {
      jsonLd.push(websiteNode, organizationNode);
    } else {
      jsonLd.push(
        breadcrumb([
          { name: 'Home', path: '/' },
          { name: page.title, path: pathname },
        ]),
      );
      if (pathname === '/drawing-board' || pathname === '/learning-tools') {
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
    : 'Practice with Little Learner';
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

