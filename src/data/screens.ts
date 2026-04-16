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
  bgMusic?: string; // optional ambient underscore in /public/music/
  show: string;
  audio: string; // path to VO clip in /public/vo/
  bg: string; // path to set background in /public/sets/
  captions: string[];
  ui: UIType;
  uiConfig?: Record<string, unknown>;
  duration?: number; // override auto-detection from audio
  uiRevealAt?: number; // seconds into audio when UI should appear
  imageAnimation?: "pan-left" | "pan-right" | "zoom-in" | "zoom-out" | "pan-slow";
  uiLayout?: "left" | "right" | "center";
  mediaPosition?: string; // object-position string defining crop/focus
  hideTvFrame?: boolean; // when true, zoom past TV frame bezel
}

/**
 * uiRevealAt Timing Rationale (emotional arc aligned):
 *
 * - 0-1s: Instant reveal for pure UI screens (intro-instructions)
 * - 1-2s: Quick reveal after short setup (shark-reason follow-up)
 * - 2.5-3.5s: Standard reveal after VO establishes context (feud questions)
 * - 4-5s: Dramatic reveal after longer VO builds tension (bachelor, shark-invest)
 * - 5-6s: Extended reveal for peak emotional moments (maury confession, commercial-break)
 *
 * Fatigue danger zones (low engagement risk):
 * - intro-instructions: No audio breaks TV conceit - NEEDS VO GENERATION
 * - commercial-why: Second consecutive text prompt - consider merging
 * - shark-reason: Short follow-up after binary choice - NEEDS REACTION AUDIO
 *
 * Engagement peaks (high intensity):
 * - gmn-feud-kickoff (4.8s): Long comedic setup needs full delivery
 * - bachelor-limo (4.0s): Vulnerability moment needs breathing room
 * - shark-invest (5.5s): High stakes pitch needs full tension build
 * - maury (6.0s): Catharsis peak - longest reveal for emotional weight
 */

export const screens: Screen[] = [
  // ── SCREEN 0: RETRO TV INTRO ──
  {
    id: "intro-tv",
    bgMusic: "/music/8100a50de29c7f76046522d39513-orig.wav",
    show: "Good Morning Nikhil",
    audio: "/vo/02-relationship.mp3?v=2",
    bg: "/sets/intro-retro-flat.webp",
    uiLayout: "center",
    mediaPosition: "center center",
    captions: [
      'STEVE (V.O.): "Player 1... how do you know Nikhil?"'
    ],
    ui: "relationship-picker",
    uiConfig: {
      options: [
        "Family",
        "Friend",
        "Classmate",
        "Colleague",
        "Manager",
        "Other",
      ],
      showAnonymousToggle: true,
    },
    uiRevealAt: 1.0,
  },

  // ── SCREEN 0.5: INSTRUCTIONS ON TV ──
  {
    id: "intro-instructions",
    bgMusic: "/music/8100a50de29c7f76046522d39513-orig.wav",
    show: "Good Morning Nikhil",
    audio: "/vo/01-welcome.mp3?v=2",
    bg: "/sets/intro-retro-flat.webp",
    duration: 0.1, // Instantly resolves audio hook
    uiLayout: "center",
    captions: [],
    ui: "continue-button",
    uiConfig: {
      prompt: "You'll flip through 7 quick TV-themed segments about Nikhil — each one takes about 30 seconds. Type whatever comes to mind.",
      label: "Start Testing →",
    },
    uiRevealAt: 0,
  },

  // ── SCREEN 1: GMN & FEUD KICKOFF ──
  {
    id: "gmn-feud-kickoff",
    bgMusic: "/music/8100a50de29c7f76046522d39513-orig.wav",
    show: "Good Morning Nikhil",
    audio: "/vo/00-cold-open.mp3?v=2",
    bg: "/sets/crowd-pan.webp",
    imageAnimation: "pan-right",
    uiLayout: "right",
    captions: [
      'STEVE: "Welcome to Good Morning Nikhil. All right, final round! We got the Nikhil family versus Jeff Goldblum. Name something you can do on the computer."',
      'JEFF: "Ahhhh… well I can tell you what you can do with a computer, Steve... you can suck on the mouse like a giant, pacifier."',
      'STEVE: "Wrong again! Let\'s kick it over to our VIP tester."'
    ],
    ui: "start-button",
    uiConfig: {
      label: "Take Control",
    },
    uiRevealAt: 4.8,
  },

  // ── SCREEN 3A: FAMILY FEUD — TOP 3 ──
  {
    id: "feud-top3",
    show: "Family Feud",
    audio: "/vo/03a-feud-top3.mp3?v=2",
    bg: "/sets/feud-board.webp",
    imageAnimation: "zoom-in",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "We surveyed the deepest darkest recesses of Nikhil\'s hopes and fears. Top three answers on the board. Give me three adjectives or short phrases that describe Nikhil."'
    ],
    ui: "three-text",
    uiConfig: {
      prompt: "Three words that come to YOUR mind about Nikhil.",
      placeholder: ["Answer #1", "Answer #2", "Answer #3"],
    },
    uiRevealAt: 3.5,
  },

  // ── SCREEN 3B: FEUD — STRONGEST ──
  {
    id: "feud-strongest",
    show: "Family Feud",
    audio: "/vo/03b-feud-strongest.mp3?v=2",
    bg: "/sets/feud-board.webp",
    imageAnimation: "pan-slow",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'JEFF: "Show me \'handsome\'."',
      'STEVE: "Wrong game, Jeff. Which one feels strongest, and why?"'
    ],
    ui: "text-area",
    uiConfig: {
      prompt: "Tell us which one feels most true and why.",
      placeholder: "Which of your 3 answers feels most true, and why?",
    },
    uiRevealAt: 3.5,
  },

  // ── SCREEN 3C: FEUD — TRADEMARK ──
  {
    id: "feud-trademark",
    show: "Family Feud",
    audio: "/vo/03c-feud-trademark.mp3?v=2",
    bg: "/sets/feud-board.webp",
    imageAnimation: "zoom-out",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'JEFF: "Name a thing he does so often it should come with theme music."',
      'STEVE: "That is actually a good one Jeff."'
    ],
    ui: "short-text",
    uiConfig: {
      prompt: "Say the trademark line.",
      placeholder: "Name a Nikhil trademark...",
    },
    uiRevealAt: 4.0,
  },

  // ── SCREEN 4A: COMMERCIAL BREAK ──
  {
    id: "commercial-break",
    bgMusic: "/music/Standard_Operating_Failure.mp3",
    show: "Commercial Break",
    audio: "/vo/04a-sponsor.mp3?v=2",
    bg: "/sets/sponsor-pedestal.webp",
    imageAnimation: "zoom-in",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "This episode of Nikhil is brought to you by…"',
      'JEFF: "A premium blend of polish, intensity, and lightly weaponized seduction just like someone I know."'
    ],
    ui: "short-text",
    uiConfig: {
      prompt: "What company, product, vibe, aesthetic, or brand sponsors Nikhil?",
      placeholder: "Brand, Vibe, or Product..."
    },
    uiRevealAt: 5.0,
  },

  // ── SCREEN 4B: WHY THAT BRAND ──
  {
    id: "commercial-why",
    bgMusic: "/music/Standard_Operating_Failure.mp3",
    show: "Commercial Break",
    audio: "/vo/04b-sponsor-why.mp3?v=2",
    bg: "/sets/sponsor-pedestal.webp",
    imageAnimation: "pan-slow",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "And why?"',
      'JEFF: "We’re all just shadows and dust Steve."'
    ],
    ui: "text-area",
    uiConfig: {
      prompt: "Why does that feel on-brand?",
      placeholder: "Tell us why..."
    },
    uiRevealAt: 2.5,
  },

  // ── SCREEN 5A: BACHELOR — ROSES ──
  {
    id: "bachelor-roses",
    bgMusic: "/music/the_bachelor_theme.mp3",
    show: "The Bachelor",
    audio: "/vo/05a-bachelor-roses.mp3?v=2",
    bg: "/sets/bachelor-mansion.webp",
    imageAnimation: "zoom-in",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "Ladies, you know what time it is. It’s the rose ceremony, and one of you is going home tonight. Three roses. One quality goes home."'
    ],
    ui: "multi-select",
    uiConfig: {
      options: [
        "Already Has Notes",
        "Questioned The Premise",
        "Genuinely Very Earnest",
        "Most Serious Unserious",
        "Needs It Perfect",
        "Cares Too Much",
        "Makes Complex Things Clear",
        "Intense Presence",
      ],
      maxSelect: 3,
      label: "Give 3 roses to Nikhil's strongest qualities",
    },
    uiRevealAt: 4.5,
  },

  // ── SCREEN 5B: BACHELOR — ELIMINATION ──
  {
    id: "bachelor-eliminate",
    bgMusic: "/music/the_bachelor_theme.mp3",
    show: "The Bachelor",
    audio: "/vo/05b-bachelor-eliminate.mp3?v=2",
    bg: "/sets/bachelor-mansion.webp",
    imageAnimation: "zoom-out",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'JEFF: "Every board has one weak square."',
      'STEVE: "This ain’t no board, Jeff. Send one quality home."'
    ],
    ui: "single-select",
    uiConfig: {
      options: [
        "Already Has Notes",
        "Questioned The Premise",
        "Genuinely Very Earnest",
        "Most Serious Unserious",
        "Needs It Perfect",
        "Cares Too Much",
        "Makes Complex Things Clear",
        "Intense Presence",
      ],
      label: "Which quality do you notice least?",
    },
    uiRevealAt: 3.5,
  },

  // ── SCREEN 5C: BACHELOR — LIMO ──
  {
    id: "bachelor-limo",
    bgMusic: "/music/the_bachelor_theme.mp3",
    show: "The Bachelor",
    audio: "/vo/05c-bachelor-limo.mp3?v=2",
    bg: "/sets/limo-interior.webp",
    imageAnimation: "pan-left",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "In the limo ride home…"',
      'JEFF: "On her way to the set of 90-Day Fiancé. Say Stevie isn’t that where - "',
      'STEVE: "Complete the sentence."'
    ],
    ui: "mad-lib",
    uiConfig: {
      prompt: "Finish the limo-exit sentence.",
      stem: "I never stood a chance because Nikhil always",
      placeholder: "...",
    },
    uiRevealAt: 4.0,
  },

  // ── SCREEN 6A: SHARK TANK — IN OR OUT ──
  {
    id: "shark-invest",
    bgMusic: "/music/The_Unspoken_Hour.mp3",
    show: "Shark Tank",
    audio: "/vo/06a-shark.mp3?v=2",
    bg: "/sets/shark-warehouse.webp",
    imageAnimation: "zoom-in",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "Sharks, Nikhil just pitched his brain for 100% of your life savings. Are you in or out?"',
      'JEFF: "You know I’ll just wait until Aunt Demequa blows it, and then it’ll go back to me and I’ll steal the round."',
      'STEVE: "Who exactly are you playing against? DO you know where you are?"'
    ],
    ui: "invest-or-pass",
    uiRevealAt: 5.5,
  },

  // ── SCREEN 6B/6C: SHARK TANK — FOLLOW-UP ──
  {
    id: "shark-reason",
    bgMusic: "/music/The_Unspoken_Hour.mp3",
    show: "Shark Tank",
    audio: "/vo/06b-shark-reason.mp3?v=2",
    bg: "/sets/shark-warehouse.webp",
    imageAnimation: "pan-slow",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "Finish the sentence."'
    ],
    ui: "short-text",
    uiConfig: {
      prompt: "Give one strength and one weakness.",
      placeholder: "Because...",
    },
    uiRevealAt: 1.5,
  },

  // ── SCREEN 7: SURVIVOR ──
  {
    id: "survivor",
    bgMusic: "/music/Tide_of_the_Bone.mp3",
    show: "Survivor",
    audio: "/vo/07-survivor.mp3?v=2",
    bg: "/sets/tribal-council.webp",
    imageAnimation: "zoom-in",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "Tribal council. Confessional booth. Just you and the camera."',
      'JEFF: (Whispering) "So this is… Fast Money in the woods?"',
      'STEVE: (Whispering back, firmly) "No. This is the honest part."'
    ],
    ui: "long-text-with-audio",
    uiConfig: {
      prompt: "Final words for the tribe.",
      maxSeconds: 15,
    },
    uiRevealAt: 4.0,
  },

  // ── SCREEN 8: MAURY ──
  {
    id: "maury",
    bgMusic: "/music/The_Last_Question.mp3",
    show: "Maury",
    audio: "/vo/08-maury.mp3?v=2",
    bg: "/sets/maury-studio.webp",
    imageAnimation: "pan-right",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "No, Jeff. I can’t do it."',
      'JEFF: "You have to read it, Steve. That’s the job. That’s why they hire you."',
      'STEVE: "I’m not even going to look at the board. And the envelope goes to..."'
    ],
    ui: "two-text",
    uiConfig: {
      prompt: "The confession.",
      labels: [
        "Nikhil projects that he is...",
        "But he actually comes across as...",
      ],
    },
    uiRevealAt: 6.0,
  },

  // ── SCREEN 9: PRODUCER'S NOTES ──
  {
    id: "producer-notes",
    show: "Control Room",
    audio: "/vo/09-producer.mp3?v=2",
    bg: "/sets/control-room.webp",
    imageAnimation: "zoom-in",
    uiLayout: "right",
    mediaPosition: "left center",
    hideTvFrame: true,
    captions: [
      'STEVE: "Final note from the control room."',
      'JEFF: "Fast Money?"',
      'STEVE: "No. That’s a wrap."'
    ],
    ui: "text-area",
    uiConfig: {
      prompt: "Director's notes.",
      placeholder:
        "What should Nikhil do more of, less of, or more consistently?",
    },
    uiRevealAt: 3.0,
  },

  // ── SCREEN 10: CREDITS ──
  {
    id: "credits",
    show: "Credits",
    audio: "/vo/10-credits.mp3?v=2",
    bg: "/sets/credits-bg.webp",
    imageAnimation: "zoom-out",
    uiLayout: "center",
    mediaPosition: "center center",
    hideTvFrame: true,
    captions: [
      'STEVE: "That’s a wrap."',
      'JEFF: "Did I win?"',
      'STEVE: "No."',
      'JEFF: "Did I remain champion?"',
      'STEVE: "…somehow, yes."'
    ],
    ui: "none",
    uiRevealAt: 4.5,
  },

  // ── SCREEN 11: STINGER ──
  {
    id: "post-credits",
    show: "Post-Credits",
    audio: "/vo/11-post-credits.mp3?v=2",
    bg: "/sets/credits-bg.webp",
    uiLayout: "center",
    mediaPosition: "center center",
    hideTvFrame: true,
    captions: [
      'STEVE: (Disembodied voice) "All right, Jeff. Last chance. Name something you can do on a computer."',
      'JEFF: "Ahhh.., you can shove it up your"'
    ],
    ui: "submit-button",
    uiRevealAt: 4.0,
  },
];
