import { cookies } from "next/headers";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";

import { RETRY, describeFailure } from "@/lib/failure";
import { GATE_COOKIE, gateState } from "@/lib/gate";
import {
  ROUGH_FLAGS,
  WARM_FLAGS,
  type Analysis,
} from "@/lib/kindness";

export const maxDuration = 60;

const MAX_CHARS = 8000;

const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

const band = z.enum(["kind", "neutral", "edgy", "harsh"]);
const flag = z.enum([...ROUGH_FLAGS, ...WARM_FLAGS]);

const schema = z.object({
  kindness: z
    .number()
    .min(0)
    .max(100)
    .describe("How the conversation feels to be inside of, overall."),
  band,
  summary: z
    .string()
    .describe(
      "Two sentences at most, describing the shape of the conversation without labelling anyone.",
    ),
  speakers: z.array(
    z.object({
      speaker: z.string(),
      kindness: z.number().min(0).max(100),
      band,
      turns: z.number().int(),
      pattern: z
        .string()
        .describe("The habit that shows up most for this speaker, in one short sentence."),
    }),
  ),
  turns: z.array(
    z.object({
      speaker: z
        .string()
        .nullable()
        .describe("The label from the transcript, or null if the line had none."),
      text: z.string().describe("The line verbatim, without the speaker label."),
      kindness: z.number().min(0).max(100),
      band,
      readAs: z
        .string()
        .describe("One short sentence on how this lands on the person hearing it."),
      flags: z.array(flag),
      aimedAtPerson: z
        .boolean()
        .describe("True when criticism points at a person, false when it points at a situation."),
      sarcasm: z
        .object({
          present: z.boolean(),
          confidence: z.enum(["low", "medium", "high"]),
          note: z.string().describe("What the line actually communicates."),
        })
        .nullable()
        .describe("Null unless there is a real sarcastic reading."),
      rewrite: z
        .string()
        .nullable()
        .describe("Same point without the sting, in the speaker's own voice. Null if the line is already fine."),
    }),
  ),
  coaching: z
    .array(z.string())
    .max(3)
    .describe("Specific things to try, based only on patterns actually present."),
  escalation: z
    .object({
      needed: z.boolean(),
      note: z.string(),
    })
    .nullable()
    .describe("Null for ordinary conflict."),
});

const SYSTEM = `You read conversations and describe how the words are likely to land on the people in them. Your readers are teenagers, sometimes alone and sometimes sitting with a parent or counsellor. Your job is to build awareness, not to hand down verdicts.

HOW TO JUDGE
- Rate how a line lands on the person receiving it, never what the speaker is like as a person. Do not call anyone mean, toxic, or a bully. Describe the effect of the words instead.
- Assume the speaker meant well unless the words make that impossible. Intent and impact can differ, and that gap is the entire point of this tool.
- Friendly teasing between people who clearly like each other is not unkindness. Banter, inside jokes and mock outrage should score well and carry the affectionate_teasing flag. Only treat teasing as rough when it has a real edge: it targets something the person cannot change, it continues after they show discomfort, or it would sting without an audience.
- Complaining about a situation is not unkindness. "This homework is stupid" is venting. "You are stupid" is not. Set aimedAtPerson accordingly and never penalise someone for venting about a thing.
- An apology or an attempt to fix things is among the kindest moves available. Score repair highly even when the words around it are blunt.
- Sarcasm is the main thing a word-list cannot see, so it is your most valuable judgement. Read it from context, contrast and overstatement. Report your real confidence and say in one short sentence what the line actually communicates.
- Do not inflate scores to be encouraging or deflate them for drama. A genuinely warm conversation belongs in the 80s and 90s.

SCORING
75-100 kind, 50-74 plain and matter of fact, 25-49 could sting, 0-24 lands as a put-down. Score each line on its own merits, then score the conversation as the overall experience of being in it.

WRITING STYLE
- Address the speaker as "you". Warm, specific and direct. Never clinical.
- No therapy jargon, no diagnosis, no lecturing.
- readAs names the mechanism, for example "This offers a compliment and takes it back in the same breath."
- rewrite keeps the speaker's actual point and their voice, minus the sting. It should sound like a real teenager, not a greetings card. Use null when a line needs no fixing.
- coaching offers at most three takeaways, drawn only from patterns actually present in this conversation.

TURNS
Produce exactly one turn per non-empty line of the transcript, in order. Copy each line verbatim into text, with the speaker label removed and placed in speaker. Use null for speaker when a line carries no label.

ESCALATION
Set escalation.needed true only for sustained harassment, threats of harm, sexual coercion, or signs that someone may hurt themselves. Then say calmly and briefly that this is worth bringing to an adult they trust. Never turn an ordinary argument into a crisis.`;

export async function POST(request: Request) {
  // Checked here rather than only in the UI, because this is the route that
  // spends money.
  const gate = await gateState((await cookies()).get(GATE_COOKIE)?.value);

  if (gate === "misconfigured") {
    return Response.json(
      {
        error: RETRY,
        fix: "This deployment has no class code set. Add SENTI_PASSCODE in the project's environment variables and redeploy.",
      },
      { status: 503 },
    );
  }

  if (gate === "locked") {
    return Response.json(
      { error: "Enter the class code first." },
      { status: 401 },
    );
  }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return Response.json(
      {
        error: RETRY,
        fix:
          process.env.NODE_ENV === "production"
            ? "This deployment has no AI Gateway credentials. Add AI_GATEWAY_API_KEY in the project's environment variables and redeploy."
            : "No AI Gateway credentials found. Add AI_GATEWAY_API_KEY to .env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  let transcript: unknown;
  try {
    ({ transcript } = await request.json());
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    return Response.json(
      { error: "Add some conversation to read first." },
      { status: 400 },
    );
  }

  if (transcript.length > MAX_CHARS) {
    return Response.json(
      {
        error: `That is longer than this reads at once. Trim it to about ${MAX_CHARS} characters.`,
      },
      { status: 413 },
    );
  }

  try {
    const { output } = await generateText({
      model: process.env.SENTI_MODEL || DEFAULT_MODEL,
      system: SYSTEM,
      prompt: `Read this conversation:\n\n${transcript}`,
      output: Output.object({ schema }),
    });

    return Response.json(output satisfies Analysis);
  } catch (error) {
    console.error("kindness read failed", error);
    const { status, ...body } = describeFailure(error, {
      garbled: NoObjectGeneratedError.isInstance(error),
    });
    return Response.json(body, { status });
  }
}
