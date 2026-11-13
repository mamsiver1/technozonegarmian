export function DesignedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#060A12]"
    >
      {/* Subtle architectural coordinate grid */}
      <div className="garmian-grid-bg absolute inset-0 opacity-80" />

      {/* Dual-tone emblem atmosphere: Cool Sapphire-Cyan (Right/East) & Warm Garmian Amber (Left/West) */}
      <div
        className="absolute -top-40 -right-32 h-[640px] w-[640px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, rgba(14, 165, 233, 0.05) 45%, transparent 72%)',
        }}
      />
      <div
        className="absolute -top-24 -left-32 h-[600px] w-[600px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.04) 48%, transparent 74%)',
        }}
      />

      {/* Deep lower horizon ambient wash */}
      <div
        className="absolute bottom-0 left-1/2 h-[480px] w-[960px] -translate-x-1/2 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(30, 58, 138, 0.12) 0%, rgba(15, 23, 42, 0.04) 55%, transparent 80%)',
        }}
      />

      {/* Precision SVG Circuit Traces echoing the Garmian Shield Emblem */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="cyanTrace" x1="100%" y1="0%" x2="40%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="amberTrace" x1="0%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Right-side sapphire circuit traces */}
        <g fill="none" stroke="url(#cyanTrace)" strokeWidth="1.2">
          <path d="M1440 120 H1260 L1210 170 H1080" />
          <path d="M1440 165 H1310 L1250 225 H1140 L1100 265" />
          <path d="M1440 280 H1340 L1285 335 H1180" />
          <path d="M1440 540 H1320 L1270 590 H1160" />
        </g>
        <g fill="#38BDF8" fillOpacity="0.65">
          <circle cx="1080" cy="170" r="3" />
          <circle cx="1100" cy="265" r="2.5" />
          <circle cx="1180" cy="335" r="3" />
          <circle cx="1160" cy="590" r="2.5" />
        </g>

        {/* Left-side warm amber circuit traces */}
        <g fill="none" stroke="url(#amberTrace)" strokeWidth="1.2">
          <path d="M0 140 H175 L225 190 H355" />
          <path d="M0 200 H130 L185 255 H295 L335 295" />
          <path d="M0 320 H105 L160 375 H255" />
          <path d="M0 580 H140 L190 630 H300" />
        </g>
        <g fill="#F59E0B" fillOpacity="0.65">
          <circle cx="355" cy="190" r="3" />
          <circle cx="335" cy="295" r="2.5" />
          <circle cx="255" cy="375" r="3" />
          <circle cx="300" cy="630" r="2.5" />
        </g>
      </svg>

      {/* Top hairline vignette */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-500/20 via-slate-400/20 to-sky-400/25" />
    </div>
  );
}
