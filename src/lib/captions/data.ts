// Pre-parsed caption data for every screen in Good Morning, Nikhil

import { type CaptionLine, parseSRT } from "./parser";

// ── Raw SRT strings ────────────────────────────────────────────

const SRT_COLD_OPEN = `1
00:00:00,000 --> 00:00:01,200
STEVE: Final round! Nikhil family versus Jeff Goldblum.

2
00:00:01,200 --> 00:00:01,800
STEVE: Go to Jeff: something you can do on a computer.

3
00:00:01,800 --> 00:00:03,500
JEFF: Ahhhh... you can suck on the mouse like a pacifier.

4
00:00:03,500 --> 00:00:04,200
STEVE: Oh my God. Good Lord.

5
00:00:04,200 --> 00:00:04,800
STEVE: Let's see it... WRONG AGAIN!

6
00:00:04,800 --> 00:00:05,600
JEFF: The board is just a little timid. It fears desire.

7
00:00:05,600 --> 00:00:07,200
STEVE: Keep playing with me and you're going to find out.

8
00:00:07,200 --> 00:00:08,400
STEVE: Today: how does Nikhil really come across?

9
00:00:08,400 --> 00:00:09,200
JEFF: Survey says... inevitable, unknowable, lightly caffeinated.

10
00:00:09,200 --> 00:00:10,000
STEVE: Hit the music.`;

const SRT_WELCOME = `1
00:00:00,000 --> 00:00:01,600
STEVE: Welcome to Good Morning, Nikhil.

2
00:00:01,600 --> 00:00:02,400
STEVE: A few very normal television segments.

3
00:00:02,400 --> 00:00:03,400
JEFF: Oh Stevie, I thought of something else...

4
00:00:03,400 --> 00:00:04,000
STEVE: Oh God. No. Lord, no.`;

const SRT_RELATIONSHIP = `1
00:00:00,000 --> 00:00:01,500
STEVE: First things first. How do you know Nikhil?

2
00:00:01,500 --> 00:00:03,000
JEFF: Family, friend, collaborator, or chaotic neutral.`;

const SRT_FEUD_TOP3 = `1
00:00:00,000 --> 00:00:03,500
STEVE: Top three on the board. Three adjectives that describe Nikhil.`;

const SRT_FEUD_STRONGEST = `1
00:00:00,000 --> 00:00:01,200
JEFF: Show me "handsome."

2
00:00:01,200 --> 00:00:03,500
STEVE: Wrong game, Jeff. Which one feels strongest--and why?`;

const SRT_FEUD_TRADEMARK = `1
00:00:00,000 --> 00:00:02,400
JEFF: Name something he does so often it should have theme music.

2
00:00:02,400 --> 00:00:04,000
STEVE: That's actually a good one, Jeff.`;

const SRT_SPONSOR_BRAND = `1
00:00:00,000 --> 00:00:01,400
STEVE: This episode of Nikhil is brought to you by...

2
00:00:01,400 --> 00:00:05,000
JEFF: A premium blend of polish, intensity, and accidental eye contact.`;

const SRT_SPONSOR_WHY = `1
00:00:00,000 --> 00:00:00,800
STEVE: And why?

2
00:00:00,800 --> 00:00:02,500
JEFF: We're all just shadows and dust, Steve.`;

const SRT_BACHELOR_ROSES = `1
00:00:00,000 --> 00:00:01,600
STEVE: All right, you know what time it is.

2
00:00:01,600 --> 00:00:02,800
STEVE: Rose ceremony. One of you is going home tonight.

3
00:00:02,800 --> 00:00:04,500
STEVE: Three roses. One quality goes home.`;

const SRT_BACHELOR_ELIMINATE = `1
00:00:00,000 --> 00:00:01,400
JEFF: Every board has one weak square.

2
00:00:01,400 --> 00:00:03,500
STEVE: This ain't no board. Send one quality home.`;

const SRT_BACHELOR_LIMO = `1
00:00:00,000 --> 00:00:01,200
STEVE: In the limo ride home...

2
00:00:01,200 --> 00:00:02,800
JEFF: On her way to… actually, I don't know where they go.

3
00:00:02,800 --> 00:00:04,000
STEVE: Complete the sentence.`;

const SRT_SHARK_INVEST = `1
00:00:00,000 --> 00:00:02,200
STEVE: Shark, Nikhil just pitched his brain for 100% of your life savings.

2
00:00:02,200 --> 00:00:02,800
STEVE: Are you in or out?

3
00:00:02,800 --> 00:00:04,600
JEFF: I'll wait until Aunt Demequa blows it. Then steal the round.

4
00:00:04,600 --> 00:00:05,500
STEVE: Do you know where you are.`;

const SRT_SHARK_REASON = `1
00:00:00,000 --> 00:00:01,500
STEVE: Finish the sentence.`;

const SRT_SURVIVOR = `1
00:00:00,000 --> 00:00:01,600
STEVE: Tribal council. Confessional booth. Just you and the camera.

2
00:00:01,600 --> 00:00:02,600
JEFF: [whisper] So this is... Fast Money in the woods?

3
00:00:02,600 --> 00:00:04,000
STEVE: [whisper] No. This is the honest part.`;

const SRT_MAURY = `1
00:00:00,000 --> 00:00:01,400
JEFF: At last. Something you can do with a computer, Steve...

2
00:00:01,400 --> 00:00:02,200
STEVE: No, Jeff. I can't do it.

3
00:00:02,200 --> 00:00:03,600
JEFF: You have to read it. That's the job. That's why they hire you.

4
00:00:03,600 --> 00:00:06,000
STEVE: I'm not even going to look at the board. The envelope goes to...`;

const SRT_PRODUCER_NOTES = `1
00:00:00,000 --> 00:00:01,000
STEVE: Final note from the control room.

2
00:00:01,000 --> 00:00:01,600
JEFF: Fast Money?

3
00:00:01,600 --> 00:00:03,000
STEVE: No. Action step.`;

const SRT_CREDITS = `1
00:00:00,000 --> 00:00:01,000
STEVE: That's a wrap.

2
00:00:01,000 --> 00:00:01,800
JEFF: Did I win?

3
00:00:01,800 --> 00:00:02,200
STEVE: No.

4
00:00:02,200 --> 00:00:03,200
JEFF: Did I remain champion?

5
00:00:03,200 --> 00:00:04,500
STEVE: ...somehow, yes.`;

// ── Parsed & exported ──────────────────────────────────────────

export const SCREEN_CAPTIONS: Record<string, CaptionLine[]> = {
  "cold-open": parseSRT(SRT_COLD_OPEN),
  "welcome": parseSRT(SRT_WELCOME),
  "relationship": parseSRT(SRT_RELATIONSHIP),
  "feud-top3": parseSRT(SRT_FEUD_TOP3),
  "feud-strongest": parseSRT(SRT_FEUD_STRONGEST),
  "feud-trademark": parseSRT(SRT_FEUD_TRADEMARK),
  "sponsor-brand": parseSRT(SRT_SPONSOR_BRAND),
  "sponsor-why": parseSRT(SRT_SPONSOR_WHY),
  "bachelor-roses": parseSRT(SRT_BACHELOR_ROSES),
  "bachelor-eliminate": parseSRT(SRT_BACHELOR_ELIMINATE),
  "bachelor-limo": parseSRT(SRT_BACHELOR_LIMO),
  "shark-invest": parseSRT(SRT_SHARK_INVEST),
  "shark-reason": parseSRT(SRT_SHARK_REASON),
  "survivor": parseSRT(SRT_SURVIVOR),
  "maury": parseSRT(SRT_MAURY),
  "producer-notes": parseSRT(SRT_PRODUCER_NOTES),
  "credits": parseSRT(SRT_CREDITS),
};
