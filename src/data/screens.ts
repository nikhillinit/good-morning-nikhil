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
  uiRevealAt?: number; // seconds into audio when UI should appear
  video?: string; // path to video in /public/videos/
}

export const screens: Screen[] = [
  // ── SCREEN 0: COLD OPEN ──
  {
    id: "cold-open",
    show: "Cold Open",
    showEmoji: "🎬",
    audio: "/vo/00-cold-open.mp3",
    bg: "/sets/cold-open-glitch.webp",
    captions: [
      'STEVE: "All right, cut the music! Listen up, focus-tester. The network is threatening to cancel \'Nikhil\' after this pilot."',
      'JEFF: "Another one bites the dust, Steve..."',
      'STEVE: "Not now, Jeff. This isn\'t just a show. This is my friend\'s life on the line. We need raw data to save his contract."',
      'JEFF: "Survey says… the pilot is an unwatchable vanity project."',
      'STEVE: "We just need honest answers to fix him. Hit the music, let\'s start the gauntlet."',
    ],
    ui: "start-button",
    uiRevealAt: 48.0,
  },

  // ── SCREEN 1: WELCOME ──
  {
    id: "welcome",
    show: "Welcome",
    showEmoji: "☀️",
    audio: "/vo/01-welcome.mp3",
    bg: "/sets/morning-desk.webp",
    captions: [
      'STEVE: "Welcome to Good Morning, Nikhil. You are about to be thrown into a barrage of very normal television segments."',
      'JEFF: "Oh Stevie, I thought of something else you can do with a computer."',
      'STEVE: "Stay focused! Your answers are the only thing keeping the network from pulling the plug. Let\'s go!"',
    ],
    ui: "continue-button",
    uiRevealAt: 12.4,
  },

  // ── SCREEN 2: WHO ARE YOU TO NIKHIL? ──
  {
    id: "relationship",
    show: "Meet Our Audience",
    showEmoji: "👋",
    audio: "/vo/02-relationship.mp3",
    bg: "/sets/morning-desk.webp",
    captions: [
      'STEVE: "First things first. We need a completely unbiased, third-party focus-tester. Wait... looking at this file..."',
      'STEVE: "You actually know Nikhil? Personally? Jeff, who booked this tester!?"',
      'JEFF: "Family, friend, collaborator... or maybe just a chaotic neutral observer?"',
      'STEVE: "...this is exactly what we need. A true intervention. How do you know him?"',
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
    uiRevealAt: 3.6,
  },

  // ── SCREEN 3A: FAMILY FEUD — TOP 3 ──
  {
    id: "feud-top3",
    show: "Family Feud",
    showEmoji: "🎯",
    audio: "/vo/03a-feud-top3.mp3",
    bg: "/sets/feud-board.webp",
    captions: [
      'STEVE: "All right, since you know him, skip the pleasantries. Three words. Fast TV! What comes to mind when you think of this man?"',
    ],
    ui: "three-text",
    uiConfig: {
      prompt: "Three words that come to YOUR mind about Nikhil.",
      placeholder: ["Answer #1", "Answer #2", "Answer #3"],
    },
    uiRevealAt: 5.0,
  },

  // ── SCREEN 3B: FEUD — STRONGEST ──
  {
    id: "feud-strongest",
    show: "Family Feud",
    showEmoji: "🎯",
    audio: "/vo/03b-feud-strongest.mp3",
    bg: "/sets/feud-board.webp",
    captions: [
      'JEFF: "Show me \'mildly neurotic\'!"',
      'STEVE: "Wrong game, Jeff. We need deep, uncomfortable truths. Which one of those three words feels the strongest, and why?"',
    ],
    ui: "text-area",
    uiConfig: {
      prompt: "Tell us which one feels most true and why.",
      placeholder: "Which of your 3 answers feels most true, and why?",
    },
    uiRevealAt: 1.2,
  },

  // ── SCREEN 3C: FEUD — TRADEMARK ──
  {
    id: "feud-trademark",
    show: "Family Feud",
    showEmoji: "🎯",
    audio: "/vo/03c-feud-trademark.mp3",
    bg: "/sets/feud-board.webp",
    captions: [
      'JEFF: "Name a thing he does so often it should come with theme music."',
      'STEVE: "That is actually a good one Jeff. Give us the trademark line so we know you\'re not a bot!"',
    ],
    ui: "short-text",
    uiConfig: {
      prompt: "Say the trademark line.",
      placeholder: "Name a Nikhil trademark...",
    },
    uiRevealAt: 5.2,
  },



  // ── SCREEN 5A: BACHELOR — ROSES ──
  {
    id: "bachelor-roses",
    show: "The Bachelor",
    showEmoji: "🌹",
    audio: "/vo/05a-bachelor-roses.mp3",
    bg: "/sets/bachelor-mansion.webp",
    captions: [
      'STEVE: "The network says his personality is too cluttered. We need to trim the fat. What are his actual redeeming qualities?"',
      'JEFF: "Can I just vote him off the island?"',
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
    uiRevealAt: 8,
  },

  // ── SCREEN 5B: BACHELOR — ELIMINATION ──
  {
    id: "bachelor-eliminate",
    show: "The Bachelor",
    showEmoji: "🌹",
    audio: "/vo/05b-bachelor-eliminate.mp3",
    bg: "/sets/bachelor-mansion.webp",
    captions: [
      'JEFF: "Every good protagonist needs a fatal flaw. What\'s his?"',
      'STEVE: "No, Jeff, we want to know what to cut. Which of these qualities is barely there? Be brutal. We need the data."',
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
    uiRevealAt: 2.4,
  },

  // ── SCREEN 5C: BACHELOR — LIMO ──
  {
    id: "bachelor-limo",
    show: "The Bachelor",
    showEmoji: "🌹",
    audio: "/vo/05c-bachelor-limo.mp3",
    bg: "/sets/limo-interior.webp",
    captions: [
      'STEVE: (Leaning into the limo) "It is over. Look at her crying back there. This trait is going home."',
      'JEFF: (Over earpiece) "I never stood a chance! He wouldn\'t let me shine!"',
      'STEVE: "You\'re in the car with her. Complete the sentence for us: why exactly did this trait get cut?"',
    ],
    ui: "mad-lib",
    uiConfig: {
      prompt: "Finish the limo-exit sentence.",
      stem: "I never stood a chance because Nikhil always",
      placeholder: "...",
    },
    uiRevealAt: 8.2,
  },

  // ── SCREEN 6: COMMERCIAL BREAK ──
  {
    id: "commercial-break",
    show: "Commercial Break",
    showEmoji: "📺",
    audio: "/vo/04a-sponsor.mp3",
    bg: "/sets/sponsor-pedestal.webp",
    captions: [
      'STEVE: "We need a breather. My producer phone is ringing... it\'s the network. They hate it. They absolutely hate it."',
      'JEFF: "Time for a word from our sponsor! A premium blend of polish, intensity, and accidental eye contact."',
      'STEVE: "Tester, we are drowning here. I need you to step up. Next round, we\'re dropping the games. It\'s just you and the truth."',
    ],
    ui: "continue-button",
    uiRevealAt: 4.1,
  },

  // ── SCREEN 6A: SHARK TANK — IN OR OUT ──
  {
    id: "shark-invest",
    show: "Shark Tank",
    showEmoji: "🦈",
    audio: "/vo/06a-shark.mp3",
    bg: "/sets/shark-warehouse.webp",
    captions: [
      'STEVE: "The executives are in the room. They\'re looking at the raw footage of his life. Are they investing in a season two, or are they out?"',
      'JEFF: "I\'m out immediately. Too much emotional liability."',
      'STEVE: "Nobody asked you, Jeff! Tester, you know him best. Make the call. Is he worth the investment?"',
    ],
    ui: "invest-or-pass",
    uiRevealAt: 16.4,
  },

  // ── SCREEN 6B: SHARK TANK — FOLLOW-UP ──
  {
    id: "shark-reason",
    show: "Shark Tank",
    showEmoji: "🦈",
    audio: "/vo/06b-shark-reason.mp3",
    bg: "/sets/shark-warehouse.webp",
    captions: [
      'STEVE: "You made your choice. Now you have to justify it to the board. Give me one core strength and one glaring weakness."',
    ],
    ui: "short-text",
    uiConfig: {
      prompt: "Give one strength and one weakness.",
      // dynamically set based on invest/pass choice
      placeholder: "Because...",
    },
    uiRevealAt: 1,
  },

  // ── SCREEN 8: MAURY ──
  {
    id: "maury",
    show: "Maury",
    showEmoji: "📋",
    audio: "/vo/08-maury.mp3",
    bg: "/sets/maury-studio.webp",
    captions: [
      'JEFF: "The polygraph determined... that was a lie!"',
      'STEVE: "Jeff, stop. We\'re dropping the acts. This isn\'t daytime TV anymore."',
      'JEFF: "You have to read the results, Steve. The dichotomy of man!"',
      'STEVE: "I can\'t do it. Tester, you do it. What does he project to the world... and what is the actual truth?"',
    ],
    ui: "two-text",
    uiConfig: {
      prompt: "The confession.",
      labels: [
        "Nikhil projects that he is...",
        "But he actually comes across as...",
      ],
    },
    uiRevealAt: 12.2,
  },

  // ── SCREEN 9: SURVIVOR ──
  {
    id: "survivor",
    show: "Survivor",
    showEmoji: "🎙️",
    audio: "/vo/07-survivor.mp3",
    bg: "/sets/tribal-council.webp",
    captions: [
      'STEVE: "The flashy studio lights are off. The network has left the building. It\'s just you and the camera... speaking directly to him."',
      'JEFF: (Whispering) "The tribe has spoken..."',
      'STEVE: "Leave him a voicenote. Total honesty. This is where we figure out if his character survives."',
    ],
    ui: "long-text-with-audio",
    uiConfig: {
      prompt: "Final words for the tribe.",
      maxSeconds: 15,
    },
    uiRevealAt: 7.7,
  },

  // ── SCREEN 9: PRODUCER'S NOTES ──
  {
    id: "producer-notes",
    show: "Control Room",
    showEmoji: "🎬",
    audio: "/vo/09-producer.mp3",
    bg: "/sets/control-room.webp",
    captions: [
      'STEVE: "I\'m looking at the final timeline in the control room. We\'re about to export the cut."',
      'JEFF: "Roll the credits! Start the spin-offs!"',
      'STEVE: "Before we ship this... what are your final director\'s notes? What does he need to change for Season Two of his life?"',
    ],
    ui: "text-area",
    uiConfig: {
      prompt: "Director's notes.",
      placeholder:
        "What should Nikhil do more of, less of, or more consistently?",
    },
    uiRevealAt: 3.5,
  },

  // ── SCREEN 10: CREDITS ──
  {
    id: "credits",
    show: "Credits",
    showEmoji: "🎬",
    audio: "/vo/10-credits.mp3",
    bg: "/sets/credits-bg.webp",
    captions: [
      'STEVE: "That\'s a wrap. The data is locked. We did everything we could."',
      'JEFF: "Did I win?"',
      'STEVE: "No, Jeff. But maybe Nikhil did."',
      'JEFF: "Wait, so is the show renewed?"',
      'STEVE: "That\'s up to him now. Tester... thank you. Seriously. Submitting the findings now."',
    ],
    ui: "submit-button",
    uiRevealAt: 4.6,
  },
];
