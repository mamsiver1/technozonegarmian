import { CATEGORIES, PostCategory, SITE_ICON_PATH } from '../types/post';

interface FooterProps {
  onSelectCategory: (cat: PostCategory | 'all') => void;
}

export function Footer({ onSelectCategory }: FooterProps) {
  const handleJump = (cat: PostCategory | 'all') => {
    onSelectCategory(cat);
    const el = document.getElementById('feed');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer className="mt-20 border-t border-slate-800/90 bg-[#050810]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3.5">
            <img
              src={SITE_ICON_PATH}
              alt="ئایکۆنی زۆنی تەکنەلۆژیای گەرمیان"
              referrerPolicy="no-referrer"
              className="h-11 w-11 rounded-xl border border-slate-700/80 object-cover"
            />
            <div>
              <p className="text-base font-bold text-white">زۆنی تەکنەلۆژیای گەرمیان</p>
              <p className="font-latin text-xs tracking-wide text-slate-400" dir="ltr">
                GARMIAN TECHNOLOGY ZONE
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
            <button
              type="button"
              onClick={() => handleJump('all')}
              className="transition-colors hover:text-sky-300"
            >
              هەموو پۆستەکان
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleJump(cat.id)}
                className="transition-colors hover:text-sky-300"
              >
                {cat.labelKu}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-800/70 pt-6 text-sm sm:flex-row">
          <p className="text-slate-400">
            هەموو مافەکان پارێزراوە بۆ زۆنی تەکنەلۆژیای گەرمیان · {new Date().getFullYear()}
          </p>
          <p className="font-semibold text-slate-200">
            دروستکراوە لەلایەن{' '}
            <span className="font-latin bg-gradient-to-r from-sky-400 to-amber-400 bg-clip-text font-bold text-transparent">
              Siver IT
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
