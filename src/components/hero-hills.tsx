import { useId } from "react";

/* The thousand hills at dusk: layered ridges with terraced slopes under a low amber sun. Decorative only. */
export function HeroHills({ className = "h-28 sm:h-44 lg:h-60" }: { className?: string }) {
  // Each copy needs its own gradient id, since a page can show more than one set of hills.
  const glow = useId();
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 260"
      preserveAspectRatio="xMaxYMax slice"
      className={`pointer-events-none absolute inset-x-0 -bottom-px -z-10 w-full ${className}`}
    >
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#f5b942" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f5b942" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="1290" cy="92" r="120" fill={`url(#${glow})`} />
      <circle cx="1290" cy="92" r="36" fill="#f5b942" />
      <path
        fill="#2f8a72"
        fillOpacity="0.55"
        d="M0 190C180 150 320 170 470 140C640 105 760 150 900 110C1030 72 1110 60 1190 92C1290 130 1360 70 1440 60V260H0Z"
      />
      <path
        fill="#1b5d4d"
        d="M0 220C160 196 300 205 430 186C600 160 700 190 840 165C980 140 1060 120 1160 135C1260 150 1340 118 1440 110V260H0Z"
      />
      <path
        fill="#123f35"
        d="M0 244C200 236 380 240 560 222C720 206 820 214 960 196C1090 180 1180 168 1300 178C1370 184 1410 172 1440 168V260H0Z"
      />
      <g fill="none" stroke="#f5b942" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round">
        <path d="M700 224C860 210 1000 196 1100 190C1200 184 1300 192 1440 182" />
        <path d="M640 236C820 224 1000 212 1200 206C1300 203 1380 200 1440 196" />
        <path d="M600 246C800 238 1000 228 1200 222C1300 219 1380 216 1440 212" />
      </g>
    </svg>
  );
}
