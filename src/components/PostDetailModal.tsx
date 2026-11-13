import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CATEGORY_MAP, PostMediaItem, PostRecord } from '../types/post';
import { formatKurdishDate } from '../utils/imageProcessor';

interface PostDetailModalProps {
  post: PostRecord;
  isOwner: boolean;
  onClose: () => void;
  onEdit: (post: PostRecord) => void;
  onDelete: (post: PostRecord) => Promise<void>;
}

function extractYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace('/', '').trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function PostDetailModal({
  post,
  isOwner,
  onClose,
  onEdit,
  onDelete,
}: PostDetailModalProps) {
  const [gallery, setGallery] = useState<PostMediaItem[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);

  const catInfo = CATEGORY_MAP[post.category] || CATEGORY_MAP.news;
  const youtubeEmbed = post.externalUrl ? extractYouTubeEmbedUrl(post.externalUrl) : null;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxImage, onClose]);

  useEffect(() => {
    const galleryPath = `posts/${post.id}/gallery`;
    const colRef = collection(db, 'posts', post.id, 'gallery');
    const q = isOwner
      ? query(colRef)
      : query(colRef, where('status', '==', 'published'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => d.data() as PostMediaItem)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        setGallery(items);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, galleryPath);
        } catch {
          // Gallery unavailable or empty; keep modal readable
        }
      }
    );

    return () => unsub();
  }, [post.id, isOwner]);

  const handleCopyCode = async () => {
    if (!post.codeSnippet) return;
    try {
      await navigator.clipboard.writeText(post.codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard blocked silently
    }
  };

  const handleDeleteClick = async () => {
    setDeleting(true);
    try {
      await onDelete(post);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-6 lg:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-detail-title"
    >
      <div
        className="relative my-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0A0F1B] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/90 px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
            <span className="font-semibold" style={{ color: catInfo.accentHex }}>
              {catInfo.labelKu}
            </span>
            <span aria-hidden="true">·</span>
            <time className="tabular-nums">{formatKurdishDate(post.createdAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.authorName}</span>
            {post.status === 'draft' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-rose-300">ڕەشنووس</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="داخستن"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/90 text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cover Image */}
        {post.coverImage && !coverFailed && (
          <div className="border-b border-slate-800/80 bg-[#05080F]">
            <button
              type="button"
              onClick={() => setLightboxImage(post.coverImage || null)}
              className="block w-full cursor-zoom-in overflow-hidden"
            >
              <img
                src={post.coverImage}
                alt={post.title}
                referrerPolicy="no-referrer"
                onError={() => setCoverFailed(true)}
                className="max-h-[460px] w-full object-contain"
              />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <h2
            id="post-detail-title"
            className="text-2xl font-extrabold leading-snug text-white sm:text-3xl"
            style={{ textWrap: 'balance' }}
          >
            {post.title}
          </h2>

          {post.summary && (
            <p className="mt-3 text-base leading-relaxed text-slate-300 sm:text-lg">
              {post.summary}
            </p>
          )}

          {/* Optional File Meta / External URL Action */}
          {(post.fileMeta || post.externalUrl) && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0E1526] px-4 py-3.5">
              <div className="text-sm">
                {post.fileMeta && (
                  <p className="font-latin font-medium text-slate-200" dir="ltr">
                    {post.fileMeta}
                  </p>
                )}
                {post.externalUrl && (
                  <p className="font-latin mt-0.5 max-w-md truncate text-xs text-slate-400" dir="ltr">
                    {post.externalUrl}
                  </p>
                )}
              </div>
              {post.externalUrl && (
                <a
                  href={post.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 sm:text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>کردنەوەی لینک / داگرتن</span>
                </a>
              )}
            </div>
          )}

          {/* Smart YouTube Video Preview */}
          {youtubeEmbed && (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-black">
              <div className="aspect-video w-full">
                <iframe
                  src={youtubeEmbed}
                  title={post.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </div>
          )}

          {/* Full Reading Text */}
          <div className="mt-6 max-w-prose space-y-4 text-base leading-loose text-slate-200">
            {post.content.split('\n').map((paragraph, index) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;
              return (
                <p key={index} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Code Snippet */}
          {post.codeSnippet && post.codeSnippet.trim().length > 0 && (
            <div className="mt-7 overflow-hidden rounded-xl border border-slate-800 bg-[#05080F]">
              <div className="flex items-center justify-between border-b border-slate-800/90 px-4 py-2.5 text-xs text-slate-400">
                <span className="font-mono">Code / Command</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-sky-500/60"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>کۆپی کرا</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>کۆپیکردن</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-left text-xs leading-relaxed text-sky-200 sm:text-sm" dir="ltr">
                <code>{post.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* Additional Gallery Images */}
          {gallery.length > 0 && (
            <div className="mt-8 border-t border-slate-800/80 pt-6">
              <h3 className="text-sm font-bold text-slate-200">گەلەری وێنەکانی پۆست</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {gallery.map((item) => (
                  <figure
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-slate-800 bg-[#05080F]"
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxImage(item.imageUrl)}
                      className="block w-full cursor-zoom-in"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.caption || post.title}
                        referrerPolicy="no-referrer"
                        className="aspect-[16/10] w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                      />
                    </button>
                    {item.caption && (
                      <figcaption className="px-3 py-2 text-xs text-slate-400">
                        {item.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* Unboxed Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
              {post.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-5">
              <span className="text-xs text-slate-400">بەڕێوەبردنی پۆست (تەنها خاوەنی سایت)</span>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(post);
                  }}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-sky-500/60"
                >
                  <Edit3 className="h-4 w-4 text-sky-400" />
                  <span>دەستکاریکردنی پۆست</span>
                </button>

                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleDeleteClick}
                      className="min-h-[40px] rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
                    >
                      {deleting ? 'دەسڕدرێتەوە...' : 'دڵنیام بیسڕەوە'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="min-h-[40px] rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white"
                    >
                      پاشگەزبوونەوە
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-900/50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>سڕینەوە</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxImage(null);
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="داخستنی وێنە"
            className="absolute top-4 left-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxImage}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
