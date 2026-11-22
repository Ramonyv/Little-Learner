import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { informationPages } from '../../pages/InformationPage';

const pages: Record<string, [string,string]> = {
  '/': ['Class 1 Practice, Tracing & Drawing', 'Practice Class 1 questions, trace letters, numbers and words, and explore creative drawing with Little Learner.'],
  '/games': ['Games for Kids', 'Explore picture puzzles for kids. Choose a game and slide the tiles to complete the picture.'],
  '/games/hanuman-runner': ['Hanuman Runner', 'Run, jump and fly through an endless adventure while collecting Ram Coins.'],
  '/games/sliding-puzzle': ['Sliding Picture Puzzle for Kids – 3×3, 4×4 & 5×5', 'Choose from 12 pictures, including Ganesha, Krishna, and Shiva. Shuffle the tiles, tap to slide, and use a picture hint when you need one.'],
  '/about': ['About Little Learner', 'Learn about Little Learner’s independent practice activities for young learners.'],
  '/contact': ['Contact Little Learner', 'Report an activity problem, suggest improvements, or raise a content concern.'],
  '/drawing-board': ['Drawing Board & Tracing Worksheets', 'Draw with textured brushes, trace letters and numbers, and practice with repeated worksheet guides.'],
  '/explore/seed': ['Help a Seed Grow', 'Explore seeds and plants through a guided learning activity.']
};
export function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const info = informationPages[pathname.split('/information/')[1]];
    const subject = pathname.startsWith('/topics/') ? pathname.split('/')[2] : '';
    const [title, description] = info ? [info.title,info.description] : pages[pathname] ??
      (subject ? [subject[0].toUpperCase()+subject.slice(1)+' Practice Topics','Choose a practice paper or topic for Class 1 learning.'] : ['Practice with Little Learner','Learning activities and practice for young children.']);
    document.title = title + ' | Little Learner';
    function meta(name: string, content: string) {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!element) { element = document.createElement('meta'); element.name=name; document.head.append(element); }
      element.content=content;
    }
    meta('description',description);
    meta('robots',pathname.startsWith('/exam/') || (pathname === '/progress' || pathname === '/my-work') ? 'noindex,follow' : 'index,follow');
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical); }
    canonical.href='https://littlelearner.netlify.app'+pathname;
  },[pathname]);
  return null;
}
