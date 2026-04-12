# Synthetic User Test Results: Good Morning, Nikhil

**Date:** 2026-04-12
**Build tested:** Current `master` (ec00a14) — source code review, not live build
**Personas tested:** Kavita (mom), Dev (college friend), Rachel (former manager), Amir (distant cousin)
**Tasks tested:** Start survey, navigate screens, answer all input types, review & submit, resume session

## Summary

The survey is charming and completable, but **users who can't hear or skip audio lose all question context** — prompts vanish once the UI appears. Kavita gets stuck on cultural references and worries her answers weren't saved. Dev blasts through but accidentally submits the wrong Shark Tank answer with no undo. Rachel abandons mid-survey because she opened it during a meeting and audio blared. The biggest structural gap: the question only exists in the audio/captions, so the input UI is orphaned from its prompt.

---

## Personas

### Kavita — Mom
- **Relationship:** Family
- **Context:** Age 58, iPhone 13, default text size, WhatsApp power user but not web-app savvy. Received the link from Nikhil with "fill this out for me?" — she's doing it because her son asked. Watches Indian TV, doesn't know American game shows. Reads carefully, types slowly with one finger.
- **Emotional state:** Eager to help, slightly anxious about doing it "right"

### Dev — College Friend
- **Relationship:** Friend
- **Context:** Age 28, Pixel 8, does everything fast on his phone. Opens the link while waiting in line for coffee. Has 3 minutes. Skips audio immediately, wants to tap through quickly. Will abandon if it feels long.
- **Emotional state:** Amused but impatient

### Rachel — Former Manager
- **Relationship:** Manager
- **Context:** Age 42, iPhone 15 Pro, opens the link during a meeting under the table. Phone is on silent but the browser doesn't know that. Professional, thoughtful — wants to give meaningful answers but has zero time right now. Will come back later if she can.
- **Emotional state:** Willing but time-constrained

### Amir — Distant Cousin
- **Relationship:** Family (Other)
- **Context:** Age 22, Android phone, knows Nikhil from family gatherings but not deeply. Doesn't have strong opinions for every question. Wants to be honest but some prompts ("three adjectives that describe Nikhil") are hard when you only see someone at Diwali.
- **Emotional state:** Slightly uncomfortable — wants to help but afraid of giving shallow answers

---

## Scenario Results

### Scenario 1: Open the Link and Start
**Task:** Arrive at the app from a text/WhatsApp link, understand what it is, begin.

#### Kavita (mom, iPhone, not web-app savvy)
| Step | Action | Using | Sees | Thinks | Result |
|------|--------|-------|------|--------|--------|
| 1 | Taps link from WhatsApp | Touch | Loading screen: "Good Morning, Nikhil" + "Loading episode" | "Oh, something from Nikhil" | ✓ |
| 2 | Cold open loads | Touch | Background image, dark overlay. Audio starts playing — Steve Harvey-style voice banter about "the Nikhil family versus Jeff Goldblum" | "Who is Jeff Goldblum? What is this?" Startled by audio at full volume. | ⚠ |
| 3 | Reads captions | — | Yellow/blue caption text, rapid banter about Family Feud, "survey says" jokes | Doesn't get the references. Waiting for instructions. Doesn't realize the captions are entertainment, not instructions. | ⚠ |
| 4 | "Start Episode" appears after 10s | Touch | Large yellow button | "OK, I press this." Taps. | ✓ |

**FINDING: Audio blares without warning.** No mute button, no volume control, no indication that audio will play. Kavita's phone is at full volume from a WhatsApp call earlier. She fumbles for the volume rocker.
**WHO IS AFFECTED:** Kavita, Rachel (meeting), anyone in a quiet/public space
**Severity:** Major

**FINDING: Cold open banter is opaque to non-American-TV audiences.** "Family Feud", "Jeff Goldblum", "survey says" — Kavita has no frame of reference. She can't tell if this is setup or instructions. Not blocking, but 10 seconds of confusion before she can do anything.
**WHO IS AFFECTED:** Kavita, Amir (less so — Gen Z gets the references)
**Severity:** Minor — flavor, not function

#### Rachel (manager, phone on silent, in a meeting)
| Step | Action | Using | Sees | Thinks | Result |
|------|--------|-------|------|--------|--------|
| 1 | Taps link under the table | Touch | Loading screen | — | ✓ |
| 2 | Cold open loads | — | Audio plays through phone speaker despite phone being on "silent" (iOS silent mode doesn't mute web audio) | "Oh shit." Scrambles to lower volume. Meeting disrupted. | ✗ |
| 3 | Closes tab | — | — | "I'll do this later." | ✗ |

**FINDING: Web audio ignores iOS silent mode.** The phone's hardware mute switch silences notifications and ringtones, not web `<audio>` elements or Howler.js playback. Rachel's phone is "silent" but the app blares anyway. This is a well-known iOS behavior but the app doesn't account for it.
**WHO IS AFFECTED:** Rachel, anyone who thinks "silent mode" means silent
**Severity:** Critical — user abandons the survey entirely. First-impression failure.

#### Dev (college friend, in line for coffee)
| Step | Action | Using | Sees | Thinks | Result |
|------|--------|-------|------|--------|--------|
| 1 | Opens link | Touch | Loading screen | "What did Nikhil make now" | ✓ |
| 2 | Cold open starts | Touch | Audio plays (has AirPods in) | Hears the banter, grins | ✓ |
| 3 | Hits "Skip →" immediately | Touch | SkipButton top-right, `min-h-[48px]` | "I don't have time for this" | ✓ |
| 4 | "Start Episode" appears | Touch | Large yellow button | Taps instantly | ✓ |

Dev has no issues with the cold open — he's the target demographic for the humor.

---

### Scenario 2: Choose Relationship (Screen 2)
**Task:** Select how you know Nikhil, optionally go anonymous.

#### Kavita (mom)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Audio plays the question | Caption: "How do you know Nikhil?" | Understands | ✓ |
| 2 | UI reveals: 6 chips | "Family", "Friend", etc. | Taps "Family" — clear, easy | ✓ |
| 3 | Anonymous checkbox | Small native checkbox + "Stay anonymous — Nikhil won't see who submitted" | "Why would I hide from my own son?" Ignores it. | ✓ |
| 4 | "Continue" button | Yellow, clear | Taps | ✓ |

No issues. Simple screen, clear options, familiar words.

#### Amir (distant cousin)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Reads options | "Family", "Friend", "Classmate", "Colleague", "Manager", "Other" | "I'm family but we're not close. Is 'Family' right? There's no 'extended family' or 'cousin' option." Picks "Family" anyway. | ⚠ |
| 2 | Anonymous toggle | Checkbox | "Actually, yeah, let me stay anonymous." Checks the box. | ✓ |

**FINDING: "Family" is broad.** Amir's relationship to Nikhil is "family" but the survey treats all family the same. A mom and a distant cousin will give very different quality answers. Not a UX bug — but the data won't distinguish them.
**WHO IS AFFECTED:** Amir
**Severity:** Minor — data quality issue, not UX issue

---

### Scenario 3: Family Feud — Three Adjectives (Screen 3A)
**Task:** Enter three words describing Nikhil.

#### Dev (impatient, skipped audio)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Skipped audio immediately | UI reveals: three blank input fields with placeholders "Answer #1", "Answer #2", "Answer #3" | "Three answers to... what? What's the question?" Scrolls up. Nothing. Looks around the screen. Only sees the ShowBadge saying "Family Feud" and the inputs. | ✗ |
| 2 | Guesses from context | — | "I guess adjectives about Nikhil?" Types quickly. | ⚠ |

**FINDING: The question only exists in the audio/captions.** Once the UI appears, the prompt ("Give me three adjectives or short phrases that describe Nikhil") is gone. There is no visible question text above the input fields. If you skipped audio, you're guessing.
**WHO IS AFFECTED:** Dev (skipped audio), Rachel (when she returns — won't replay audio), anyone who forgot the question while thinking
**Severity:** Critical — the primary interaction (answering a question) is separated from the question itself.

#### Kavita (types slowly)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Heard the audio, understood the question | Three input fields | "Three adjectives..." Thinks carefully. Types "caring" in field 1. | ✓ |
| 2 | Moves to field 2 | Placeholder "Answer #2" gone from field 1 (she typed in it), visible in field 2 | Thinks for 20 seconds. Types "smart". | ✓ |
| 3 | Field 3 | — | Can't think of a third. Sees no skip option. Tries "Lock it in" with 2 of 3. | ✓ (validation accepts >= 1) |

**FINDING: No skip button on ThreeText.** Other input types (ShortText, TextArea, LongTextWithAudio) have "Skip this one →" but ThreeText doesn't. Kavita can submit with 1 of 3, which is fine, but if she wanted to skip entirely she can't.
**WHO IS AFFECTED:** Kavita, Amir (doesn't know Nikhil well enough for 3 answers)
**Severity:** Minor — the 1-minimum validation is forgiving enough

#### Amir (doesn't know Nikhil well)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Heard the question | Three fields | "Three adjectives? I see him once a year. I can think of one... maybe two." | ⚠ |
| 2 | Types "funny" and "smart" | — | Stares at field 3. Feels pressure. Types "nice" as a throwaway. | ⚠ |

**FINDING: Amir gives a low-quality third answer because the UI implies all three are expected.** The validation only requires 1, but the three visible fields create social pressure to fill them all. Amir doesn't realize he can leave one blank.
**WHO IS AFFECTED:** Amir, anyone who doesn't know Nikhil deeply
**Severity:** Minor — but degrades data quality. Consider placeholder text like "Optional" on field 3, or "(at least one)" in the label.

---

### Scenario 4: Strongest Quality + Trademark (Screens 3B, 3C)

#### Dev (fast, skipped audio on both)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Screen 3B: TextArea | Placeholder: "Which of your 3 answers feels most true, and why?" | "Oh — the placeholder IS the question this time. OK." Types a quick sentence. | ✓ |
| 2 | Screen 3C: ShortText | Placeholder: "Name a Nikhil trademark..." | Gets it from placeholder. Types "the head tilt". | ✓ |

**Observation:** Some screens have the question in the placeholder (3B, 3C) while others don't (3A). Inconsistent but these two work for Dev because the placeholder is descriptive enough.

---

### Scenario 5: Multi-Select — Bachelor Roses (Screen 5A)
**Task:** Give 3 roses to Nikhil's strongest qualities.

#### Kavita (mom)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Reads label | "Give 3 roses to Nikhil's strongest qualities (pick 3)" | "Roses? Like the flower? Oh, The Bachelor. I've seen this." | ✓ |
| 2 | Reads options | "Already Has Notes", "Questioned The Premise", "Most Serious Unserious", etc. | "What does 'Most Serious Unserious' mean? 'Already Has Notes' — like school notes?" These are insider-language descriptions, not plain adjectives. Kavita is confused. | ⚠ |
| 3 | Picks 3 she thinks she understands | "Genuinely Very Earnest", "Cares Too Much", "Makes Complex Things Clear" | These three are the most plain-language options. She avoids the ones she doesn't understand. | ✓ |

**FINDING: Quality labels are written in Nikhil's professional/friend vernacular, not universal language.** "Already Has Notes", "Questioned The Premise", "Most Serious Unserious" read like inside jokes to friends and colleagues. Family members outside that context will gravitate to the plain-language options, creating a selection bias.
**WHO IS AFFECTED:** Kavita, Amir
**Severity:** Minor — intentional design choice. The labels ARE the personality of the survey. But Kavita's picks will cluster on the "obvious" options.

#### Dev (fast)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Scans options | 8 chips, 2-column grid | Instantly gets the language. Taps 3. | ✓ |
| 2 | Tries to tap a 4th | Nothing happens | "Huh." Looks at button: "Lock it in · 3/3". Gets it. | ✓ |

No issues for Dev — he's fluent in this register.

---

### Scenario 6: Mad-Lib (Screen 5C)
**Task:** Complete "I never stood a chance because Nikhil always ___"

#### Kavita (mom)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Reads stem | "I never stood a chance because Nikhil always" + inline input | "Who is 'I'? The eliminated quality? I don't understand the Bachelor context." The mad-lib references the limo ride elimination scene. Kavita hasn't internalized the metaphor. | ⚠ |
| 2 | Types something anyway | "...works hard" | Generic answer because she didn't understand the framing. | ⚠ |

**FINDING: The mad-lib's "I" is the eliminated quality personified.** This metaphor depends on understanding the Bachelor elimination scene. Without that context, the sentence reads oddly. Kavita answers literally rather than playfully.
**WHO IS AFFECTED:** Kavita, possibly Amir
**Severity:** Minor — the answer is still usable data. The playful framing just doesn't land.

---

### Scenario 7: Invest or Pass — Shark Tank (Screen 6A)
**Task:** Decide whether to invest in Nikhil.

#### Dev (fast, tapping quickly)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Two large buttons: "I'M IN" / "I'M OUT" | Green/red, big, side by side | Wants to tap "I'M IN" | ✓ |
| 2 | Taps "I'M OUT" by accident (one-handed, thumb slip) | Immediately advances to next screen | "Wait, no! I wanted IN!" No back button? Actually there IS a back button on the next screen — but it goes back to the Shark Tank QUESTION screen, not back to change his answer. His "out" is already persisted. | ✗ |

**FINDING: InvestOrPass submits instantly on tap — no confirmation.** Every other input type requires "Lock it in" confirmation. This is the only input where a single tap is irreversible. Dev hit the wrong button and his answer is persisted server-side.
**WHO IS AFFECTED:** Dev (fast tapper, one-handed), anyone with imprecise taps
**Severity:** Major — inconsistent interaction model. A slip produces the opposite answer with no undo. Either add a confirmation step or add a selected-state + confirm button.

#### Kavita (mom)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Reads the prompt | "Would you invest in Nikhil?" + "I'M IN" / "I'M OUT" | "What does 'invest' mean here? Money? Like Shark Tank?" Gets the show reference from the badge. | ⚠ |
| 2 | Taps "I'M IN" | Advances | She wanted IN, she got IN. But she's not sure what she just committed to. | ✓ |

**FINDING:** The "invest" metaphor is slightly abstract for non-Shark-Tank viewers. Not blocking.
**Severity:** Minor

---

### Scenario 8: Long Text — Survivor Confessional (Screen 7)
**Task:** Write honestly about working with Nikhil.

#### Rachel (returns later, doing this properly now)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Audio plays, she listens this time | Caption: "What's one thing people should know about being on a team with Nikhil?" | "Good question. Let me think." | ✓ |
| 2 | UI reveals: textarea with prompt text visible | `"What's one thing people should know about being on a team with Nikhil?"` shown as italic text above textarea | "OK, the question is right there. Good." | ✓ |
| 3 | Types a thoughtful paragraph | Placeholder: "Say what you've never said..." | The placeholder is evocative. She writes 3 sentences. | ✓ |
| 4 | Taps "Lock it in" | Advances | ✓ | ✓ |

**Observation:** This screen actually works well — the `LongTextWithAudio` component shows the prompt visually (`config.prompt` rendered as italic text). This is the pattern that's MISSING from ThreeText, ShortText, and other inputs.

---

### Scenario 9: Two-Text — Maury (Screen 8)
**Task:** "Nikhil projects that he is ___ / But he actually comes across as ___"

#### Amir (doesn't know Nikhil deeply)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Reads labels | "Nikhil projects that he is..." / "But he actually comes across as..." | "Projects vs. actually? I barely know him well enough to say what he PROJECTS let alone what's underneath." | ⚠ |
| 2 | Both fields required | Tries to submit with one filled — error: "Both sides of the story" | "I don't HAVE both sides." Looks for skip button. None. | ✗ |

**FINDING: TwoText has no skip button and requires BOTH fields.** This is the hardest question for someone who doesn't know Nikhil well, and it's the only multi-field input with no escape hatch. Amir is stuck — he either makes something up or abandons.
**WHO IS AFFECTED:** Amir, any "Other" or distant relationship respondent
**Severity:** Major — forced completion on the deepest question with no skip option. Add "Skip this one →" like ShortText/TextArea have.

---

### Scenario 10: Review & Submit

#### Kavita (mom, wants to verify)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | "Ready to wrap?" screen | "8 answers recorded" | "Wrap? Like finish?" | ✓ |
| 2 | Taps "Review your answers" | Expands list, answers truncated with `...` | "That's not my full answer! Did it cut off what I wrote?" Anxious. | ⚠ |
| 3 | Tries to tap an answer to see it in full | Nothing happens — answers aren't interactive | "Where did the rest go?" | ⚠ |
| 4 | Anonymous toggle | "Anonymous — Nikhil won't see your name" | "Of course he should see my name, I'm his mother." Leaves it off. | ✓ |
| 5 | "Submit Episode" | Large yellow button | Taps. Success screen: "That's a wrap" | ✓ |

**FINDING: Truncated answers in review create anxiety.** Kavita wrote carefully and now sees her answers cut off. She can't tell if the full text was saved or literally truncated. The `truncate` CSS class is visual-only (the data is fine), but the UX communicates "your answer was cut short."
**WHO IS AFFECTED:** Kavita (anxious about doing it right), Rachel (professional, wants to verify what she said)
**Severity:** Major — the review screen's purpose is reassurance before submission. Truncation undermines that purpose. Show full answers or add tap-to-expand.

---

### Scenario 11: Resume After Abandoning (Rachel returns)

#### Rachel (closed tab during meeting, returns 2 hours later)
| Step | Action | Sees | Thinks | Result |
|------|--------|------|--------|--------|
| 1 | Opens the same link | Loading screen, then resume banner: "Picking up where you left off — Meet Our Audience" | "Oh good, it saved my spot." But she didn't get past screen 2 — she only saw the cold open before closing. The resume is accurate. | ✓ |
| 2 | Audio plays again on the relationship screen | Same audio she heard before | "Didn't I already hear this?" No way to tell if she answered this screen before. The input is blank. | ⚠ |
| 3 | Fills it out (again or for the first time — she's not sure) | — | Slight friction but not blocking. | ✓ |

**FINDING: Resume doesn't communicate what was already answered.** Rachel sees blank inputs on the resume screen and can't tell if she's re-doing a screen or seeing it fresh. The resume banner helps with position but not with state.
**WHO IS AFFECTED:** Rachel, anyone who resumes
**Severity:** Minor — the correct screen is loaded and previous answers are saved server-side. Just a communication gap.

---

## Barrier Matrix

| Task | Kavita (mom) | Dev (friend) | Rachel (manager) | Amir (cousin) |
|------|-------------|-------------|-----------------|---------------|
| Open & start | ⚠ audio blast, cultural refs | ✓ | ✗ audio in meeting | ✓ |
| Relationship picker | ✓ | ✓ | ✓ | ⚠ "Family" too broad |
| Three-text (Feud) | ✓ heard audio | ✗ no visible question | ⚠ no visible question | ⚠ shallow answers |
| Strongest + trademark | ✓ | ✓ | ✓ | ⚠ |
| Sponsor brand + why | ✓ | ✓ | ✓ | ⚠ |
| Multi-select (Bachelor) | ⚠ insider labels | ✓ | ✓ | ⚠ insider labels |
| Single-select (eliminate) | ⚠ insider labels | ✓ | ✓ | ⚠ |
| Mad-lib (limo) | ⚠ metaphor | ✓ | ✓ | ✓ |
| Invest/Pass (Shark) | ✓ | ✗ accidental tap | ✓ | ✓ |
| Long text (Survivor) | ✓ | ✓ | ✓ | ⚠ not enough to say |
| Two-text (Maury) | ✓ | ✓ | ✓ | ✗ can't skip |
| Review & submit | ⚠ truncated | ✓ | ⚠ truncated | ✓ |
| Resume | ✓ | n/a | ⚠ state unclear | n/a |

---

## Cross-Persona Patterns

### Universal Barriers (2+ personas)
1. **Audio auto-play with no mute/warning** — Kavita (volume blast), Rachel (meeting disaster), Dev (fine — has AirPods). Two of four personas have a bad first experience.
2. **Question prompts vanish after audio** — The question lives in audio/captions only. Once UI reveals, it's gone. Dev (skipped audio) literally can't see what he's answering. Rachel (returns later) doesn't get a second chance at the prompt. Only `LongTextWithAudio` shows the prompt persistently.
3. **Review screen truncates answers** — Kavita and Rachel both want to verify what they wrote. Truncation creates anxiety.

### Friction Hotspots
- **Screen 3A (ThreeText):** Hardest screen. No visible question, social pressure to fill all 3, Amir doesn't know enough for 3 answers.
- **Screen 6A (InvestOrPass):** Only input that submits instantly. Dev's accidental wrong answer.
- **Screen 8 (TwoText/Maury):** Deepest question, requires both fields, no skip. Amir is stuck.

### Emotional Patterns
- **Kavita:** Anxiety — "Did I do it right? Did it save? Why is my answer cut off?" She completes the survey but doesn't feel confident about it.
- **Dev:** Amusement → confusion (no visible question) → frustration (wrong Shark Tank answer). The survey is fun when it works; the errors are abrupt.
- **Rachel:** Disruption (audio) → abandonment → cautious return. First impression is negative. The survey must survive "I'll do this later."
- **Amir:** Discomfort — "I don't know Nikhil well enough for this." The survey assumes closeness. Screens with no skip option trap him.

---

## Findings by Severity

### Critical
1. **Audio auto-play causes Rachel to abandon.** Web audio plays regardless of iOS silent mode. No mute toggle, no warning, no pre-roll consent screen. First-time visitors in quiet/professional settings will close the tab.
   - **Fix:** Add a pre-audio interstitial ("This episode has sound. Tap to begin.") or a persistent mute toggle. At minimum, don't auto-play on the cold open — make "Start Episode" the audio trigger instead.

2. **Question prompts vanish after audio.** ThreeText, ShortText, TextArea, MultiSelect, SingleSelect, MadLib, and TwoText screens show the prompt ONLY in captions during audio. Once the UI appears, the question is gone. `LongTextWithAudio` is the exception — it renders `config.prompt` as visible text.
   - **Fix:** Add a visible question/prompt above every input group. Pull from captions or add a `prompt` field to screen config. The `LongTextWithAudio` pattern already does this correctly.

### Major
3. **InvestOrPass submits instantly — no confirmation.** Every other input type uses "Lock it in". This one fires `onSubmit` directly from the button tap. Dev hits the wrong button and his answer is persisted.
   - **Fix:** Add a selected state (highlight the chosen button) + "Lock it in" confirmation, matching every other screen's pattern.

4. **TwoText (Maury) has no skip option.** The deepest, most personal question requires both fields and has no "Skip this one →" escape hatch. Amir is trapped.
   - **Fix:** Add `skipBtn` like ShortText and TextArea have. Or make the second field optional.

5. **Review screen truncates answers.** `truncate` CSS on answer text cuts off responses. Users see "caring, dedicat..." and worry their answer was lost.
   - **Fix:** Remove `truncate`, show full text. Or add tap-to-expand per answer row.

### Minor
6. **Bachelor quality labels are insider language.** "Already Has Notes", "Questioned The Premise", "Most Serious Unserious" — Kavita and Amir gravitate to the 3 plain-language options, creating selection bias.
   - **Accept or fix:** This is a design voice choice. If you want balanced data from family, consider adding a brief explainer tooltip or parenthetical.

7. **ThreeText implies all 3 required.** Three visible fields + no "optional" indicator. Validation accepts 1, but the UI doesn't communicate this. Amir fills all 3 with a throwaway third answer.
   - **Fix:** Add "(at least one)" to a label, or "Optional" placeholder on fields 2 and 3.

8. **Resume doesn't communicate answer state.** Returning users see blank inputs and can't tell if they already answered the current screen.
   - **Fix:** Pre-fill the current screen's input if a previous answer exists, or add "You haven't answered this one yet" text.

9. **Cold open cultural references are opaque to some family.** "Jeff Goldblum", "Family Feud", "survey says" — entertainment flavor that doesn't land for Kavita.
   - **Accept:** This is intentional personality. The survey works without understanding the references.

10. **"Family" relationship category is too broad.** Mom and distant cousin both pick "Family" but have very different ability to answer.
    - **Consider:** Add "Close Family" / "Extended Family", or accept the data limitation.

11. **No skip on MultiSelect/SingleSelect.** The Bachelor screens require a selection — you can't opt out. Less impactful than TwoText because picking is easier than writing.
    - **Consider:** Add skip for respondents who genuinely don't have an opinion.

---

## Recommendation

**Fix #1 and #2 (audio consent + visible questions), then ship. Fix #3-5 soon after.**

Priority order:
1. **Audio consent gate** — wrap cold open in a "tap to start with sound" screen, or make "Start Episode" the first audio trigger (Critical #1)
2. **Visible question prompts on all input screens** — add persistent prompt text above inputs, matching the LongTextWithAudio pattern (Critical #2)
3. **InvestOrPass confirmation step** — add selected state + confirm button (Major #3)
4. **TwoText skip option** — add "Skip this one →" (Major #4)
5. **Review screen full text** — remove truncation (Major #5)

The minor items (6-11) are design trade-offs — they degrade data quality for edge personas but don't block completion for the core audience (friends and close family). Address them based on how much you care about data from distant relationships.
