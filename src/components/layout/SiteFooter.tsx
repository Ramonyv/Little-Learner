import { Link } from 'react-router-dom';
import { FlyingBird } from '../common/FlyingBird';

export function SiteFooter() {

  return (
    <footer className="bg-[#e8f3fe] pt-10 pb-20 sm:pb-0 overflow-hidden relative">
      {/* Top Branding & Navigation */}
      <div className="max-w-6xl mx-auto px-5 text-center relative z-20">
        <Link to="/" className="inline-block mb-4 transition-transform hover:scale-105 active:scale-95">
          <img
            src="/home/jugnu-logo-footer.webp"
            alt="Jugnu.fun"
            className="h-10 sm:h-12 w-auto mx-auto object-contain"
          />
        </Link>

        <nav aria-label="Information and policies" className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-bold text-slate-600 mb-4">
          {[
            ['Learning tools', '/learning-tools'],
            ['Learning Guides', '/blog'],
            ["What's New", '/whats-new'],
            ['Design System', '/design-system'],
            ['My Work', '/my-work'],
            ['About', '/about'],
            ['FAQ', '/information/faq'],
            ['Parent guide', '/information/parent-guide'],
            ['Contact', '/contact'],
            ['Privacy', '/information/privacy'],
            ['Terms', '/information/terms'],
            ['Disclaimer', '/information/disclaimer'],
          ].map(([label, path]) => (
            <Link
              key={path}
              className="hover:text-brand-blue hover:underline underline-offset-4 transition-colors"
              to={path}
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto">
          Independent learning and drawing activities for children, parents, and teachers.
        </p>
      </div>

      {/* Floating Smiling Sun */}
      <div className="flex justify-center mt-6 mb-1 relative z-20 pointer-events-none">
        <img
          src="/home/sun.webp"
          alt="Happy smiling sun"
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain animate-sun select-none drop-shadow-sm"
        />
      </div>

      {/* Parallax Landscape Stage */}
      <div className="relative w-full h-[210px] sm:h-[280px] md:h-[330px] lg:h-[360px] overflow-hidden pointer-events-none select-none">
        
        {/* Layer 1: Background Lush Forest Trees (Seamless repeat-x parallax scrolling left-to-right) */}
        <div
          className="absolute bottom-0 parallax-trees-layer z-0"
          aria-hidden="true"
        />

        {/* Layer 2: The 3 Kids (Jai, Daksha, Aayush) anchored at bottom-0 behind the rolling hills so their upper bodies peek over the hill crest */}
        <div className="absolute left-[6%] sm:left-[10%] lg:left-[14%] bottom-0 z-10 flex items-end">
          {/* Jai (tallest boy in black hoodie) */}
          <img
            src="/home/kid-jai.webp"
            alt="Jai"
            className="h-[122px] sm:h-[168px] md:h-[202px] lg:h-[226px] w-auto object-contain filter drop-shadow-md"
          />
          {/* Daksha (little boy with glasses pointing up) */}
          <img
            src="/home/kid-daksha.webp"
            alt="Daksha"
            className="h-[92px] sm:h-[126px] md:h-[152px] lg:h-[170px] w-auto object-contain filter drop-shadow-md -ml-2 sm:-ml-3"
          />
          {/* Aayush (boy in yellow tank top) */}
          <img
            src="/home/kid-aayush.webp"
            alt="Aayush"
            className="h-[104px] sm:h-[142px] md:h-[172px] lg:h-[192px] w-auto object-contain filter drop-shadow-md -ml-1 sm:-ml-2"
          />
        </div>

        {/* Layer 3: Flying Blue Bird (6-frame turnaround sprite flying in open sky) */}
        <FlyingBird
          className="absolute left-[22%] sm:left-[26%] top-[18%] sm:top-[22%] z-20"
          sizeClass="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16"
        />

        {/* Layer 4: Foreground Rolling Hills (Seamless repeat-x parallax in front of the kids) */}
        <div
          className="absolute bottom-0 parallax-hills-layer z-20"
          aria-hidden="true"
        />

      </div>
    </footer>
  );
}
