import { ArrowDown, LogOut, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SITE_ICON_PATH } from '../types/post';

interface HeroSectionProps {
  isOwner: boolean;
  isSignedIn: boolean;
  totalPublished: number;
  totalDrafts: number;
  showDraftsOnly: boolean;
  onToggleDraftsOnly: () => void;
  onOpenNewPost: () => void;
  onSignOut: () => void;
  authError: string | null;
}

export function HeroSection({
  isOwner,
  isSignedIn,
  totalPublished,
  totalDrafts,
  showDraftsOnly,
  onToggleDraftsOnly,
  onOpenNewPost,
  onSignOut,
  authError,
}: HeroSectionProps) {
  const scrollToFeed = () => {
    const el = document.getElementById('feed');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="top" className="mx-auto max-w-7xl px-4 pt-8 pb-8 sm:px-6 lg:px-8 lg:pt-12 lg:pb-10">
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Right Column (RTL Start): Editorial Presentation & Primary Action */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#0B111E]/80 p-6 backdrop-blur-md sm:p-8 lg:col-span-7 lg:p-10">
          <div>
            <p className="text-xs font-medium tracking-wide text-sky-300/90 sm:text-sm">
              گەرمیان · پلاتفۆرمی گشتی تەکنەلۆژیا و زانیاری
            </p>

            <h1
              className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
              style={{ textWrap: 'balance' }}
            >
              زۆنی تەکنەلۆژیای گەرمیان
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              سەکۆیەکی کراوە و پەبلیک بۆ خوێندنەوە و گەڕان لە هەموو جۆرە پۆستێکی تەکنەلۆژی؛
              هەموو بینەران بەبێ دانانی هەژمار دەتوانن هەموو پۆستەکان ببینن.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {isOwner ? (
              <button
                type="button"
                onClick={onOpenNewPost}
                className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
              >
                <Plus className="h-4 w-4" />
                <span>دروستکردنی پۆستی نوێ</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={scrollToFeed}
              className={`inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                isOwner
                  ? 'border border-slate-700 bg-slate-900/90 text-slate-100 hover:border-slate-500'
                  : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
              }`}
            >
              <span>بینینی پۆستەکان</span>
              <ArrowDown className="h-4 w-4" />
            </button>

            <div className="ms-auto hidden items-center gap-4 text-xs text-slate-400 sm:flex">
              <span>
                پۆستە بڵاوکراوەکان:{' '}
                <strong className="tabular-nums font-semibold text-slate-200">
                  {totalPublished}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Left Column: Emblem Architectural Showcase */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-[#0D1526] via-[#090E19] to-[#111827] p-6 lg:col-span-5">
          {/* Subtle dual sapphire/amber edge highlights echoing emblem */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-sky-500/15 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-amber-500/15 blur-2xl"
          />

          <div className="relative flex flex-1 items-center justify-center py-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/70 bg-[#05080F] p-2 shadow-2xl">
              <img
                src={SITE_ICON_PATH}
                alt="لۆگۆی فەرمی زۆنی تەکنەلۆژیای گەرمیان"
                referrerPolicy="no-referrer"
                className="h-48 w-48 rounded-xl object-cover sm:h-56 sm:w-56"
              />
            </div>
          </div>

          <div className="relative mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
            <span className="font-latin font-semibold tracking-wider text-slate-200" dir="ltr">
              GARMIAN TECHNOLOGY ZONE
            </span>
            <span>Siver IT</span>
          </div>
        </div>
      </div>

      {/* Owner Workspace Control Bar (no email displayed) */}
      {isOwner && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-500/30 bg-[#0B1424]/90 px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <ShieldCheck className="h-5 w-5 shrink-0 text-sky-400" />
            <span className="font-semibold text-slate-100">پانێڵی خاوەنی سایت</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="text-xs text-slate-300">
              بڵاوکراوە: <strong className="tabular-nums text-white">{totalPublished}</strong>
            </span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="text-xs text-amber-300">
              ڕەشنووس: <strong className="tabular-nums">{totalDrafts}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleDraftsOnly}
              className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                showDraftsOnly
                  ? 'bg-amber-400 text-slate-950'
                  : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
              }`}
            >
              {showDraftsOnly ? 'پێشاندانی هەموو پۆستەکان' : `تەنها ڕەشنووسەکان (${totalDrafts})`}
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-rose-500/50 hover:text-rose-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>دەرچوون</span>
            </button>
          </div>
        </div>
      )}

      {/* Non-owner signed-in notice (no owner email disclosed) */}
      {!isOwner && isSignedIn && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/35 bg-amber-950/25 px-5 py-3.5 text-sm text-amber-100">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
            <p>
              ئەم هەژمارە دەسەڵاتی بڵاوکردنەوەی پۆستی نییە. تەنها خاوەنی ماڵپەڕ دەتوانێت پۆست بکات.
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-900/40 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-900/70"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>دەرچوون</span>
          </button>
        </div>
      )}

      {authError && (
        <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {authError}
        </div>
      )}
    </section>
  );
}
