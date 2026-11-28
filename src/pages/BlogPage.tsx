import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BLOG_POSTS, BlogPost } from '../data/blogPosts';

export function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Our Story', 'Olympiad Prep', 'Handwriting & Motor Skills', 'Parenting & Learning'];

  const filteredPosts =
    selectedCategory === 'All'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-blue-50/70 to-transparent pt-8 sm:pt-12 pb-6 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs sm:text-sm font-extrabold mb-4">
            <span>📖</span>
            <span>Parent & Educator Resources</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-ink tracking-tight mb-3">
            Jugnu Learning Guides
          </h1>
          <p className="text-slate-600 text-base sm:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Simple, practical, and research-backed learning strategies to help your early learner thrive in math, reading, handwriting, and creative thinking.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm ${
                    active
                      ? 'bg-brand-blue text-white shadow-brand-blue/20 scale-105'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post: BlogPost) => (
            <article
              key={post.slug}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col p-6 hover:-translate-y-1 group"
            >
              {/* Card Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${post.categoryColor}`}
                >
                  {post.category}
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  {post.readTime}
                </span>
              </div>

              {/* Icon & Title */}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  {post.icon}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-brand-ink group-hover:text-brand-blue transition-colors leading-snug line-clamp-2">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
              </div>

              {/* Excerpt */}
              <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                {post.excerpt}
              </p>

              {/* Footer Meta */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>{post.publishedDate}</span>
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 font-bold text-brand-blue group-hover:underline text-sm"
                >
                  Read guide <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default BlogPage;
