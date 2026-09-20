export type Sample = {
  id: string;
  label: string;
  hint: string;
  dialogue: string;
};

export const SAMPLES: Sample[] = [
  {
    id: "pileon",
    label: "Group Chat Pile-On",
    hint: "Sarcasm dressed up as compliments",
    dialogue: `Maya: did everyone see Jordan's presentation today
Tyler: oh it was unforgettable
Maya: truly a bold choice to read straight off the slides for nine minutes
Tyler: no no it was great. really engaging. i learned so much
Jordan: i know it wasn't good, i had one night to put it together
Maya: nobody said it was bad Jordan
Tyler: we said it was historically bad
Maya: anyway some of us are getting food after, we'll sort out the list later
Jordan: am i on that list
Tyler: we'll let you know`,
  },
  {
    id: "repair",
    label: "Making It Right",
    hint: "What repair actually sounds like",
    dialogue: `Sam: hey. i've been thinking about what i said at lunch and it was out of line
Devon: yeah it kind of stung honestly
Sam: i know. i was annoyed about something else and i took it out on you, which wasn't fair
Devon: i appreciate you saying that, i wasn't sure you even noticed
Sam: i noticed. i've felt bad about it all afternoon
Devon: for what it's worth i wasn't ignoring your message this morning, my phone died
Sam: that makes sense. i jumped to a conclusion there too
Devon: we're good. thanks for bringing it up instead of letting it sit
Sam: always. tell me next time if i do it again`,
  },
  {
    id: "teasing",
    label: "Just Joking?",
    hint: "Banter that tips over mid-conversation",
    dialogue: `Priya: ok who let Alex pick the playlist again
Alex: my playlist is objectively elite and you are all wrong
Priya: it's four hours of the same song with different intros
Alex: that is called a cohesive artistic vision
Priya: it's called having no personality
Alex: ok
Priya: wait i'm kidding obviously
Alex: no you're good, it's fine
Priya: you went quiet though
Alex: i said it's fine`,
  },
];
