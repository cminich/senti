import { cookies } from "next/headers";

import { GATE_COOKIE, gateState } from "@/lib/gate";

import Dashboard from "./dashboard";
import PasscodeGate from "./passcode-gate";

export default async function Home() {
  const gate = await gateState((await cookies()).get(GATE_COOKIE)?.value);

  if (gate === "open" || gate === "unlocked") {
    return <Dashboard />;
  }

  return <PasscodeGate misconfigured={gate === "misconfigured"} />;
}
