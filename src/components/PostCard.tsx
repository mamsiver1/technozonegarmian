import {
  Code2,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Newspaper,
  Pin,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_MAP, PostCategory, PostRecord } from '../types/post';
import { formatKurdishDate } from '../utils/imageProcessor';

interface PostCardProps {
  post: PostRecord;
  isFeaturedLayout?: boolean;
  isOwner: boolean;
  onOpen: (post: PostRecord) => void;
  onEdit: (post: PostRecord) => void;
  onDelete: (post: PostRecord) => void;
  onToggleFeature: (post: PostRecord) => void;
}

function getCategoryIcon(cat: PostCategory) {
  switch (cat) {
    case 'news':
      return Newspaper;
    case 'article':
      return FileText;
    case 'tutorial':
      return Code2;
    case 'software':
      return Download;
    case 'media':
      return ImageIcon;
    case 'announcement':
      return Megaphone;
  }
}

export function PostCard({
  post,
  isFeaturedLayout = false,
  isOwner,
  onOpen,
  onEdit,
  onDelete,
  onToggleFeature,
}: PostCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const catInfo = CATEGORY_MAP[post.category] || CATEGORY_MAP.news;
  const CategoryIcon = getCategoryIcon(post.category);
  const hasValidCover = Boolean(post.coverImage && post.coverImage.trim().length > 0 && !imgFailed);

  const excerpt =
    post.summary && post.summary.trim().length > 0
      ? post.summary
      : post.content.length > 160
        ? `${post.content.slice(0, 160)}...`
        : post.content;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0B111E]/85 transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-700 ${
        isFeaturedLayout ? 'lg:col-span-3 lg:grid lg:grid-cols-12 lg:items-stretch' : ''
      }`}
    >
      {/* Visual Cover Slot */}
      <button
        type="button"
        onClick={() => onOpen(post)}
        className={`relative block w-full overflow-hidden bg-slate-950 text-start focus-visible:outline-2 focus-visible:outline-sky-400 ${
          isFeaturedLayout ? 'aspect-[16/10] lg:col-span-6 lg:aspect-auto lg:h-full' : 'aspect-[16/10]'
        }`}
      >
        {hasValidCover ? (
          <>
            <img
              src={post.coverImage}
              alt={post.title}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060A12]/70 via-transparent to-transparent"
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#0A101D] to-[#111827] p-6 text-center">
            <CategoryIcon
              className="mb-3 h-10 w-10 opacity-75"
              style={{ color: catInfo.accentHex }}
            />
            <span className="line-clamp-2 max-w-xs text-sm font-semibold text-slate-300">
              {post.title}
            </span>
          </div>
        )}
      </button>

      {/* Content Slot */}
      <div
        className={`flex flex-1 flex-col justify-between p-5 sm:p-6 ${
          isFeaturedLayout ? 'lg:col-span-6 lg:p-8' : ''
        }`}
      >
        <div>
          {/* Clean Unboxed Metadata Row (Zero Pills) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span className="font-semibold" style={{ color: catInfo.accentHex }}>
              {catInfo.labelKu}
            </span>
            <span aria-hidden="true">·</span>
            <time className="tabular-nums">{formatKurdishDate(post.createdAt)}</time>
            {post.featured && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-300">پۆستی سەرەکی</span>
              </>
            )}
            {post.status === 'draft' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-rose-300">ڕەشنووس (شاردراوە)</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3
            className={`mt-2.5 font-bold leading-snug text-white transition-colors group-hover:text-sky-200 ${
              isFeaturedLayout ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
            }`}
            style={{ textWrap: 'balance' }}
          >
            <button
              type="button"
              onClick={() => onOpen(post)}
              className="text-start focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              {post.title}
            </button>
          </h3>

          {/* Summary / Excerpt */}
          <p
            className={`mt-2.5 leading-relaxed text-slate-300 ${
              isFeaturedLayout ? 'line-clamp-4 text-sm sm:text-base' : 'line-clamp-3 text-sm'
            }`}
          >
            {excerpt}
          </p>

          {/* Optional File Meta or External Link Hint (Unboxed text) */}
          {(post.fileMeta || post.externalUrl || (post.tags && post.tags.length > 0)) && (
            <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              {post.fileMeta && (
                <span className="font-latin text-slate-300" dir="ltr">
                  {post.fileMeta}
                </span>
              )}
              {post.externalUrl && (
                <span className="inline-flex items-center gap-1 text-sky-300/90">
                  <ExternalLink className="h-3 w-3" />
                  <span>بەستەری دەرەکی هەیە</span>
                </span>
              )}
              {post.tags &&
                post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-slate-400">
                    #{tag}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <button
            type="button"
            onClick={() => onOpen(post)}
            className="text-sm font-semibold text-sky-300 transition-colors hover:text-sky-200"
          >
            خوێندنەوەی زیاتر ←
          </button>

          {isOwner && (
            <div className="flex items-center gap-1.5">
              {confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(post);
                      setConfirmingDelete(false);
                    }}
                    className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-400"
                  >
                    دڵنیام بسڕەوە
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                  >
                    پاشگەزبوونەوە
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onToggleFeature(post)}
                    title={post.featured ? 'لابردن لە پۆستی سەرەکی' : 'دیاریکردن وەک پۆستی سەرەکی'}
                    aria-label={post.featured ? 'لابردن لە پۆستی سەرەکی' : 'دیاریکردن وەک پۆستی سەرەکی'}
                    className={`rounded-lg border p-2 transition-colors ${
                      post.featured
                        ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                        : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(post)}
                    title="دەستکاریکردن"
                    aria-label="دەستکاریکردن"
                    className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-slate-300 transition-colors hover:border-sky-500/50 hover:text-sky-300"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    title="سڕینەوە"
                    aria-label="سڕینەوە"
                    className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-slate-400 transition-colors hover:border-rose-500/50 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
