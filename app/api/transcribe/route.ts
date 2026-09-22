import { cookies } from "next/headers";
import { generateText, Output } from "ai";
import { z } from "zod";

import { RETRY, describeFailure } from "@/lib/failure";
import { GATE_COOKIE, gateState } from "@/lib/gate";
import { modelId } from "@/lib/model";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/screenshot";

export const maxDuration = 60;

const schema = z.object({
  readable: z
    .boolean()
    .describe("False when this is not a conversation screenshot, or the text cannot be made out."),
  note: z
    .string()
    .describe("When readable is false, one short sentence saying what is wrong. Empty otherwise."),
  lines: z.array(
    z.object({
      side: z
        .enum(["you", "them"])
        .describe("Which side of the thread the bubble sits on."),
      text: z.string().describe("The message text, copied exactly."),
    }),
  ),
});

const SYSTEM = `You copy the text out of a screenshot of a messaging app so it can be read as a conversation. You are a transcriber, not an editor, and not a judge of what was said.

WHO SAID WHAT
- Messaging apps show the phone's owner on the right, usually in a coloured bubble (blue or green in iOS Messages). Label those "you".
- The other person sits on the left, usually in a grey bubble. Label those "them".
- Position and colour are the only reliable signals. Do not guess from the content of the messages.

COPY EXACTLY
- Reproduce each message verbatim: same wording, same spelling, same capitalisation, same missing punctuation. Typos and lowercase are evidence of tone, so preserve them.
- One entry per bubble, ordered top to bottom as they appear.
- Do not translate, summarise, correct, complete or clean up anything.
- Leave out a bubble only when it is cut off at the edge of the screen and its text genuinely cannot be read.

LEAVE OUT THE FURNITURE
Skip everything that is not a message: the contact name and photo in the header, timestamps, date separators, "Delivered" and "Read" receipts, typing indicators, reaction badges, the status bar, and the message input box at the bottom.

NAMES
Never put a person's name in the side field. The only permitted values are "you" and "them". Names that appear inside the body of a message stay there, because they are part of what was said.

NOT A CONVERSATION
If the image is not a screenshot of a messaging thread, or it is too blurry or too small to read, set readable to false, say so in one plain sentence in note, and return no lines.`;

export async function POST(request: Request) {
  // Same gate as the read itself: this route calls the model, so it spends.
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
    return Response.json({ error: "Enter the class code first." }, { status: 401 });
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

  let image: unknown;
  try {
    image = (await request.formData()).get("image");
  } catch {
    return Response.json({ error: "Expected an uploaded image." }, { status: 400 });
  }

  if (!(image instanceof File)) {
    return Response.json({ error: "No screenshot came through." }, { status: 400 });
  }

  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(image.type)) {
    return Response.json(
      { error: "That file is not an image senti can read. Use a PNG or JPEG screenshot." },
      { status: 415 },
    );
  }

  if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
    return Response.json(
      { error: "That image is too large to read. Crop it to just the conversation." },
      { status: 413 },
    );
  }

  try {
    // The bytes live in this request and nowhere else. Nothing is written to
    // disk, and the image is never sent on to the read itself, which only
    // ever sees the text below.
    const bytes = new Uint8Array(await image.arrayBuffer());

    const { output } = await generateText({
      model: modelId(),
      system: SYSTEM,
      output: Output.object({ schema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe the conversation in this screenshot." },
            { type: "image", image: bytes, mediaType: image.type },
          ],
        },
      ],
    });

    if (!output.readable || output.lines.length === 0) {
      return Response.json(
        {
          error:
            output.note?.trim() ||
            "That image does not look like a conversation. Try a screenshot of the thread itself.",
        },
        { status: 422 },
      );
    }

    const transcript = output.lines
      .map((line) => `${line.side === "you" ? "You" : "Them"}: ${line.text}`)
      .join("\n");

    return Response.json({ transcript });
  } catch (error) {
    console.error("screenshot transcription failed", error);
    const { status, ...body } = describeFailure(error);
    return Response.json(body, { status });
  }
}
