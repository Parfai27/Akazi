export function SearchIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinejoin="round" />
      <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export function MenuIcon({ className = "size-5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className = "size-5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5" strokeLinecap="round" />
      <path d="m11 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true" fill="currentColor">
      <path d="M12 3.5a8.3 8.3 0 0 0-7.2 12.4L3.6 20.4l4.6-1.2A8.3 8.3 0 1 0 12 3.5Zm4.4 11.7c-.2.5-1 .9-1.4 1-.4.1-.8.1-1.3-.1-.3-.1-.7-.2-1.2-.4-2.1-.9-3.5-3-3.6-3.1-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.8.4-.3.6-.3h.4c.1 0 .3 0 .4.4.2.5.6 1.6.6 1.7.1.1 0 .3-.1.4l-.3.3c-.1.1-.2.2-.1.4.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.3.1.4-.1l.4-.5c.1-.2.3-.1.4-.1h.4c.2 0 .4.1.5.3.1.4.5 1.3.4 1.5Z" />
    </svg>
  );
}

export function EyeIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 12S6.5 6.5 12 6.5 21.5 12 21.5 12 17.5 17.5 12 17.5 2.5 12 2.5 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 5 10 14" strokeLinecap="round" />
      <path d="M17 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatIcon({ className = "size-5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeLinecap="round" strokeWidth="2.6" />
    </svg>
  );
}

export function SendIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 12 20 4.5 15.5 20l-3.2-6.3L4.5 12Z" strokeLinejoin="round" />
      <path d="m12.3 13.7 3.4-3.4" strokeLinecap="round" />
    </svg>
  );
}

export function LinkIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" strokeLinecap="round" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m14.5 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9.5 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MailIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertCircleIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5M12 16h.01" strokeLinecap="round" />
    </svg>
  );
}

export function PinIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function BuildingIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V20M15 10h3.5A1.5 1.5 0 0 1 20 11.5V20M3.5 20h17" strokeLinejoin="round" />
      <path d="M8.5 8h3M8.5 12h3M8.5 16h3" strokeLinecap="round" />
    </svg>
  );
}

export function LevelIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 19v-4M10 19v-8M15 19V8M20 19V5" strokeLinecap="round" />
    </svg>
  );
}

export function BriefcaseIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ className = "size-5 shrink-0", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="m12 3.8 2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.8Z" strokeLinejoin="round" />
    </svg>
  );
}

export function PrinterIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 9V4h10v5M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5 9h14a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 19 17h-2" strokeLinejoin="round" />
      <path d="M7 14h10v6H7z" strokeLinejoin="round" />
    </svg>
  );
}

export function SparkIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14l-6.7-2 6.7-2L12 3.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function CalculatorIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" strokeLinecap="round" />
    </svg>
  );
}
