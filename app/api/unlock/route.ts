import { cookies } from "next/headers";

import { GATE_COOKIE, GATE_MAX_AGE, tokenFor, tokensMatch } from "@/lib/gate";

export async function POST(request: Request) {
  const passcode = process.env.SENTI_PASSCODE;

  if (!passcode) {
    return Response.json(
      { error: "No class code is configured on the server." },
      { status: 503 },
    );
  }

  let submitted: unknown;
  try {
    ({ passcode: submitted } = await request.json());
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof submitted !== "string" || submitted.length === 0) {
    return Response.json({ error: "Enter the class code." }, { status: 400 });
  }

  const expected = await tokenFor(passcode);
  const offered = await tokenFor(submitted);

  if (!tokensMatch(offered, expected)) {
    return Response.json({ error: "That code did not match." }, { status: 401 });
  }

  (await cookies()).set(GATE_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_MAX_AGE,
  });

  return Response.json({ ok: true });
}
