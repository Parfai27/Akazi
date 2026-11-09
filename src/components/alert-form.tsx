"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircleIcon, BellIcon, CheckIcon } from "@/components/icons";
import { subscribe, type AlertState } from "@/app/alerts/actions";

const initial: AlertState = {};

export function AlertForm() {
  const [state, action, pending] = useActionState(subscribe, initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studies, setStudies] = useState("");
  const [cv, setCv] = useState("");
  const [consent, setConsent] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
    else if (state.ok) doneRef.current?.focus();
  }, [state]);

  if (state.ok) {
    const matched = state.matched ?? 0;
    let detail = "We'll email you when a new role matches your studies or CV.";
    if (matched > 0 && state.mailReady && (state.sent ?? 0) > 0) {
      detail = `We emailed you ${matched} current match${matched === 1 ? "" : "es"}. New matches will follow the same way.`;
    } else if (matched > 0 && !state.mailReady) {
      detail = `We found ${matched} current match${matched === 1 ? "" : "es"}. Email is not set up on this server yet, so the note is saved and will send once mail is configured.`;
    } else if (matched > 0 && (state.sent ?? 0) === 0) {
      detail = `We found ${matched} match${matched === 1 ? "" : "es"}. The email did not go out this time, so try again in a moment.`;
    }
    return (
      <p
        ref={doneRef}
        tabIndex={-1}
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-forest/30 bg-card px-5 py-6 text-base leading-7 outline-none"
      >
        <CheckIcon className="mt-1 size-5 shrink-0 text-forest" />
        <span>You are signed up. {detail}</span>
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Name</span>
        <input
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/25"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Email</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          spellCheck={false}
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/25"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">What you studied</span>
        <input
          name="studies"
          autoComplete="off"
          value={studies}
          onChange={(event) => setStudies(event.target.value)}
          placeholder="e.g. Accounting, nursing, software engineering…"
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/25"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">CV</span>
        <textarea
          name="cv"
          rows={6}
          value={cv}
          onChange={(event) => setCv(event.target.value)}
          placeholder="Paste your CV or a short summary of your experience…"
          className="w-full rounded-xl border border-line bg-card px-3 py-2 text-base leading-6 outline-none focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/25"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Or upload a PDF or text CV</span>
        <input
          name="cvFile"
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-chip file:px-4 file:text-sm file:text-ink"
        />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          name="consent"
          type="checkbox"
          required
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 size-5 shrink-0 accent-forest"
        />
        <span>I agree to be emailed when Akazi finds a role that matches my studies or CV.</span>
      </label>
      <div aria-live="polite">
        {state.error ? (
          <p ref={errorRef} tabIndex={-1} className="flex items-start gap-2 text-sm text-clay-deep outline-none">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-forest px-4 text-sm font-medium text-card hover:bg-forest-deep disabled:opacity-60"
      >
        <BellIcon />
        {pending ? "Saving…" : "Email me matching roles"}
      </button>
    </form>
  );
}
