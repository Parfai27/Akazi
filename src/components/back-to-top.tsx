"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER = 600;

/**
 * A round "back to top" button that appears once the page has been scrolled a screen or so. Its amber ring fills
 * as you read down the page. It sits above the Ask Akazi button, jumps instantly for people who turn motion off,
 * and hands keyboard focus back to the top of the page so the next Tab starts from there.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const top = window.scrollY;
      const room = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(top > SHOW_AFTER);
      setProgress(room > 0 ? Math.min(1, top / room) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function goUp() {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
    document.getElementById("content")?.focus({ preventScroll: true });
  }

  const circumference = 2 * Math.PI * 22;
  return (
    <button
      type="button"
      onClick={goUp}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`akazi-top fixed right-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.25rem)] z-30 inline-flex size-12 items-center justify-center rounded-full bg-forest text-white shadow-[0_12px_30px_rgba(6,30,24,0.35)] hover:bg-forest-deep sm:right-6 sm:bottom-24 print:hidden ${
        visible ? "akazi-top-shown" : ""
      }`}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-12 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="2.5" />
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke="#f5b942"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <svg viewBox="0 0 24 24" className="relative size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.25">
        <path d="M12 19V5m-6 6 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
