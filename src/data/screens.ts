export type UIType =
  | "none"
  | "start-button"
  | "continue-button"
  | "relationship-picker"
  | "three-text"
  | "text-area"
  | "short-text"
  | "multi-select"
  | "single-select"
  | "mad-lib"
  | "invest-or-pass"
  | "long-text-with-audio"
  | "two-text"
  | "submit-button";

export interface Screen {
  id: string;
  show: string;
  showEmoji: string;
  audio: string; // path to VO clip in /public/vo/
  bg: string; // path to set background in /public/sets/
  captions: string[];
  ui: UIType;
  uiConfig?: Record<string, unknown>;
  duration?: number; // override auto-detection from audio
}

export const screens: Screen[] = [
  // ── SCREEN 0: COLD OPEN ──
  {
    id: "cold-open",
    show: "Cold Open",
    showEmoji: "🎬",
    audio: "/vo/00-cold-open.mp3",
    bg: "/sets/cold-open-glitch.png",
    captions: [
      'STEVE: "All right, final round! We got the Nikhil family versus Jeff Goldblum, our returning champion."',
      'JEFF: "Ahhhh… well I can tell you what you can do with a computer, Steve..."',
      'STEVE: "Oh my God. Today, we are here to answer one question: how does Nikhil really come across?"',
      'JEFF: "Survey says… inevitable, unknowable, and lightly caffeinated."',
      'STEVE: "Hit the music."',
    ],
    ui: "start-button",
  },

  // ── SCREEN 1: WELCOME ──
  {
    id: "welcome",
    show: "Welcome",
    showEmoji: "☀️",
    audio: "/vo/01-welcome.mp3",
    bg: "/sets/morning-desk.png",
    captions: [
      'STEVE: "Welcome to Good Morning, Nikhil. You\'re about to flip through a few very normal television segments."',
      'JEFF: "Oh Stevie, I thought of something else you can do with a computer."',
      'STEVE: "Oh God. No. Lord, no."',
    ],
    ui: "continue-button",
  },

  // ── SCREEN 2: WHO ARE YOU TO NIKHIL? ──
  {
    id: "relationship",
    show: "Meet Our Audience",
    showEmoji: "👋",
    audio: "/vo/02-relationship.mp3",
    bg: "/sets/morning-desk.png",
    captions: [
      'STEVE: "First things first. How do you know Nikhil?"',
      'JEFF: "Family, foe, witness, or lover."',
    ],
    ui: "relationship-picker",
    uiConfig: {
      options: [
        "Close friend",
        "Family member",
        "Classmate / colleague",
        "Professional contact",
        "Other",
      ],
      showAnonymousToggle: true,
    },
  },

  // ── SCREEN 3A: FAMILY FEUD — TOP 3 ──
  {
    id: "feud-top3",
    show: "Family Feud",
    showEmoji: "🎯",
    audio: "/vo/03a-feud-top3.mp3",
    bg: "/sets/feud-board.png",
    captions: [
      'STEVE: "Top three answers on the board. Give me three adjectives or short phrases that describe Nikhil."',
    ],
    ui: "three-text",
    uiConfig: {
      placeholder: ["Answer #1", "Answer #2", "Answer #3"],
    },
  },

  // ── SCREEN 3B: FEUD — STRONGEST ──
  {
    id: "feud-strongest",
    show: "Family Feud",
    showEmoji: "🎯",
    audio: "/vo/03b-feud-strongest.mp3",
    bg: "/sets/feud-board.png",
    captions: [
      'JEFF: "Show me \'handsome\'."',
      'STEVE: "Wrong game, Jeff. Which one feels strongest, and why?"',
    ],
    ui: "text-area",
    uiConfig: {
      placeholder: "Which of your 3 answers feels most true, and why?",
    },
  },

  // ── SCREEN 3C: FEUD — TRADEMARK ──
  {
    id: "feud-trademark",
    show: "Family Feud",
    showEmoji: "🎯",
    audio: "/vo/03c-feud-trademark.mp3",
    bg: "/sets/feud-board.png",
    captions: [
      'JEFF: "Name a thing he does so often it should come with theme music."',
      'STEVE: "That is actually a good one Jeff."',
    ],
    ui: "short-text",
    uiConfig: {
      placeholder: "Name a Nikhil trademark...",
    },
  },

  // ── SCREEN 4A: SPONSORED BY ──
  {
    id: "sponsor-brand",
    show: "Commercial Break",
    showEmoji: "📺",
    audio: "/vo/04a-sponsor.mp3",
    bg: "/sets/sponsor-pedestal.png",
    captions: [
      'STEVE: "This episode of Nikhil is brought to you by…"',
      'JEFF: "A premium blend of polish, intensity, and lightly weaponized seduction."',
    ],
    ui: "short-text",
    uiConfig: {
      placeholder: "What company, product, vibe, aesthetic, or brand...",
    },
  },

  // ── SCREEN 4B: WHY THAT BRAND ──
  {
    id: "sponsor-why",
    show: "Commercial Break",
    showEmoji: "📺",
    audio: "/vo/04b-sponsor-why.mp3",
    bg: "/sets/sponsor-pedestal.png",
    captions: [
      'STEVE: "And why?"',
      'JEFF: "We\'re all just shadows and dust Steve."',
    ],
    ui: "text-area",
    uiConfig: {
      placeholder: "Why does that feel on-brand?",
    },
  },

  // ── SCREEN 5A: BACHELOR — ROSES ──
  {
    id: "bachelor-roses",
    show: "The Bachelor",
    showEmoji: "🌹",
    audio: "/vo/05a-bachelor-roses.mp3",
    bg: "/sets/bachelor-mansion.png",
    captions: [
      'STEVE: "It\'s the rose ceremony, and one of you is going home tonight. Three roses. One quality goes home."',
    ],
    ui: "multi-select",
    uiConfig: {
      options: [
        "Sharp mind",
        "Warm heart",
        "Gets things done",
        "Makes people laugh",
        "Tells it straight",
        "Sees what others miss",
        "Stays calm under fire",
        "Makes everyone feel included",
      ],
      maxSelect: 3,
      label: "Give 3 roses",
    },
  },

  // ── SCREEN 5B: BACHELOR — ELIMINATION ──
  {
    id: "bachelor-eliminate",
    show: "The Bachelor",
    showEmoji: "🌹",
    audio: "/vo/05b-bachelor-eliminate.mp3",
    bg: "/sets/bachelor-mansion.png",
    captions: [
      'JEFF: "Every board has one weak square."',
      'STEVE: "This ain\'t no board, Jeff. Send one quality home."',
    ],
    ui: "single-select",
    uiConfig: {
      options: [
        "Sharp mind",
        "Warm heart",
        "Gets things done",
        "Makes people laugh",
        "Tells it straight",
        "Sees what others miss",
        "Stays calm under fire",
        "Makes everyone feel included",
      ],
      label: "Send one home",
    },
  },

  // ── SCREEN 5C: BACHELOR — LIMO ──
  {
    id: "bachelor-limo",
    show: "The Bachelor",
    showEmoji: "🌹",
    audio: "/vo/05c-bachelor-limo.mp3",
    bg: "/sets/limo-interior.png",
    captions: [
      'STEVE: "In the limo ride home…"',
      'JEFF: "On her way to the set of 90-Day Fiancé—"',
      'STEVE: "Complete the sentence."',
    ],
    ui: "mad-lib",
    uiConfig: {
      stem: "I never stood a chance because Nikhil always",
      placeholder: "...",
    },
  },

  // ── SCREEN 6A: SHARK TANK — IN OR OUT ──
  {
    id: "shark-invest",
    show: "Shark Tank",
    showEmoji: "🦈",
    audio: "/vo/06a-shark.mp3",
    bg: "/sets/shark-warehouse.png",
    captions: [
      'STEVE: "Shark, Nikhil just pitched his brain for 100% of your life savings. Are you in or out?"',
      'JEFF: "You know I\'ll just wait until Aunt Demequa blows it—"',
      'STEVE: "Do you know where you are."',
    ],
    ui: "invest-or-pass",
  },

  // ── SCREEN 6B: SHARK TANK — FOLLOW-UP ──
  {
    id: "shark-reason",
    show: "Shark Tank",
    showEmoji: "🦈",
    audio: "/vo/06b-shark-reason.mp3",
    bg: "/sets/shark-warehouse.png",
    captions: ['STEVE: "Finish the sentence."'],
    ui: "short-text",
    uiConfig: {
      // dynamically set based on invest/pass choice
      placeholder: "Because...",
    },
  },

  // ── SCREEN 7: SURVIVOR ──
  {
    id: "survivor",
    show: "Survivor",
    showEmoji: "🎙️",
    audio: "/vo/07-survivor.mp3",
    bg: "/sets/tribal-council.png",
    captions: [
      'STEVE: "Tribal council. Confessional booth. Just you and the camera."',
      'JEFF: (Whispering) "So this is… Fast Money in the woods?"',
      'STEVE: (Whispering) "No. This is the honest part."',
    ],
    ui: "long-text-with-audio",
    uiConfig: {
      prompt: "Here's what I've never told Nikhil...",
      showAudioRecord: true,
    },
  },

  // ── SCREEN 8: MAURY ──
  {
    id: "maury",
    show: "Maury",
    showEmoji: "📋",
    audio: "/vo/08-maury.mp3",
    bg: "/sets/maury-studio.png",
    captions: [
      'JEFF: "At last. Something you can do with a computer, Steve…"',
      'STEVE: "No, Jeff. I can\'t do it."',
      'JEFF: "You have to read it, Steve. That\'s the job."',
      'STEVE: "I\'m not even going to look at the board. And the envelope goes to..."',
    ],
    ui: "two-text",
    uiConfig: {
      labels: [
        "Nikhil projects that he is...",
        "But he actually comes across as...",
      ],
    },
  },

  // ── SCREEN 9: PRODUCER'S NOTES ──
  {
    id: "producer-notes",
    show: "Control Room",
    showEmoji: "🎬",
    audio: "/vo/09-producer.mp3",
    bg: "/sets/control-room.png",
    captions: [
      'STEVE: "Final note from the control room."',
      'JEFF: "Fast Money?"',
      'STEVE: "No. Action step."',
    ],
    ui: "text-area",
    uiConfig: {
      placeholder:
        "If you could change one thing about how Nikhil operates — what gets cut and what replaces it?",
    },
  },

  // ── SCREEN 10: CREDITS ──
  {
    id: "credits",
    show: "Credits",
    showEmoji: "🎬",
    audio: "/vo/10-credits.mp3",
    bg: "/sets/credits-bg.png",
    captions: [
      'STEVE: "That\'s a wrap."',
      'JEFF: "Did I win?"',
      'STEVE: "No."',
      'JEFF: "Did I remain champion?"',
      'STEVE: "…somehow, yes."',
    ],
    ui: "submit-button",
  },
];
