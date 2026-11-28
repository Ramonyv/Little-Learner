import { Link, useParams, Navigate } from 'react-router-dom';
import { getBlogPost } from '../data/blogPosts';

function renderFormattedParagraph(text: string) {
  if (!text.includes('**')) return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-extrabold text-brand-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Article Container */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs sm:text-sm font-semibold text-slate-500 flex items-center gap-2">
          <Link to="/" className="hover:text-brand-blue">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-brand-blue">Learning Guides</Link>
          <span>/</span>
          <span className="text-slate-700 truncate max-w-[200px] sm:max-w-[320px]">{post.category}</span>
        </nav>

        {/* Header Meta */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${post.categoryColor}`}>
              {post.category}
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
              {post.readTime}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Published on {post.publishedDate}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-4xl font-black text-brand-ink leading-tight sm:leading-snug mb-4">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            {post.excerpt}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>By <strong className="text-slate-700">{post.author}</strong></span>
            <span>Updated: {post.updatedDate}</span>
          </div>
        </header>

        {/* Key Takeaways Callout Box */}
        {post.keyTakeaways.length > 0 && (
          <aside className="mb-10 bg-amber-50/80 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl" aria-hidden="true">💡</span>
              <h2 className="text-base sm:text-lg font-black text-amber-950">
                Key Takeaways for Parents
              </h2>
            </div>
            <ul className="space-y-2 text-sm sm:text-base text-amber-900 leading-relaxed">
              {post.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-amber-600 font-bold mt-1 text-sm">&bull;</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Article Body Sections */}
        <div className="space-y-10 text-slate-700 text-base sm:text-lg leading-relaxed">
          {post.sections.map((sec, sIdx) => (
            <section key={sIdx} className="space-y-4">
              {sec.heading && (
                <h2 className="text-xl sm:text-2xl font-black text-brand-ink pt-2">
                  {sec.heading}
                </h2>
              )}
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-slate-700 leading-relaxed font-normal">
                  {renderFormattedParagraph(p)}
                </p>
              ))}
              {sec.tips && sec.tips.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 my-4 space-y-2.5">
                  {sec.tips.map((tip, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2.5 text-sm sm:text-base">
                      <span className="text-brand-blue font-bold mt-0.5" aria-hidden="true">✔</span>
                      <span className="text-slate-800">{renderFormattedParagraph(tip)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Bottom Interactive Feature Callout */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Interactive Activity
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {post.relatedActivity.title}
            </h3>
            <p className="text-blue-100 text-sm max-w-md">
              {post.relatedActivity.description}
            </p>
          </div>
          <Link
            to={post.relatedActivity.path}
            className="shrink-0 px-6 py-3 rounded-full bg-brand-yellow text-brand-ink font-black text-sm sm:text-base hover:bg-yellow-300 transition-all shadow-md active:scale-95"
          >
            {post.relatedActivity.cta} &rarr;
          </Link>
        </div>

        {/* Back Link */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:underline"
          >
            &larr; Back to all learning guides
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Home
          </Link>
        </div>
      </article>
    </div>
  );
}

export default BlogPostPage;
