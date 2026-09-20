"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AudioLines, LoaderCircle, TriangleAlert } from "lucide-react";

export default function PasscodeGate({
  misconfigured,
}: {
  misconfigured: boolean;
}) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!passcode.trim() || pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "That did not work.");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-5 py-16 font-sans dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <AudioLines className="size-5" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            senti
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            See how your words are likely to land
          </p>
        </div>

        {misconfigured ? (
          <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <TriangleAlert
                className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Not configured yet
                </p>
                <p className="mt-1 text-amber-800 dark:text-amber-200/80">
                  This deployment has no class code, so it is refusing to run
                  rather than let anyone with the link use it. Set{" "}
                  <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-500/20">
                    SENTI_PASSCODE
                  </code>{" "}
                  in the project&apos;s environment variables and redeploy.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
          >
            <label
              htmlFor="passcode"
              className="text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              Class code
            </label>
            <input
              id="passcode"
              type="password"
              value={passcode}
              autoComplete="off"
              autoFocus
              onChange={(event) => setPasscode(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-white/10"
              placeholder="Enter the code from your teacher"
            />

            {error && (
              <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!passcode.trim() || pending}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {pending && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              Continue
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          senti saves nothing. To be read, a conversation is sent to a language
          model, which is run by someone else.
        </p>
      </div>
    </div>
  );
}
