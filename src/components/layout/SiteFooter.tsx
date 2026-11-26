import { Link } from 'react-router-dom';
export function SiteFooter() {
  return <footer className="border-t border-slate-200 bg-white px-5 pt-8 pb-28 sm:pb-10">
    <div className="max-w-6xl mx-auto"><p className="font-black mb-4">Little Learner</p>
      <nav aria-label="Information and policies" className="flex flex-wrap gap-x-6 gap-y-4 text-sm">
        {[['Learning tools','/learning-tools'],['Learning Guides','/blog'],['My Work','/my-work'],['About','/about'],['FAQ','/information/faq'],['Parent guide','/information/parent-guide'],['Contact','/contact'],['Privacy','/information/privacy'],['Terms','/information/terms'],['Disclaimer','/information/disclaimer']].map(([label,path])=><Link key={path} className="underline underline-offset-4" to={path}>{label}</Link>)}
      </nav><p className="mt-5 text-sm text-slate-500">Independent learning and drawing activities for children, parents, and teachers.</p>
    </div>
  </footer>;
}
