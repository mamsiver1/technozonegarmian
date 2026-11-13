import { LogIn, LogOut, Plus } from 'lucide-react';
import { PostCategory, SITE_ICON_PATH } from '../types/post';

interface HeaderProps {
  activeCategory: PostCategory | 'all';
  onSelectCategory: (cat: PostCategory | 'all') => void;
  isOwner: boolean;
  isSignedIn: boolean;
  authLoading: boolean;
  onOpenNewPost: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

const NAV_ITEMS: { id: PostCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'هەموو پۆستەکان' },
  { id: 'news', label: 'هەواڵ' },
  { id: 'tutorial', label: 'فێرکاری' },
  { id: 'software', label: 'بەرنامە' },
  { id: 'media', label: 'میدیا' },
];

export function Header({
  activeCategory,
  onSelectCategory,
  isOwner,
  isSignedIn,
  authLoading,
  onOpenNewPost,
  onSignIn,
  onSignOut,
}: HeaderProps) {
  const handleNavClick = (cat: PostCategory | 'all') => {
    onSelectCategory(cat);
    const feedEl = document.getElementById('feed');
    if (feedEl) {
      feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#060A12]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:gap-8 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Lockup (Single-line wordmark + official icon) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex shrink-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
        >
          <img
            src={SITE_ICON_PATH}
            alt="ئایکۆنی زۆنی تەکنەلۆژیای گەرمیان"
            referrerPolicy="no-referrer"
            className="h-9 w-9 shrink-0 rounded-xl border border-slate-700/80 object-cover shadow-sm"
          />
          <span className="whitespace-nowrap shrink-0 text-base font-bold tracking-tight text-slate-50 sm:text-lg">
            زۆنی تەکنەلۆژیای گەرمیان
          </span>
        </a>

        {/* Zone 2: Clean Single-Line Typography Nav Links */}
        <nav
          aria-label="بەشەکانی ماڵپەڕ"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative whitespace-nowrap shrink-0 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 ${
                  isActive
                    ? 'text-sky-300'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-l from-sky-400 to-amber-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex shrink-0 items-center">
          {isOwner ? (
            <button
              type="button"
              onClick={onOpenNewPost}
              className="inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap shrink-0 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              <Plus className="h-4 w-4" />
              <span>پۆستی نوێ</span>
            </button>
          ) : isSignedIn ? (
            <button
              type="button"
              onClick={onSignOut}
              disabled={authLoading}
              className="inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap shrink-0 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>دەرچوون</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              disabled={authLoading}
              title="چوونەژوورەوەی خاوەنی سایت"
              className="inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap shrink-0 rounded-xl border border-slate-700/90 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-sky-500/60 hover:bg-slate-800/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              <LogIn className="h-4 w-4 text-sky-400" />
              <span>بەڕێوەبەر</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
