// Pre-parsed caption data for every screen in Good Morning, Nikhil

import { type CaptionLine, parseSRT } from "./parser";

// ── Raw SRT strings ────────────────────────────────────────────

const SRT_COLD_OPEN = `1
00:00:00,000 --> 00:00:11,807
STEVE: All right, final round! We got the Nikhil family versus Jeff Goldblum, our returning champion. Go to Jeff: Name something you can do on the computer.

2
00:00:11,807 --> 00:00:21,353
JEFF: Ahhhh... well I can tell you what you can do with a computer, Steve... you can suck on the mouse like a giant, pacifier.

3
00:00:21,353 --> 00:00:27,247
STEVE: Oh my God. Oh my God, good Lord. Let's see it... Wrong again!

4
00:00:27,247 --> 00:00:31,604
JEFF: The board is just a little timid, Stevie. It fears desire.

5
00:00:31,604 --> 00:00:45,249
STEVE: Keep playing with me. Keep playing with me and you're going to find out, Jeff Goldblum. Today, we are here to answer one question: how does Nikhil really come across?

6
00:00:45,249 --> 00:00:48,014
JEFF: Survey says... inevitable, unknowable, and lightly caffeinated.

7
00:00:48,014 --> 00:00:49,379
STEVE: Hit the music.`;

const SRT_WELCOME = `1
00:00:00,000 --> 00:00:07,259
STEVE: Welcome to Good Morning, Nikhil. You're about to flip through a few very normal television segments.

2
00:00:07,259 --> 00:00:12,411
JEFF: Oh Stevie, I thought of something else you can do with a computer.

3
00:00:12,411 --> 00:00:14,667
STEVE: oh God. No. Lord, no.`;

const SRT_RELATIONSHIP = `1
00:00:00,000 --> 00:00:03,620
STEVE: First things first. How do you know Nikhil?

2
00:00:03,620 --> 00:00:05,590
JEFF: Family, foe, witness, or lover.`;

const SRT_FEUD_TOP3 = `1
00:00:00,000 --> 00:00:07,259
STEVE: Three words. YOUR words. What comes to mind when you think of Nikhil?`;

const SRT_FEUD_STRONGEST = `1
00:00:00,000 --> 00:00:01,193
JEFF: Show me 'handsome'.

2
00:00:01,193 --> 00:00:05,287
STEVE: Wrong game, Jeff. Which one feels strongest, and why?`;

const SRT_FEUD_TRADEMARK = `1
00:00:00,000 --> 00:00:05,152
JEFF: Name a thing he does so often it should come with theme music.

2
00:00:05,152 --> 00:00:08,318
STEVE: That is actually a good one Jeff.`;

const SRT_SPONSOR_BRAND = `1
00:00:00,000 --> 00:00:04,093
STEVE: This episode of Nikhil is brought to you by...

2
00:00:04,093 --> 00:00:10,059
JEFF: A premium blend of polish, intensity, and lightly weaponized seduction just like someone I know.`;

const SRT_SPONSOR_WHY = `1
00:00:00,000 --> 00:00:00,891
STEVE: And why?

2
00:00:00,891 --> 00:00:03,657
JEFF: We're all just shadows and dust Steve.`;

const SRT_BACHELOR_ROSES = `1
00:00:00,000 --> 00:00:11,352
STEVE: Ladies, you know what time it is. It's the rose ceremony, and one of you is going home tonight. Three roses. One quality goes home.`;

const SRT_BACHELOR_ELIMINATE = `1
00:00:00,000 --> 00:00:02,386
JEFF: Every board has one weak square.

2
00:00:02,386 --> 00:00:06,480
STEVE: Which one do you notice least?`;

const SRT_BACHELOR_LIMO = `1
00:00:00,000 --> 00:00:02,256
STEVE: In the limo ride home...

2
00:00:02,256 --> 00:00:08,222
JEFF: On her way to the set of 90-Day Fiance. Say Stevie isn't that where -

3
00:00:08,222 --> 00:00:09,586
STEVE: Complete the sentence.`;

const SRT_SHARK_INVEST = `1
00:00:00,000 --> 00:00:07,714
STEVE: Shark, Nikhil just pitched his brain for 100% of your life savings. Are you in or out?

2
00:00:07,714 --> 00:00:16,445
JEFF: You know I'll just wait until Aunt Demequa blows it, and then it'll go back to me and I'll steal the round.

3
00:00:16,445 --> 00:00:19,174
STEVE: Do you know where you are`;

const SRT_SHARK_REASON = `1
00:00:00,000 --> 00:00:01,364
STEVE: Finish the sentence.`;

const SRT_SURVIVOR = `1
00:00:00,000 --> 00:00:04,093
STEVE: Tribal council. Confessional booth. Just you and the camera.

2
00:00:04,093 --> 00:00:07,673
JEFF: (Whispering) "So this is... Fast Money in the woods?

3
00:00:07,673 --> 00:00:11,767
STEVE: (Whispering back, firmly) "No. This is the honest part.`;

const SRT_MAURY = `1
00:00:00,000 --> 00:00:03,959
JEFF: At last. Something you can do with a computer, Steve...

2
00:00:03,959 --> 00:00:06,688
STEVE: No, Jeff. I can't do it.

3
00:00:06,688 --> 00:00:12,238
JEFF: You have to read it, Steve. That's the job. That's why they hire you.

4
00:00:12,238 --> 00:00:18,587
STEVE: I'm not even going to look at the board. And the envelope goes to...`;

const SRT_PRODUCER_NOTES = `1
00:00:00,000 --> 00:00:02,729
STEVE: Final note from the control room.

2
00:00:02,729 --> 00:00:03,506
JEFF: Fast Money?

3
00:00:03,506 --> 00:00:05,307
STEVE: No. That's a wrap.`;

const SRT_CREDITS = `1
00:00:00,000 --> 00:00:01,364
STEVE: That's a wrap.

2
00:00:01,364 --> 00:00:02,558
JEFF: Did I win?

3
00:00:02,558 --> 00:00:02,994
STEVE: No.

4
00:00:02,994 --> 00:00:04,567
JEFF: Did I remain champion?

5
00:00:04,567 --> 00:00:05,458
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
