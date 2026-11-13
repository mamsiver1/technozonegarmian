import { Plus, Search, X } from 'lucide-react';
import { CATEGORIES, PostCategory, PostRecord } from '../types/post';
import { PostCard } from './PostCard';

interface PostFeedProps {
  posts: PostRecord[];
  loading: boolean;
  error: string | null;
  activeCategory: PostCategory | 'all';
  onSelectCategory: (cat: PostCategory | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isOwner: boolean;
  showDraftsOnly: boolean;
  onOpenNewPost: () => void;
  onOpenPost: (post: PostRecord) => void;
  onEditPost: (post: PostRecord) => void;
  onDeletePost: (post: PostRecord) => void;
  onToggleFeature: (post: PostRecord) => void;
}

export function PostFeed({
  posts,
  loading,
  error,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  isOwner,
  showDraftsOnly,
  onOpenNewPost,
  onOpenPost,
  onEditPost,
  onDeletePost,
  onToggleFeature,
}: PostFeedProps) {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    if (showDraftsOnly && post.status !== 'draft') return false;
    if (activeCategory !== 'all' && post.category !== activeCategory) return false;
    if (!normalizedSearch) return true;

    const haystacks = [
      post.title,
      post.summary || '',
      post.content,
      post.fileMeta || '',
      ...(post.tags || []),
    ]
      .join(' ')
      .toLowerCase();

    return haystacks.includes(normalizedSearch);
  });

  // Sort: featured first when viewing "all" without search, otherwise newest first
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (activeCategory === 'all' && !normalizedSearch && !showDraftsOnly) {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
    }
    const aTime =
      a.createdAt && typeof a.createdAt.toMillis === 'function'
        ? a.createdAt.toMillis()
        : Date.now();
    const bTime =
      b.createdAt && typeof b.createdAt.toMillis === 'function'
        ? b.createdAt.toMillis()
        : Date.now();
    return bTime - aTime;
  });

  const leadPost =
    sortedPosts.length > 0 && activeCategory === 'all' && !normalizedSearch && !showDraftsOnly
      ? sortedPosts[0]
      : null;
  const remainingPosts = leadPost ? sortedPosts.slice(1) : sortedPosts;

  return (
    <section id="feed" className="mx-auto max-w-7xl px-4 pt-4 pb-10 sm:px-6 lg:px-8">
      {/* Toolbar: Category Filter Tabs + Search */}
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="فلتەری جۆری پۆستەکان"
          className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800/80 bg-[#0B111E]/90 p-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            onClick={() => onSelectCategory('all')}
            className={`min-h-[38px] whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              activeCategory === 'all'
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            هەموو ({posts.filter((p) => (showDraftsOnly ? p.status === 'draft' : true)).length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = posts.filter(
              (p) => p.category === cat.id && (showDraftsOnly ? p.status === 'draft' : true)
            ).length;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCategory(cat.id)}
                className={`min-h-[38px] whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                {cat.labelKu} <span className="tabular-nums opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="گەڕان لە پۆستەکان..."
            aria-label="گەڕان لە پۆستەکان"
            className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-[#0B111E]/90 py-2 pr-10 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="سڕینەوەی گەڕان"
              className="absolute top-1/2 left-2.5 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-80 animate-pulse rounded-2xl border border-slate-800/80 bg-[#0B111E]/60"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mt-8 rounded-2xl border border-rose-500/40 bg-rose-950/25 p-6 text-center text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedPosts.length === 0 && (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-[#0B111E]/75 px-6 py-16 text-center">
          <h3 className="text-xl font-bold text-white">
            {searchQuery || activeCategory !== 'all' || showDraftsOnly
              ? 'هیچ پۆستێک بەم فلتەرە نەدۆزرایەوە'
              : 'هێشتا هیچ پۆستێک بڵاونەکراوەتەوە'}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
            {isOwner
              ? 'تۆ وەک خاوەنی سایت دەتوانیت یەکەم پۆست (هەواڵ، فێرکاری، وێنە، بەرنامە یان وتار) لێرەوە بڵاوبکەیتەوە.'
              : 'پۆستە نوێیەکان بەم زووانە لەلایەن بەڕێوەبەری زۆنی تەکنەلۆژیای گەرمیان بڵاودەکرێنەوە.'}
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={onOpenNewPost}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              <span>دروستکردنی پۆستی نوێ</span>
            </button>
          )}
        </div>
      )}

      {/* Posts Grid */}
      {!loading && !error && sortedPosts.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leadPost && (
            <PostCard
              post={leadPost}
              isFeaturedLayout={true}
              isOwner={isOwner}
              onOpen={onOpenPost}
              onEdit={onEditPost}
              onDelete={onDeletePost}
              onToggleFeature={onToggleFeature}
            />
          )}
          {remainingPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isOwner={isOwner}
              onOpen={onOpenPost}
              onEdit={onEditPost}
              onDelete={onDeletePost}
              onToggleFeature={onToggleFeature}
            />
          ))}
        </div>
      )}
    </section>
  );
}
