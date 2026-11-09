"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChatIcon, CloseIcon, SendIcon } from "@/components/icons";
import type { ChatJob } from "@/lib/chat";

type Message = {
  from: "visitor" | "akazi";
  text: string;
  jobs?: ChatJob[];
};

const SUGGESTIONS = ["Jobs in Kigali", "Remote roles", "How do alerts work?"];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "akazi",
      text: "I can look through the openings on this site. Ask about a place, a skill, a deadline, or email alerts.",
    },
  ]);
  const titleId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus({ preventScroll: true });
    } else if (wasOpen.current) {
      launcherRef.current?.focus();
    }
    wasOpen.current = open;
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pending, open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setDraft("");
    setMessages((current) => [...current, { from: "visitor", text: message }]);
    setPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await response.json()) as { reply?: string; jobs?: ChatJob[] };
      setMessages((current) => [
        ...current,
        { from: "akazi", text: data.reply || "I could not answer that just now. Try asking another way.", jobs: data.jobs ?? [] },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { from: "akazi", text: "I could not reach the listings just now. Check your connection and try again." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96">
      {open ? (
        <section
          aria-labelledby={titleId}
          className="pointer-events-auto flex h-[70dvh] max-h-[34rem] w-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-lg sm:h-[34rem]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 id={titleId} className="flex items-center gap-2 text-lg font-extrabold text-forest">
              <ChatIcon />
              Ask Akazi
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-wash hover:text-ink"
            >
              <CloseIcon />
            </button>
          </header>
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-busy={pending}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3"
          >
            {messages.map((message, index) => (
              <div key={index} className={message.from === "visitor" ? "text-right" : "text-left"}>
                <p
                  className={`inline-block max-w-[95%] rounded-2xl px-3 py-2 text-left text-sm leading-6 break-words ${
                    message.from === "visitor" ? "bg-forest text-card" : "bg-chip text-ink"
                  }`}
                >
                  <span className="sr-only">{message.from === "visitor" ? "You: " : "Akazi: "}</span>
                  {message.text}
                </p>
                {message.jobs && message.jobs.length > 0 ? (
                  <ul className="mt-2 grid gap-2 text-left">
                    {message.jobs.map((job) => (
                      <li key={job.id} className="rounded-xl border border-line px-3 py-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          onClick={() => setOpen(false)}
                          className="font-medium break-words text-forest-deep underline-offset-4 hover:underline"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-muted">{job.company}</p>
                        <p className="text-xs text-muted">{job.deadline}</p>
                        <p className="text-xs text-muted">{job.meta}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {pending ? (
              <p className="inline-block rounded-2xl bg-chip px-3 py-2 text-sm leading-6 text-muted">Thinking…</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={pending}
                onClick={() => send(suggestion)}
                className="min-h-9 rounded-full bg-chip px-3 text-xs hover:bg-forest hover:text-card disabled:opacity-60"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <input
              ref={inputRef}
              name="message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="e.g. Nursing jobs in Huye…"
              aria-label="Message"
              autoComplete="off"
              enterKeyHint="send"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-line px-3 text-base outline-none focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/25"
            />
            <button
              type="submit"
              disabled={pending}
              aria-label="Send"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-forest px-4 text-sm font-medium text-card hover:bg-forest-deep disabled:opacity-60"
            >
              <SendIcon />
              <span className="hidden sm:inline" aria-hidden="true">
                Send
              </span>
            </button>
          </form>
        </section>
      ) : null}
      {!open ? (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-lg bg-forest px-5 text-sm font-semibold text-card shadow-[0_10px_24px_rgba(30,107,88,0.35)] hover:bg-forest-deep"
        >
          <ChatIcon />
          Ask Akazi
        </button>
      ) : null}
    </div>
  );
}
