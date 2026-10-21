export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`inline-flex items-center ${compact ? "gap-2" : "gap-2.5"}`}>
      <LogoMark className={compact ? "size-8" : "size-9"} />
      <span className={`font-extrabold tracking-[-0.04em] ${compact ? "text-lg" : "text-xl"}`}>Akazi</span>
    </span>
  );
}

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect width="36" height="36" rx="10" fill="#1e6b58" />
      <rect x="7.5" y="20" width="5.4" height="8.5" rx="2.7" fill="#fff" />
      <rect x="15.3" y="14.5" width="5.4" height="14" rx="2.7" fill="#fff" />
      <rect x="23.1" y="12" width="5.4" height="16.5" rx="2.2" fill="#fff" />
      <rect x="23.1" y="8" width="5.4" height="7" rx="2.7" fill="#f5b942" />
    </svg>
  );
}
