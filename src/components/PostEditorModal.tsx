import {
  ImagePlus,
  Link2,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  CATEGORIES,
  PostCategory,
  PostMediaItem,
  PostRecord,
  PostStatus,
  SITE_ICON_PATH,
} from '../types/post';
import { compressImageFile } from '../utils/imageProcessor';

interface PostEditorModalProps {
  existingPost: PostRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

interface DraftGalleryItem {
  id: string;
  imageUrl: string;
  caption: string;
  sizeKB?: number;
  isExisting?: boolean;
}

function generateSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function PostEditorModal({ existingPost, onClose, onSaved }: PostEditorModalProps) {
  const [title, setTitle] = useState(existingPost?.title || '');
  const [summary, setSummary] = useState(existingPost?.summary || '');
  const [content, setContent] = useState(existingPost?.content || '');
  const [category, setCategory] = useState<PostCategory>(existingPost?.category || 'news');
  const [status, setStatus] = useState<PostStatus>(existingPost?.status || 'published');
  const [featured, setFeatured] = useState<boolean>(existingPost?.featured || false);
  const [coverImage, setCoverImage] = useState<string>(existingPost?.coverImage || '');
  const [coverUrlInput, setCoverUrlInput] = useState<string>(
    existingPost?.coverImage && !existingPost.coverImage.startsWith('data:')
      ? existingPost.coverImage
      : ''
  );
  const [coverSizeKB, setCoverSizeKB] = useState<number | null>(null);
  const [externalUrl, setExternalUrl] = useState(existingPost?.externalUrl || '');
  const [fileMeta, setFileMeta] = useState(existingPost?.fileMeta || '');
  const [codeSnippet, setCodeSnippet] = useState(existingPost?.codeSnippet || '');
  const [tagsInput, setTagsInput] = useState((existingPost?.tags || []).join(', '));
  const [galleryItems, setGalleryItems] = useState<DraftGalleryItem[]>([]);
  const [removedGalleryIds, setRemovedGalleryIds] = useState<string[]>([]);

  const [processingImage, setProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, saving]);

  useEffect(() => {
    if (!existingPost) return;
    const loadExistingGallery = async () => {
      const path = `posts/${existingPost.id}/gallery`;
      try {
        const snap = await getDocs(collection(db, 'posts', existingPost.id, 'gallery'));
        const items = snap.docs
          .map((d) => d.data() as PostMediaItem)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((item) => ({
            id: item.id,
            imageUrl: item.imageUrl,
            caption: item.caption || '',
            isExisting: true,
          }));
        setGalleryItems(items);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    };
    loadExistingGallery();
  }, [existingPost]);

  const processCoverFile = async (file: File) => {
    setErrorMsg(null);
    setProcessingImage(true);
    try {
      const result = await compressImageFile(file);
      setCoverImage(result.dataUrl);
      setCoverUrlInput('');
      setCoverSizeKB(result.sizeKB);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'هەڵە لە بارکردنی وێنەدا ڕوویدا.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleCoverFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processCoverFile(file);
    e.target.value = '';
  };

  const handleDropCover = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processCoverFile(file);
  };

  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = 4 - galleryItems.length;
    if (remainingSlots <= 0) {
      setErrorMsg('دەتوانیت زۆرترین ٤ وێنەی زیادە بۆ گەلەری هەڵبژێریت.');
      return;
    }

    setErrorMsg(null);
    setProcessingImage(true);
    try {
      const toProcess = files.slice(0, remainingSlots);
      const uploaded: DraftGalleryItem[] = [];
      for (const file of toProcess) {
        const res = await compressImageFile(file);
        uploaded.push({
          id: generateSafeId('media'),
          imageUrl: res.dataUrl,
          caption: '',
          sizeKB: res.sizeKB,
          isExisting: false,
        });
      }
      setGalleryItems((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'هەڵە لە بارکردنی وێنەی گەلەری.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleRemoveGalleryItem = (item: DraftGalleryItem) => {
    setGalleryItems((prev) => prev.filter((g) => g.id !== item.id));
    if (item.isExisting) {
      setRemovedGalleryIds((prev) => [...prev, item.id]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const user = auth.currentUser;
    if (!user) {
      setErrorMsg('تکایە سەرەتا وەک خاوەنی سایت بچۆ ژوورەوە.');
      return;
    }

    const cleanTitle = title.trim();
    const cleanSummary = summary.trim();
    const cleanContent = content.trim();
    const cleanExternalUrl = externalUrl.trim();
    const cleanFileMeta = fileMeta.trim();
    const cleanCode = codeSnippet.trim();
    const finalCover = (coverImage || coverUrlInput).trim();

    if (cleanTitle.length < 2 || cleanTitle.length > 180) {
      setErrorMsg('ناونیشانی پۆست دەبێت لە نێوان ٢ تا ١٨٠ پیت بێت.');
      return;
    }
    if (cleanContent.length < 1 || cleanContent.length > 25000) {
      setErrorMsg('ناوەڕۆکی پۆست پێویستە بنووسرێت (زۆرترین ٢٥,٠٠٠ پیت).');
      return;
    }
    if (cleanSummary.length > 450) {
      setErrorMsg('کورتەی پۆست نابێت لە ٤٥٠ پیت زیاتر بێت.');
      return;
    }
    if (finalCover.length > 550000) {
      setErrorMsg('قەبارەی وێنەی سەرەکی زۆر گەورەیە.');
      return;
    }
    if (cleanExternalUrl.length > 0) {
      try {
        new URL(cleanExternalUrl);
      } catch {
        setErrorMsg('بەستەری دەرەکی نادروستە (دەبێت بە https:// یان http:// دەستپێبکات).');
        return;
      }
    }

    const parsedTags = tagsInput
      .split(/[,،]/)
      .map((t) => t.trim().slice(0, 40))
      .filter((t) => t.length > 0)
      .slice(0, 6);

    setSaving(true);
    const postId = existingPost?.id || generateSafeId('post');
    const postPath = `posts/${postId}`;

    try {
      const payload = {
        id: postId,
        title: cleanTitle,
        summary: cleanSummary,
        content: cleanContent,
        category,
        status,
        featured,
        coverImage: finalCover,
        externalUrl: cleanExternalUrl,
        codeSnippet: cleanCode,
        fileMeta: cleanFileMeta,
        tags: parsedTags,
        authorUid: user.uid,
        authorName:
          user.displayName && !user.displayName.includes('@')
            ? user.displayName.slice(0, 80)
            : 'زۆنی تەکنەلۆژیای گەرمیان',
        updatedAt: serverTimestamp(),
      };

      if (existingPost) {
        try {
          await updateDoc(doc(db, 'posts', postId), payload);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, postPath);
        }
      } else {
        try {
          await setDoc(doc(db, 'posts', postId), {
            ...payload,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, postPath);
        }
      }

      // Sync removed gallery items
      for (const removedId of removedGalleryIds) {
        const mediaPath = `posts/${postId}/gallery/${removedId}`;
        try {
          await deleteDoc(doc(db, 'posts', postId, 'gallery', removedId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, mediaPath);
        }
      }

      // Sync current gallery items
      for (let i = 0; i < galleryItems.length; i++) {
        const item = galleryItems[i];
        const mediaPath = `posts/${postId}/gallery/${item.id}`;
        if (item.isExisting) {
          try {
            await updateDoc(doc(db, 'posts', postId, 'gallery', item.id), {
              caption: item.caption.trim().slice(0, 200),
              orderIndex: i,
              status,
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, mediaPath);
          }
        } else {
          try {
            await setDoc(doc(db, 'posts', postId, 'gallery', item.id), {
              id: item.id,
              postId,
              imageUrl: item.imageUrl,
              caption: item.caption.trim().slice(0, 200),
              orderIndex: i,
              status,
              authorUid: user.uid,
              createdAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, mediaPath);
          }
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? 'نەتوانرا پۆستەکە پاشەکەوت بکرێت. دڵنیابە لە پەیوەندی ئینتەرنێت و دەسەڵاتی خاوەنی سایت.'
          : 'هەڵەیەک ڕوویدا لە کاتی پاشەکەوتکردن.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-editor-title"
    >
      <div
        className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0A0F1B] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-7">
          <div>
            <h2 id="post-editor-title" className="text-lg font-bold text-white sm:text-xl">
              {existingPost ? 'دەستکاریکردنی پۆست' : 'دروستکردنی پۆستی نوێ'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              هەموو جۆرە پۆستێک (هەواڵ، وتار، فێرکاری، بەرنامە، وێنە و ئاگاداری) بڵاوبکەرەوە
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="داخستن"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-6 sm:px-7">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
              {errorMsg}
            </div>
          )}

          {/* Category Picker */}
          <div>
            <label className="block text-sm font-semibold text-slate-200">جۆری پۆست</label>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const selected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`min-h-[42px] rounded-xl border px-3 py-2 text-start text-xs font-semibold transition-colors sm:text-sm ${
                      selected
                        ? 'border-sky-400 bg-sky-500/15 text-sky-200'
                        : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {cat.labelKu}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="post-title" className="block text-sm font-semibold text-slate-200">
              ناونیشانی پۆست *
            </label>
            <input
              id="post-title"
              type="text"
              required
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ناونیشانی سەرنجڕاکێش بنووسە..."
              className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-800 bg-[#060A12] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="post-summary" className="block text-sm font-semibold text-slate-200">
              کورتەی پۆست (دەرکەوتوو لەسەر کاردەکان)
            </label>
            <textarea
              id="post-summary"
              rows={2}
              maxLength={450}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="پوختەیەکی کورت لەسەر بابەتەکە..."
              className="mt-2 w-full rounded-xl border border-slate-800 bg-[#060A12] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Cover Image Upload (Device File + Drag & Drop + URL + Site Icon) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-semibold text-slate-200">
                وێنەی سەرەکی پۆست (Upload Image)
              </label>
              <button
                type="button"
                onClick={() => {
                  setCoverImage(SITE_ICON_PATH);
                  setCoverUrlInput(SITE_ICON_PATH);
                  setCoverSizeKB(null);
                }}
                className="text-xs font-medium text-sky-300 hover:text-sky-200"
              >
                بەکارهێنانی ئایکۆنی فەرمی سایت
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropCover}
              className={`mt-2 rounded-2xl border border-dashed p-5 transition-colors ${
                isDragging
                  ? 'border-sky-400 bg-sky-500/10'
                  : 'border-slate-700 bg-[#060A12]/80'
              }`}
            >
              {coverImage ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-black">
                    <img
                      src={coverImage}
                      alt="پێشبینینی وێنەی پۆست"
                      referrerPolicy="no-referrer"
                      className="max-h-64 w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>
                      {coverSizeKB !== null ? `قەبارە دوای پرۆسێس: ${coverSizeKB} KB` : 'وێنە دیاریکراوە'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium text-slate-200 hover:border-sky-500/60"
                      >
                        گۆڕینی وێنە
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage('');
                          setCoverUrlInput('');
                          setCoverSizeKB(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 font-medium text-rose-200 hover:bg-rose-900/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>لابردن</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  {processingImage ? (
                    <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                  ) : (
                    <Upload className="h-8 w-8 text-sky-400" />
                  )}
                  <p className="mt-2 text-sm font-medium text-slate-200">
                    وێنە لێرە دابنێ یان لە کۆمپیوتەر/مۆبایل هەڵیبژێرە
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    JPG, PNG, WebP, GIF — بە شێوەی ئۆتۆماتیکی کەم دەکرێتەوە بۆ خێراکردن
                  </p>
                  <button
                    type="button"
                    disabled={processingImage}
                    onClick={() => coverInputRef.current?.click()}
                    className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    <ImagePlus className="h-4 w-4 text-sky-400" />
                    <span>هەڵبژاردنی وێنە</span>
                  </button>
                </div>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleCoverFileChange}
                className="hidden"
              />
            </div>

            {/* Optional Direct Image URL */}
            <div className="mt-2.5 flex items-center gap-2">
              <Link2 className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                type="url"
                value={coverUrlInput}
                onChange={(e) => {
                  setCoverUrlInput(e.target.value);
                  setCoverImage(e.target.value);
                  setCoverSizeKB(null);
                }}
                placeholder="یان بەستەری ڕاستەوخۆی وێنە (https://...) دابنێ"
                dir="ltr"
                className="font-latin min-h-[40px] w-full rounded-xl border border-slate-800 bg-[#060A12] px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Full Content */}
          <div>
            <label htmlFor="post-content" className="block text-sm font-semibold text-slate-200">
              ناوەڕۆکی تەواوی پۆست *
            </label>
            <textarea
              id="post-content"
              required
              rows={7}
              maxLength={25000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="زانیاری، وتار، ڕێنمایی یان وردەکاری پۆستەکەت لێرە بنووسە..."
              className="mt-2 w-full rounded-xl border border-slate-800 bg-[#060A12] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Additional Multi-Image Gallery */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#060A12]/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">وێنەی زیادە (گەلەری پۆست)</h3>
                <p className="text-xs text-slate-400">دەتوانیت تا ٤ وێنەی تر لەگەڵ پۆستەکە باربکەیت</p>
              </div>
              <button
                type="button"
                disabled={processingImage || galleryItems.length >= 4}
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-500/60 disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4 text-sky-400" />
                <span>زیادکردنی وێنە ({galleryItems.length}/4)</span>
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleGalleryUpload}
                className="hidden"
              />
            </div>

            {galleryItems.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {galleryItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-[#0B111E] p-2.5"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-black">
                      <img
                        src={item.imageUrl}
                        alt={`وێنەی گەلەری ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryItem(item)}
                        aria-label="سڕینەوەی وێنە"
                        className="absolute top-2 left-2 rounded-lg bg-black/80 p-1.5 text-rose-300 hover:bg-rose-600 hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={200}
                      value={item.caption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGalleryItems((prev) =>
                          prev.map((g) => (g.id === item.id ? { ...g, caption: val } : g))
                        );
                      }}
                      placeholder="سەردێڕی وێنە (ئارەزوومەندانە)..."
                      className="rounded-lg border border-slate-800 bg-[#060A12] px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Technical / Software / Media Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-external-url" className="block text-sm font-semibold text-slate-200">
                بەستەری دەرەکی / داگرتن / یوتیوب
              </label>
              <input
                id="post-external-url"
                type="url"
                maxLength={1000}
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
                className="font-latin mt-2 min-h-[44px] w-full rounded-xl border border-slate-800 bg-[#060A12] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="post-file-meta" className="block text-sm font-semibold text-slate-200">
                وەشان یان زانیاری فایل (بۆ بەرنامەکان)
              </label>
              <input
                id="post-file-meta"
                type="text"
                maxLength={160}
                value={fileMeta}
                onChange={(e) => setFileMeta(e.target.value)}
                placeholder="بۆ نموونە: v2.4 · Windows / Android · 45MB"
                dir="ltr"
                className="font-latin mt-2 min-h-[44px] w-full rounded-xl border border-slate-800 bg-[#060A12] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Optional Code Snippet */}
          <div>
            <label htmlFor="post-code" className="block text-sm font-semibold text-slate-200">
              کۆد یان فەرمانی تەکنیکی (ئارەزوومەندانە بۆ فێرکاری)
            </label>
            <textarea
              id="post-code"
              rows={3}
              maxLength={12000}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="npm install ... یان هەر کۆدێک"
              dir="ltr"
              className="font-mono mt-2 w-full rounded-xl border border-slate-800 bg-[#060A12] px-3.5 py-2.5 text-xs text-sky-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="post-tags" className="block text-sm font-semibold text-slate-200">
              تاگەکان (بە کۆما جیایان بکەرەوە، زۆرترین ٦ تاگ)
            </label>
            <input
              id="post-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="تەکنەلۆژیا، گەرمیان، ئەندرۆید، ئاسایش"
              className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-800 bg-[#060A12] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Status & Featured Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#060A12]/80 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-200">دۆخی بڵاوکردنەوە:</span>
              <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    status === 'published'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  بڵاوکردنەوەی گشتی
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    status === 'draft'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  ڕەشنووس (شاردراوە)
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-sky-500"
              />
              <span>پۆستی سەرەکی (Pin)</span>
            </label>
          </div>

          {/* Submit Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-500"
            >
              پاشگەزبوونەوە
            </button>
            <button
              type="submit"
              disabled={saving || processingImage}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {saving
                  ? 'خەریکە پاشەکەوت دەکرێت...'
                  : existingPost
                    ? 'پاشەکەوتکردنی گۆڕانکارییەکان'
                    : status === 'published'
                      ? 'بڵاوکردنەوەی پۆست'
                      : 'پاشەکەوتکردن وەک ڕەشنووس'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
