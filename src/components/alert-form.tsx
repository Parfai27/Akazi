"use client";

import { useActionState, useState } from "react";
import { subscribe, type AlertState } from "@/app/alerts/actions";

const initial: AlertState = {};

export function AlertForm() {
  const [state, action, pending] = useActionState(subscribe, initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studies, setStudies] = useState("");
  const [cv, setCv] = useState("");
  const [consent, setConsent] = useState(false);

  if (state.ok) {
    const matched = state.matched ?? 0;
    let detail = "We'll email you when a new role matches your studies or CV.";
    if (matched > 0 && state.mailReady && (state.sent ?? 0) > 0) {
      detail = `We emailed you ${matched} current match${matched === 1 ? "" : "es"}. New matches will follow the same way.`;
    } else if (matched > 0 && !state.mailReady) {
      detail = `We found ${matched} current match${matched === 1 ? "" : "es"}. Email is not set up on this server yet, so the note is saved and will send once mail is configured.`;
    } else if (matched > 0 && (state.sent ?? 0) === 0) {
      detail = `We found ${matched} match${matched === 1 ? "" : "es"}, but the email could not be sent. Check the mail settings and submit again.`;
    }
    return (
      <p className="rounded-2xl border border-forest/30 bg-card px-5 py-6 text-base leading-7">
        You are signed up. {detail}
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
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-forest"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-forest"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">What you studied</span>
        <input
          name="studies"
          value={studies}
          onChange={(event) => setStudies(event.target.value)}
          placeholder="Accounting, nursing, software engineering"
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-forest"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">CV</span>
        <textarea
          name="cv"
          rows={6}
          value={cv}
          onChange={(event) => setCv(event.target.value)}
          placeholder="Paste your CV or a short summary of your experience"
          className="w-full rounded-xl border border-line bg-card px-3 py-2 text-base leading-6 outline-none focus:border-forest"
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
      {state.error ? <p className="text-sm text-clay-deep">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-xl bg-forest px-4 text-sm font-medium text-card hover:bg-forest-deep disabled:opacity-60"
      >
        {pending ? "Saving…" : "Email me matching roles"}
      </button>
    </form>
  );
}
