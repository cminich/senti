export type Sample = {
  id: string;
  label: string;
  hint: string;
  dialogue: string;
};

export const SAMPLES: Sample[] = [
  {
    id: "support",
    label: "Support Escalation",
    hint: "Tense, degrading",
    dialogue: `Customer: I have been waiting three days for a response on ticket 44120 and nobody bothered to follow up.
Agent: I am sorry about the delay. Let me pull up the ticket and see what happened.
Customer: This is the fourth time I have explained the problem. The nightly export fails every single run and it is breaking our billing.
Agent: I understand that is frustrating. I can see the escalation was never routed to the data team.
Customer: So it just sat there? That is unacceptable. We pay for premium support and the service has been terrible.
Agent: You are right to be upset, and I am escalating this to engineering right now at the highest priority.
Customer: I have heard that promise before and nothing changed. Honestly I regret renewing, the whole experience has been awful.
Agent: I hear you. I will personally own this until it is resolved and send an update within two hours.
Customer: Two hours. If I do not hear back I am filing a formal complaint with our account executive.
Agent: Understood. You will have a written fix plan today. I am sorry we let this get so bad.`,
  },
  {
    id: "standup",
    label: "Collaborative Standup",
    hint: "Upbeat, energised",
    dialogue: `Priya: Morning everyone. Great news to share, the caching rewrite landed last night and latency dropped forty percent.
Marcus: That is fantastic. I saw the dashboard this morning and the p95 curve looks beautiful.
Priya: Thanks. Huge credit to Dana for catching the invalidation bug before it ever shipped.
Dana: Happy to help. The new test harness made it easy to reproduce, which was a nice surprise.
Marcus: I am excited about the onboarding flow too. Three of the five screens are done and they feel great.
Dana: Agreed, the designs are lovely. I will pick up the remaining two today if nobody objects.
Priya: Perfect. Any blockers at all before we wrap?
Marcus: None from me, everything is running smoothly for once.
Dana: Same here. I love how clean the new component API turned out.
Priya: Wonderful. Excellent momentum team, let us keep it going.`,
  },
  {
    id: "contract",
    label: "Contract Negotiation",
    hint: "Measured, mixed",
    dialogue: `Vendor: Thanks for making time. I would like to walk the redlines section by section.
Client: Sounds good. We are mostly aligned, though the liability cap is still an open question.
Vendor: Understood. We cap at twelve months of fees, which is standard for a deal of this size.
Client: Our legal team pushed back on that. They would prefer eighteen months given the data we are handing over.
Vendor: That is a fair concern. I can take eighteen months back to my team if we hold payment terms at net thirty.
Client: Net thirty is tight but workable. The termination clause is the part I dislike.
Vendor: Which piece specifically?
Client: The ninety day notice window. Sixty would give us more flexibility if priorities shift.
Vendor: Sixty works on our side. Let me confirm the change with finance.
Client: Appreciate it. If we settle those two items I think we are close to signing.`,
  },
];
