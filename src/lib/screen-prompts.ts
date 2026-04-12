const SCREEN_PROMPTS: Record<string, string> = {
  "relationship": "How do you know Nikhil?",
  "feud-top3": "Give me three adjectives or short phrases that describe Nikhil.",
  "feud-strongest": "Which of your 3 answers feels most true, and why?",
  "feud-trademark": "Name a thing he does so often it should come with theme music.",
  "sponsor-brand": "What company, product, vibe, aesthetic, or brand sponsors Nikhil?",
  "sponsor-why": "Why does that feel on-brand?",
  "bachelor-roses": "Give 3 roses to Nikhil's strongest qualities.",
  "bachelor-eliminate": "Which quality should go home?",
  "bachelor-limo": "Complete: \"I never stood a chance because Nikhil always...\"",
  "shark-invest": "Would you invest in Nikhil?",
  "shark-reason": "Why are you in or out?",
  "survivor": "What's one thing people should know about being on a team with Nikhil?",
  "maury": "Nikhil projects that he is... but he actually comes across as...",
  "producer-notes": "What should Nikhil do more of, less of, or more consistently?",
};

export function getScreenPrompt(screenId: string): string | null {
  return SCREEN_PROMPTS[screenId] ?? null;
}
