"use client";

import { useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Drama,
  HeartHandshake,
  ImageUp,
  Lightbulb,
  LoaderCircle,
  Quote,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  UsersRound,
  WandSparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  BANDS,
  FLAG_META,
  isRough,
  type Analysis,
  type Band,
  type Flag,
  type Turn,
} from "@/lib/kindness";
import { SAMPLES } from "@/lib/samples";
import { ACCEPT_ATTRIBUTE, imageProblem } from "@/lib/screenshot";

const BAND_STYLES: Record<
  Band,
  { hex: string; badge: string; text: string; fill: string; rail: string }
> = {
  kind: {
    hex: "#10b981",
    badge:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25",
    text: "text-emerald-600 dark:text-emerald-400",
    fill: "bg-emerald-500",
    rail: "border-l-emerald-500",
  },
  neutral: {
    hex: "#64748b",
    badge:
      "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/25",
    text: "text-slate-600 dark:text-slate-400",
    fill: "bg-slate-400",
    rail: "border-l-slate-300 dark:border-l-slate-600",
  },
  edgy: {
    hex: "#f59e0b",
    badge:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25",
    text: "text-amber-600 dark:text-amber-400",
    fill: "bg-amber-500",
    rail: "border-l-amber-500",
  },
  harsh: {
    hex: "#f43f5e",
    badge:
      "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/25",
    text: "text-rose-600 dark:text-rose-400",
    fill: "bg-rose-500",
    rail: "border-l-rose-500",
  },
};

const SPEAKER_TONES = [
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-pink-500",
];

const CARD =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60";

function initials(speaker: string) {
  return speaker
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*  Gauge                                                                      */
/* -------------------------------------------------------------------------- */

const CX = 140;
const CY = 142;
const R = 106;

function polar(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(radians),
    y: CY - radius * Math.sin(radians),
  };
}

function arc(radius: number, from: number, to: number) {
  const start = polar(radius, from);
  const end = polar(radius, to);
  const sweep = to < from ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 0 ${sweep} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

/** 0 sits at 180°, 50 at the top, 100 at 0°. */
function angleFor(kindness: number) {
  return 180 - clamp(kindness) * 1.8;
}

function Gauge({ kindness, band }: { kindness: number; band: Band }) {
  const style = BAND_STYLES[band];

  return (
    <svg
      viewBox="0 0 280 172"
      role="img"
      aria-label={`Kindness ${Math.round(kindness)} out of 100. ${BANDS[band].label}.`}
      className="w-full max-w-[300px]"
    >
      <defs>
        <linearGradient id="senti-gauge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="65%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      <path
        d={arc(R, 180, 0)}
        fill="none"
        stroke="url(#senti-gauge)"
        strokeWidth={14}
        strokeLinecap="round"
        className="opacity-25"
      />
      <path
        d={arc(R, 180, angleFor(kindness))}
        fill="none"
        stroke={style.hex}
        strokeWidth={14}
        strokeLinecap="round"
      />

      {[0, 25, 50, 75, 100].map((tick) => {
        const inner = polar(R - 17, angleFor(tick));
        const outer = polar(R - 10, angleFor(tick));
        return (
          <line
            key={tick}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            strokeWidth={tick === 50 ? 2 : 1}
            className="stroke-slate-300 dark:stroke-slate-700"
          />
        );
      })}

      <g
        className="transition-transform duration-700 ease-out"
        transform={`rotate(${(clamp(kindness) - 50) * 1.8} ${CX} ${CY})`}
      >
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - (R - 22)}
          stroke={style.hex}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
      <circle cx={CX} cy={CY} r={7} fill={style.hex} />
      <circle cx={CX} cy={CY} r={3} className="fill-white dark:fill-slate-900" />

      <text
        x={30}
        y={166}
        textAnchor="middle"
        className="fill-slate-400 text-[11px] tabular-nums"
      >
        0
      </text>
      <text
        x={250}
        y={166}
        textAnchor="middle"
        className="fill-slate-400 text-[11px] tabular-nums"
      >
        100
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

function BandBadge({ band, size = "sm" }: { band: Band; size?: "sm" | "lg" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-medium ring-1 ring-inset ${BAND_STYLES[band].badge} ${
        size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2 py-0.5 text-xs"
      }`}
    >
      {BANDS[band].label}
    </span>
  );
}

function FlagChip({ flag }: { flag: Flag }) {
  const meta = FLAG_META[flag];
  const tone = isRough(flag)
    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300";

  return (
    <span
      title={meta.meaning}
      className={`inline-flex cursor-help items-center rounded-md border px-1.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {meta.label}
    </span>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  blurb,
}: {
  icon: LucideIcon;
  title: string;
  blurb: string;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-slate-400" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{blurb}</p>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard sections                                                         */
/* -------------------------------------------------------------------------- */

function EscalationBanner({ note }: { note: string }) {
  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="flex items-start gap-3">
        <ShieldAlert
          className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            This one is worth talking through with someone
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/80">
            {note}
          </p>
        </div>
      </div>
    </section>
  );
}

function HeroCard({ analysis }: { analysis: Analysis }) {
  return (
    <section className={`${CARD} flex flex-col items-center p-6`}>
      <div className="self-start">
        <SectionHeading
          icon={HeartHandshake}
          title="How this lands"
          blurb={`Across ${analysis.turns.length} lines`}
        />
      </div>

      <div className="mt-2">
        <Gauge kindness={analysis.kindness} band={analysis.band} />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-5xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
          {Math.round(analysis.kindness)}
        </span>
        <BandBadge band={analysis.band} size="lg" />
      </div>

      <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
        {BANDS[analysis.band].blurb}
      </p>

      <p className="mt-5 border-t border-slate-200 pt-4 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:text-slate-300">
        {analysis.summary}
      </p>
    </section>
  );
}

function SpeakerCard({
  analysis,
  tones,
}: {
  analysis: Analysis;
  tones: Map<string, string>;
}) {
  return (
    <section className={`${CARD} p-6`}>
      <SectionHeading
        icon={UsersRound}
        title="Each person's habits"
        blurb="What each speaker tends to do, not what they are"
      />

      {analysis.speakers.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
          No speaker labels found. Prefix lines with a name to compare people.
        </p>
      ) : (
        <ul className="mt-5 space-y-5">
          {analysis.speakers.map((speaker) => {
            const style = BAND_STYLES[speaker.band];
            return (
              <li key={speaker.speaker}>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                      tones.get(speaker.speaker.toLowerCase()) ?? "bg-slate-500"
                    }`}
                    aria-hidden
                  >
                    {initials(speaker.speaker)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {speaker.speaker}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {speaker.turns} lines
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${style.text}`}
                  >
                    {Math.round(speaker.kindness)}
                  </span>
                  <BandBadge band={speaker.band} />
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${style.fill}`}
                    style={{ width: `${clamp(speaker.kindness)}%` }}
                  />
                </div>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {speaker.pattern}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function CoachingCard({ coaching }: { coaching: string[] }) {
  return (
    <section className={`${CARD} p-6`}>
      <SectionHeading
        icon={Lightbulb}
        title="Things to try"
        blurb="Based only on what actually showed up here"
      />
      <ul className="mt-4 space-y-3">
        {coaching.map((tip) => (
          <li key={tip} className="flex gap-3 text-sm">
            <span
              className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600"
              aria-hidden
            />
            <span className="leading-relaxed text-slate-700 dark:text-slate-300">
              {tip}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TurnCard({ turn, tone }: { turn: Turn; tone: string }) {
  const style = BAND_STYLES[turn.band];
  const rough = turn.band === "edgy" || turn.band === "harsh";

  return (
    <li className={`border-l-2 py-4 pl-4 ${style.rail}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${tone}`}
          aria-hidden
        >
          {turn.speaker ? initials(turn.speaker) : "·"}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {turn.speaker ?? "Unlabelled"}
            </span>
            <span className={`text-xs font-semibold tabular-nums ${style.text}`}>
              {Math.round(turn.kindness)}
            </span>
            {rough && turn.aimedAtPerson && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <Target className="size-3" aria-hidden />
                aimed at a person
              </span>
            )}
            <span className="ml-auto">
              <BandBadge band={turn.band} />
            </span>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {turn.text}
          </p>

          {turn.flags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {turn.flags.map((flag) => (
                <FlagChip key={flag} flag={flag} />
              ))}
            </div>
          )}

          <p className="mt-2 text-sm text-slate-500 italic dark:text-slate-400">
            {turn.readAs}
          </p>

          {turn.sarcasm?.present && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
              <Drama
                className="mt-0.5 size-3.5 shrink-0 text-slate-400"
                aria-hidden
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium">
                  Reads as sarcasm ({turn.sarcasm.confidence} confidence).
                </span>{" "}
                {turn.sarcasm.note}
              </p>
            </div>
          )}

          {turn.rewrite && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <WandSparkles
                className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              <p className="text-sm text-emerald-900 dark:text-emerald-200">
                <span className="text-xs font-medium tracking-wide uppercase opacity-70">
                  Same point, softer
                </span>
                <br />
                {turn.rewrite}
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function PatternLegend({ flags }: { flags: Flag[] }) {
  if (flags.length === 0) return null;

  return (
    <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
        Patterns in this conversation
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {flags.map((flag) => {
          const meta = FLAG_META[flag];
          return (
            <div key={flag}>
              <dt className="flex items-center gap-2">
                <FlagChip flag={flag} />
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {meta.meaning}
                {meta.tip && (
                  <span className="mt-0.5 block text-slate-600 dark:text-slate-300">
                    {meta.tip}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Dashboard() {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Present only when the deployment itself needs attention. */
  const [fix, setFix] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const tones = useMemo(() => {
    const map = new Map<string, string>();
    analysis?.speakers.forEach((speaker, index) => {
      map.set(
        speaker.speaker.toLowerCase(),
        SPEAKER_TONES[index % SPEAKER_TONES.length],
      );
    });
    return map;
  }, [analysis]);

  const seenFlags = useMemo(() => {
    const flags = new Set<Flag>();
    analysis?.turns.forEach((turn) =>
      turn.flags.forEach((flag) => flags.add(flag)),
    );
    return [...flags];
  }, [analysis]);

  async function read(transcript: string) {
    if (!transcript.trim() || pending) return;

    setPending(true);
    setError(null);
    setFix(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "That did not work. Try again.");
        setFix(typeof data.fix === "string" ? data.fix : null);
        return;
      }

      setAnalysis(data as Analysis);
    } catch {
      setError("Could not reach the reader. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  /**
   * Turns a screenshot into text and stops there. The transcript lands in the
   * box so it can be checked, and corrected, before anyone is scored on it.
   */
  async function transcribe(file: File) {
    if (reading || pending) return;

    const problem = imageProblem(file);
    if (problem) {
      setError(problem);
      setFix(null);
      return;
    }

    setReading(true);
    setError(null);
    setFix(null);

    try {
      const body = new FormData();
      body.append("image", file);

      const response = await fetch("/api/transcribe", { method: "POST", body });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "That screenshot could not be read.");
        setFix(typeof data.fix === "string" ? data.fix : null);
        return;
      }

      setAnalysis(null);
      setText(data.transcript as string);
    } catch {
      setError("Could not reach the reader. Check your connection.");
    } finally {
      setReading(false);
    }
  }

  function handleClear() {
    setText("");
    setAnalysis(null);
    setError(null);
    setFix(null);
  }

  return (
    <div className="min-h-full flex-1 bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
        <header className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <AudioLines className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">senti</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              See how your words are likely to land before someone else feels
              them
            </p>
          </div>
        </header>

        <section className={`${CARD} mt-8 p-6`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label
              htmlFor="dialogue"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Paste a conversation
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              One message per line, optionally prefixed with{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
                Name:
              </code>
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                // Cleared so picking the same file twice still fires a change.
                event.target.value = "";
                if (file) transcribe(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={reading || pending}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            >
              {reading ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <ImageUp className="size-4" aria-hidden />
              )}
              {reading ? "Reading the screenshot…" : "Upload a screenshot"}
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {reading
                ? "Copying out the messages. You can check them before reading."
                : "Or paste one straight into the box. You can fix the text afterwards."}
            </span>
          </div>

          <textarea
            id="dialogue"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                read(text);
              }
            }}
            onPaste={(event) => {
              // A screenshot on the clipboard is the common case on a Mac, and
              // pasting it as an image beats saving it to disk first.
              const file = [...event.clipboardData.files].find((candidate) =>
                candidate.type.startsWith("image/"),
              );
              if (file) {
                event.preventDefault();
                transcribe(file);
              }
            }}
            rows={10}
            spellCheck={false}
            placeholder={
              "Maya: oh that's a bold choice of outfit\nJordan: what's wrong with it\nMaya: nothing! it's very brave"
            }
            className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-600 dark:focus:ring-white/10"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Try one
            </span>
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={pending || reading}
                onClick={() => {
                  setText(sample.dialogue);
                  read(sample.dialogue);
                }}
                title={sample.hint}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => read(text)}
              disabled={!text.trim() || pending || reading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              {pending ? "Reading…" : "Read the conversation"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={pending || reading || (!text && !analysis)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Trash2 className="size-4" aria-hidden />
              Clear
            </button>
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
              ⌘↵ to read
            </span>
          </div>
        </section>

        {error && (
          <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </section>
        )}

        {fix && (
          <section className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <Wrench
                className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  For whoever set this up
                </p>
                <p className="mt-1 text-amber-800 dark:text-amber-200/80">
                  {fix}
                </p>
              </div>
            </div>
          </section>
        )}

        {pending && !analysis && (
          <section
            className={`${CARD} mt-6 flex flex-col items-center gap-3 p-12 text-center`}
          >
            <LoaderCircle
              className="size-6 animate-spin text-slate-300 dark:text-slate-600"
              aria-hidden
            />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Reading the conversation
            </p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Working out how each line is likely to land. This takes a few
              seconds.
            </p>
          </section>
        )}

        {!pending && !analysis && !error && (
          <section
            className={`${CARD} mt-6 flex flex-col items-center gap-2 border-dashed p-12 text-center`}
          >
            <Sparkles
              className="size-6 text-slate-300 dark:text-slate-700"
              aria-hidden
            />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Nothing read yet
            </p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Paste a group chat or an argument, or try one of the examples
              above.
            </p>
          </section>
        )}

        {analysis && (
          <div
            className={`mt-6 space-y-6 transition-opacity ${pending ? "opacity-50" : ""}`}
          >
            {analysis.escalation?.needed && (
              <EscalationBanner note={analysis.escalation.note} />
            )}

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <HeroCard analysis={analysis} />
              </div>
              <div className="space-y-6 lg:col-span-3">
                <SpeakerCard analysis={analysis} tones={tones} />
                {analysis.coaching.length > 0 && (
                  <CoachingCard coaching={analysis.coaching} />
                )}
              </div>
            </div>

            <section className={`${CARD} p-6`}>
              <SectionHeading
                icon={Quote}
                title="Line by line"
                blurb="How each message reads to the person on the other end"
              />

              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {analysis.turns.map((turn, index) => (
                  <TurnCard
                    key={`${index}-${turn.text.slice(0, 24)}`}
                    turn={turn}
                    tone={
                      (turn.speaker && tones.get(turn.speaker.toLowerCase())) ||
                      "bg-slate-400"
                    }
                  />
                ))}
              </ul>

              <PatternLegend flags={seenFlags} />
            </section>
          </div>
        )}

        <footer className="mt-10 space-y-1 text-center text-xs text-slate-400 dark:text-slate-600">
          <p>
            senti describes how words are likely to land. It reads tone, not
            intent, and it can be wrong.
          </p>
          <p>
            senti saves nothing. To be read, a conversation is sent to a
            language model, which is run by someone else. An uploaded
            screenshot is sent the same way, and a screenshot usually carries
            more than the words: names, photos and times. Crop it, or type the
            messages out, if any of that should stay private.
          </p>
        </footer>
      </div>
    </div>
  );
}
