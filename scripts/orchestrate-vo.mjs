import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Babysitter Process: Creative Director TDD Convergence Loop
 * Generates and iteratively refines a V.O. script via writer→scorer loop.
 */

const draftVoTask = defineTask('vo-drafter', (args) => ({
  kind: 'agent',
  title: `Draft V.O. Script (iteration ${args.iteration})`,
  prompt: [
    `You are a Creative Writer for a comedic TV-show-themed survey app called "Good Morning, Nikhil".`,
    `Draft or refine the V.O. script for the "${args.segmentName}" segment.`,
    `Steve Harvey is the host — snappy, exhausted, and irritated.`,
    `Jeff (the eccentric sidekick) is smug and unbothered.`,
    ``,
    args.feedback
      ? `Refine based on Director's critique: ${args.feedback}\nPrevious Draft: ${args.previousScript}`
      : `Initial prompt/context: ${args.prompt}`,
    ``,
    `Return ONLY a JSON object with a single key "script" whose value is the full dialogue with stage directions.`,
  ].join('\n'),
}));

const scoreVoTask = defineTask('vo-scorer', (args) => ({
  kind: 'agent',
  title: `Score V.O. Emotional Resonance (iteration ${args.iteration})`,
  prompt: [
    `You are a Creative Director evaluating a V.O. script for emotional resonance.`,
    `Score the script out of 100. Pacing must be snappy.`,
    `Steve must sound genuinely exhausted, not just wacky.`,
    `Jeff must be unbothered and smug.`,
    ``,
    `Script to evaluate:`,
    `${args.script}`,
    ``,
    `Return ONLY a JSON object with keys:`,
    `  "score": number 0-100`,
    `  "feedback": string with actionable critique if score < ${args.targetScore}`,
  ].join('\n'),
}));

export async function process(inputs, ctx) {
  let currentScript = null;
  let currentFeedback = null;
  let score = 0;
  let iterations = 0;

  const targetScore = inputs.targetScore || 85;
  const maxIterations = inputs.maxIterations || 5;
  const segmentName = inputs.segmentName || 'gmn-feud-kickoff';
  const prompt = inputs.prompt || 'Generate the script for the gmn-feud-kickoff segment';

  ctx.log(`[Director] Starting Quality Convergence Loop for segment: ${segmentName}`);

  while (score < targetScore && iterations < maxIterations) {
    iterations++;
    ctx.log(`[Director] Iteration ${iterations} - Target Score: ${targetScore}`);

    // ── 1. Generation Phase (The Writer) ──
    const draftResult = await ctx.task(draftVoTask, {
      prompt,
      segmentName,
      iteration: iterations,
      feedback: currentFeedback,
      previousScript: currentScript,
    });

    currentScript = (draftResult?.value?.script)
      ? draftResult.value.script
      : (typeof draftResult?.value === 'string' ? draftResult.value : JSON.stringify(draftResult?.value));

    // ── 2. Evaluation Phase (The QA / Director) ──
    const scoreResult = await ctx.task(scoreVoTask, {
      script: currentScript,
      iteration: iterations,
      targetScore,
    });

    score = scoreResult?.value?.score ?? 0;
    currentFeedback = scoreResult?.value?.feedback ?? '';

    ctx.log(`[Director] Iteration ${iterations} scored ${score}/100.`);

    if (score < targetScore) {
      ctx.log(`[Director] Score too low. Loop continues. Critique: ${currentFeedback}`);
    }
  }

  if (score < targetScore) {
    ctx.log(`[Director] Failed to reach target score within max iterations. Halting.`);
    return { success: false, reason: 'Max iterations reached without convergence', score };
  }

  ctx.log(`[Director] Quality Convergence Reached! Score: ${score}. Yielding to human producer...`);

  // ── 3. The Quality Gate / Breakpoint ──
  const review = await ctx.breakpoint({
    question: `Approve the generated script for ${segmentName}? (Score: ${score}/100)\n\nScript:\n${currentScript}\n\nDirector feedback:\n${currentFeedback}`,
    title: 'Creative Director Human Sign-off',
  });

  if (!review.approved) {
    ctx.log(`[Director] Human rejected. Reason: ${review.feedback || review.response || 'No reason given'}`);
    return {
      success: false,
      feedback: review.feedback || review.response,
      reason: 'Rejected by human producer at breakpoint.',
    };
  }

  ctx.log(`[Director] Run completed and approved.`);

  return {
    success: true,
    script: currentScript,
    finalScore: score,
  };
}
