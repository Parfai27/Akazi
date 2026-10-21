"use client";

import Link from "next/link";
import { useState } from "react";
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
        { from: "akazi", text: data.reply || "I could not answer that just now.", jobs: data.jobs ?? [] },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { from: "akazi", text: "I could not reach the listings just now. Try again in a moment." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96">
      {open ? (
        <section className="flex h-[70vh] max-h-[34rem] w-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-lg sm:h-[34rem]">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <p className="text-lg font-extrabold text-forest">Ask Akazi</p>
              <p className="text-xs text-muted">Answers come from the roles on this site</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-xl px-3 text-sm text-muted"
            >
              Close
            </button>
          </header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div key={index} className={message.from === "visitor" ? "text-right" : "text-left"}>
                <p
                  className={`inline-block max-w-[95%] rounded-2xl px-3 py-2 text-left text-sm leading-6 ${
                    message.from === "visitor" ? "bg-forest text-card" : "bg-chip text-ink"
                  }`}
                >
                  {message.text}
                </p>
                {message.jobs && message.jobs.length > 0 ? (
                  <ul className="mt-2 grid gap-2 text-left">
                    {message.jobs.map((job) => (
                      <li key={job.id} className="rounded-xl border border-line px-3 py-2">
                        <Link href={`/jobs/${job.id}`} className="font-medium text-forest-deep underline-offset-4 hover:underline">
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
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="min-h-9 rounded-full bg-chip px-3 text-xs"
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
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about a role"
              aria-label="Message"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-line px-3 text-base outline-none focus:border-forest"
            />
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 rounded-xl bg-forest px-4 text-sm font-medium text-card disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </section>
      ) : null}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 rounded-lg bg-forest px-5 text-sm font-semibold text-card shadow-[0_10px_24px_rgba(30,107,88,0.35)]"
        >
          Ask Akazi
        </button>
      ) : null}
    </div>
  );
}
