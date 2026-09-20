"use client";

import { useMemo, useState } from "react";
import {
  AlignLeft,
  AudioLines,
  Handshake,
  Headset,
  MessagesSquare,
  Minus,
  Quote,
  Scale,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import {
  analyzeDialogue,
  type Analysis,
  type Keyword,
  type Polarity,
  type Turn,
} from "@/lib/analyze";
import { SAMPLES } from "@/lib/samples";

const POLARITY_STYLES: Record<
  Polarity,
  {
    label: string;
    icon: LucideIcon;
    hex: string;
    badge: string;
    text: string;
    fill: string;
    rail: string;
  }
> = {
  positive: {
    label: "Positive",
    icon: TrendingUp,
    hex: "#10b981",
    badge:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25",
    text: "text-emerald-600 dark:text-emerald-400",
    fill: "bg-emerald-500",
    rail: "border-l-emerald-500",
  },
  neutral: {
    label: "Neutral",
    icon: Minus,
    hex: "#64748b",
    badge:
      "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/25",
    text: "text-slate-600 dark:text-slate-400",
    fill: "bg-slate-400",
    rail: "border-l-slate-300 dark:border-l-slate-600",
  },
  negative: {
    label: "Negative",
    icon: TrendingDown,
    hex: "#f43f5e",
    badge:
      "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/25",
    text: "text-rose-600 dark:text-rose-400",
    fill: "bg-rose-500",
    rail: "border-l-rose-500",
  },
};

const SAMPLE_ICONS: Record<string, LucideIcon> = {
  support: Headset,
  standup: UsersRound,
  contract: Handshake,
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

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

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

/** Point on the gauge circle, measured in degrees counter-clockwise from east. */
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

function clamp(score: number) {
  return Math.max(-100, Math.min(100, score));
}

/** -100 sits at 180°, 0 at the top, +100 at 0°. */
function angleFor(score: number) {
  return 90 - clamp(score) * 0.9;
}

function Gauge({ score, polarity }: { score: number; polarity: Polarity }) {
  const style = POLARITY_STYLES[polarity];

  return (
    <svg
      viewBox="0 0 280 172"
      role="img"
      aria-label={`Overall sentiment ${score} on a scale of -100 to 100. ${style.label}.`}
      className="w-full max-w-[300px]"
    >
      <defs>
        <linearGradient id="senti-gauge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#94a3b8" />
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
        d={arc(R, 90, angleFor(score))}
        fill="none"
        stroke={style.hex}
        strokeWidth={14}
        strokeLinecap="round"
      />

      {[-100, -50, 0, 50, 100].map((tick) => {
        const inner = polar(R - 17, angleFor(tick));
        const outer = polar(R - 10, angleFor(tick));
        return (
          <line
            key={tick}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            strokeWidth={tick === 0 ? 2 : 1}
            className="stroke-slate-300 dark:stroke-slate-700"
          />
        );
      })}

      <g
        className="transition-transform duration-700 ease-out"
        transform={`rotate(${clamp(score) * 0.9} ${CX} ${CY})`}
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
      <circle
        cx={CX}
        cy={CY}
        r={3}
        className="fill-white dark:fill-slate-900"
      />

      <text
        x={30}
        y={166}
        textAnchor="middle"
        className="fill-slate-400 text-[11px] tabular-nums"
      >
        -100
      </text>
      <text
        x={250}
        y={166}
        textAnchor="middle"
        className="fill-slate-400 text-[11px] tabular-nums"
      >
        +100
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

function PolarityBadge({
  polarity,
  size = "sm",
}: {
  polarity: Polarity;
  size?: "sm" | "lg";
}) {
  const style = POLARITY_STYLES[polarity];
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${style.badge} ${
        size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2 py-0.5 text-xs"
      }`}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3"} aria-hidden />
      {style.label}
    </span>
  );
}

function KeywordChip({ keyword }: { keyword: Keyword }) {
  const tone =
    keyword.score > 0
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs ${tone}`}
    >
      <span className="font-medium">{keyword.word}</span>
      {keyword.count > 1 && (
        <span className="opacity-60">×{keyword.count}</span>
      )}
      <span className="tabular-nums opacity-70">{signed(keyword.score)}</span>
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon className="size-4" aria-hidden />
        <span className="text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-50">
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {detail}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard sections                                                         */
/* -------------------------------------------------------------------------- */

function HeroCard({ analysis }: { analysis: Analysis }) {
  const { drivers } = analysis;

  return (
    <section className={`${CARD} flex flex-col items-center p-6`}>
      <h2 className="self-start text-sm font-semibold text-slate-900 dark:text-slate-100">
        Overall sentiment
      </h2>
      <p className="self-start text-xs text-slate-500 dark:text-slate-400">
        Length-weighted across {analysis.turns.length} turns
      </p>

      <div className="mt-2">
        <Gauge score={analysis.score} polarity={analysis.polarity} />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-5xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
          {signed(analysis.score)}
        </span>
        <PolarityBadge polarity={analysis.polarity} size="lg" />
      </div>

      {(drivers.positive.length > 0 || drivers.negative.length > 0) && (
        <div className="mt-6 w-full space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Key drivers
          </p>
          {(["positive", "negative"] as const).map((kind) =>
            drivers[kind].length > 0 ? (
              <div key={kind} className="flex flex-wrap gap-1.5">
                {drivers[kind].map((keyword) => (
                  <KeywordChip key={keyword.word} keyword={keyword} />
                ))}
              </div>
            ) : null,
          )}
        </div>
      )}
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
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Sentiment by speaker
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Average tone each participant brought to the conversation
      </p>

      {analysis.speakers.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          No speaker labels found. Prefix lines with a name — for example{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
            Customer:
          </code>{" "}
          — to see a per-speaker breakdown.
        </p>
      ) : (
        <ul className="mt-5 space-y-5">
          {analysis.speakers.map((speaker) => {
            const style = POLARITY_STYLES[speaker.polarity];
            const magnitude = Math.abs(speaker.score) / 2;

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
                      {speaker.turns} turns · {speaker.words} words ·{" "}
                      {speaker.split.positive}+ / {speaker.split.neutral}· /{" "}
                      {speaker.split.negative}−
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${style.text}`}
                  >
                    {signed(speaker.score)}
                  </span>
                  <PolarityBadge polarity={speaker.polarity} />
                </div>

                <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`absolute inset-y-0 rounded-full ${style.fill}`}
                    style={{
                      left: `${speaker.score >= 0 ? 50 : 50 - magnitude}%`,
                      width: `${Math.max(magnitude, 0.75)}%`,
                    }}
                  />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300 dark:bg-slate-600" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TurnRow({ turn, tone }: { turn: Turn; tone: string }) {
  const style = POLARITY_STYLES[turn.polarity];

  return (
    <li className={`border-l-2 py-4 pl-4 ${style.rail}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${tone}`}
          aria-hidden
        >
          {turn.speaker ? initials(turn.speaker) : turn.id + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {turn.speaker ?? `Line ${turn.id + 1}`}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${style.text}`}
            >
              {signed(turn.score)}
            </span>
            <span className="text-xs text-slate-400 tabular-nums dark:text-slate-500">
              lexicon {signed(turn.raw)} · {turn.words} words
            </span>
            <span className="ml-auto">
              <PolarityBadge polarity={turn.polarity} />
            </span>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {turn.text}
          </p>

          {turn.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {turn.keywords.map((keyword) => (
                <KeywordChip key={keyword.word} keyword={keyword} />
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

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

  const canAnalyze = text.trim().length > 0;

  function handleAnalyze() {
    if (!canAnalyze) return;
    setAnalysis(analyzeDialogue(text));
  }

  function handleClear() {
    setText("");
    setAnalysis(null);
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
              Conversational sentiment analysis, entirely in your browser
            </p>
          </div>
        </header>

        <section className={`${CARD} mt-8 p-6`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label
              htmlFor="dialogue"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Dialogue transcript
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              One turn per line, optionally prefixed with{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
                Speaker:
              </code>
            </span>
          </div>

          <textarea
            id="dialogue"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                handleAnalyze();
              }
            }}
            rows={10}
            spellCheck={false}
            placeholder={
              "Customer: The export has failed three nights in a row.\nAgent: I am sorry about that — let me take a look right now."
            }
            className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-600 dark:focus:ring-white/10"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Samples
            </span>
            {SAMPLES.map((sample) => {
              const Icon = SAMPLE_ICONS[sample.id] ?? MessagesSquare;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    setText(sample.dialogue);
                    setAnalysis(analyzeDialogue(sample.dialogue));
                  }}
                  title={sample.hint}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                >
                  <Icon className="size-4 text-slate-400" aria-hidden />
                  {sample.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Sparkles className="size-4" aria-hidden />
              Analyze Dialogue
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!text && !analysis}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Trash2 className="size-4" aria-hidden />
              Clear
            </button>
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
              ⌘↵ to analyze
            </span>
          </div>
        </section>

        {analysis === null ? (
          <section
            className={`${CARD} mt-6 flex flex-col items-center gap-2 border-dashed p-12 text-center`}
          >
            <Sparkles className="size-6 text-slate-300 dark:text-slate-700" aria-hidden />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No analysis yet
            </p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Paste a conversation above or load one of the samples to see turn
              by turn sentiment.
            </p>
          </section>
        ) : analysis.turns.length === 0 ? (
          <section className={`${CARD} mt-6 p-8 text-center`}>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nothing to analyze — add at least one line of dialogue.
            </p>
          </section>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={MessagesSquare}
                label="Turns"
                value={`${analysis.turns.length}`}
                detail={`${analysis.split.positive} pos · ${analysis.split.neutral} neu · ${analysis.split.negative} neg`}
              />
              <StatCard
                icon={UsersRound}
                label="Speakers"
                value={`${analysis.speakers.length || "—"}`}
                detail={
                  analysis.speakers.map((s) => s.speaker).join(", ") ||
                  "No labels detected"
                }
              />
              <StatCard
                icon={AlignLeft}
                label="Words"
                value={`${analysis.words}`}
                detail={`${Math.round(analysis.words / analysis.turns.length)} per turn`}
              />
              <StatCard
                icon={Scale}
                label="Lexicon net"
                value={signed(analysis.raw)}
                detail="Sum of AFINN word weights"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <HeroCard analysis={analysis} />
              </div>
              <div className="lg:col-span-3">
                <SpeakerCard analysis={analysis} tones={tones} />
              </div>
            </div>

            <section className={`${CARD} p-6`}>
              <div className="flex items-center gap-2">
                <Quote className="size-4 text-slate-400" aria-hidden />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Transcript breakdown
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every turn with its polarity and the words that moved the score
              </p>

              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {analysis.turns.map((turn) => (
                  <TurnRow
                    key={turn.id}
                    turn={turn}
                    tone={
                      (turn.speaker &&
                        tones.get(turn.speaker.toLowerCase())) ||
                      "bg-slate-400"
                    }
                  />
                ))}
              </ul>
            </section>
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-slate-400 dark:text-slate-600">
          Scored with the AFINN-165 lexicon via{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-900">
            sentiment
          </code>
          . Nothing leaves your browser.
        </footer>
      </div>
    </div>
  );
}
