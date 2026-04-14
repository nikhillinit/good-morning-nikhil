/**
 * @process design-system-enforcement
 * @description Enforce design token compliance across components, fixing violations and adding missing tokens
 * @inputs { auditFindings: object }
 * @outputs { success: boolean, tokensAdded: array, filesFixed: array, artifacts: array }
 * @skill design-tokens specializations/web-development/skills/design-tokens/SKILL.md
 * @skill tailwind-css specializations/web-development/skills/tailwind-css/SKILL.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { auditFindings, projectName = 'good-morning-nikhil' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Design System Enforcement for ${projectName}`);

  // Phase 1: Extend token system with missing semantic tokens
  const tokenExtension = await ctx.task(tokenExtensionTask, {
    auditFindings,
    missingTokens: [
      'TV materials (wood, plastic, chrome, metal)',
      'Speaker identity colors (steve, jeff)',
      'Progress bar gradient tokens',
      'Nav control chrome'
    ]
  });
  artifacts.push(...(tokenExtension.artifacts || []));

  // Phase 2: Refactor TelevisionFrame to use tokens
  const tvFrameFix = await ctx.task(componentRefactorTask, {
    component: 'TelevisionFrame',
    filePath: 'src/components/ambient/TelevisionFrame.tsx',
    violations: [
      'bg-zinc-950, bg-zinc-900 → bg-background or semantic',
      'bg-[#3a2818] → --tv-wood',
      'border-[#22160d] → --tv-wood-dark',
      'bg-zinc-400 → --tv-metal',
      'bg-[#1a1c1d] → --tv-plastic'
    ],
    tokensDefined: tokenExtension.tokens
  });
  artifacts.push(...(tvFrameFix.artifacts || []));

  // Phase 3: Fix Captions speaker colors
  const captionsFix = await ctx.task(componentRefactorTask, {
    component: 'Captions',
    filePath: 'src/components/Captions.tsx',
    violations: [
      'text-yellow-400 → text-speaker-steve',
      'text-blue-400 → text-speaker-jeff'
    ],
    tokensDefined: tokenExtension.tokens
  });
  artifacts.push(...(captionsFix.artifacts || []));

  // Phase 4: Fix BroadcastTimeline progress colors
  const timelineFix = await ctx.task(componentRefactorTask, {
    component: 'BroadcastTimeline',
    filePath: 'src/components/BroadcastTimeline.tsx',
    violations: [
      'from-red-600 to-amber-500 → semantic progress gradient',
      'rgba(220,38,38,0.8) → --progress-glow'
    ],
    tokensDefined: tokenExtension.tokens
  });
  artifacts.push(...(timelineFix.artifacts || []));

  // Phase 5: Fix layout.tsx inline styles
  const layoutFix = await ctx.task(componentRefactorTask, {
    component: 'layout',
    filePath: 'src/app/layout.tsx',
    violations: [
      'inline hex styles in noscript fallback → use CSS variables'
    ],
    tokensDefined: tokenExtension.tokens
  });
  artifacts.push(...(layoutFix.artifacts || []));

  // Breakpoint: Review all fixes before verification
  await ctx.breakpoint({
    question: `Token extension and 5 component fixes complete. Files modified: TelevisionFrame, Captions, BroadcastTimeline, layout. Review and approve to continue to verification?`,
    title: 'Design System Fixes Review',
    context: {
      runId: ctx.runId,
      tokensAdded: tokenExtension.tokens,
      filesFixed: ['TelevisionFrame.tsx', 'Captions.tsx', 'BroadcastTimeline.tsx', 'layout.tsx']
    }
  });

  // Phase 6: Run tests and verify no regressions
  const verification = await ctx.task(verificationTask, {
    testsToRun: 'npm test',
    visualCheck: 'Start dev server and verify TV frame renders correctly'
  });
  artifacts.push(...(verification.artifacts || []));

  return {
    success: true,
    projectName,
    tokensAdded: tokenExtension.tokens || [],
    filesFixed: ['TelevisionFrame.tsx', 'Captions.tsx', 'BroadcastTimeline.tsx', 'layout.tsx', 'globals.css'],
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'design-system-enforcement', timestamp: startTime }
  };
}

export const tokenExtensionTask = defineTask('token-extension', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extend Design Tokens',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Systems Engineer',
      task: 'Add missing semantic tokens to globals.css',
      context: {
        currentTokensFile: 'src/app/globals.css',
        missingTokens: args.missingTokens,
        auditFindings: args.auditFindings
      },
      instructions: [
        'Read the current globals.css to understand existing token structure',
        'Add TV material tokens under a new /* TV Frame Materials */ section:',
        '  --tv-wood: #3a2818',
        '  --tv-wood-dark: #22160d',
        '  --tv-plastic: #1a1c1d',
        '  --tv-metal: #a1a1aa (zinc-400 equivalent)',
        '  --tv-chrome: #000',
        'Add speaker identity tokens under /* Speaker Identity Colors */:',
        '  --speaker-steve: #facc15 (yellow-400)',
        '  --speaker-jeff: #60a5fa (blue-400)',
        'Add progress tokens under /* Progress States */:',
        '  --progress-start: #dc2626 (red-600)',
        '  --progress-end: #f59e0b (amber-500)',
        '  --progress-glow: rgba(220, 38, 38, 0.8)',
        'Register all new tokens in @theme inline block',
        'Use Edit tool to make precise changes, not Write',
        'Return list of tokens added'
      ],
      outputFormat: 'JSON with tokens array and artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['tokens', 'artifacts'],
      properties: {
        tokens: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-system', 'tokens']
}));

export const componentRefactorTask = defineTask('component-refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refactor ${args.component}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Frontend Developer',
      task: `Refactor ${args.component} to use semantic design tokens`,
      context: {
        filePath: args.filePath,
        violations: args.violations,
        tokensDefined: args.tokensDefined
      },
      instructions: [
        `Read ${args.filePath} to understand current implementation`,
        'For each violation listed, replace the literal value with the semantic token',
        'Use Tailwind classes where tokens are registered (e.g., bg-tv-wood, text-speaker-steve)',
        'For CSS variables not in Tailwind, use style={{ background: "var(--tv-wood)" }}',
        'Preserve all existing functionality and animations',
        'Use Edit tool for precise changes',
        'Test that the component still renders (check for syntax errors)',
        'Return summary of changes made'
      ],
      outputFormat: 'JSON with changes array and artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'artifacts'],
      properties: {
        changes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-system', 'refactor', args.component]
}));

export const verificationTask = defineTask('verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Design System Changes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer',
      task: 'Verify design system changes did not introduce regressions',
      context: args,
      instructions: [
        'Run npm test to ensure all tests pass',
        'Check for TypeScript/build errors with npm run build or tsc',
        'Verify the tokens are properly defined in globals.css',
        'Grep for any remaining literal palette violations (bg-zinc-, text-yellow-, etc.)',
        'Report any remaining violations that need manual attention',
        'Return verification status'
      ],
      outputFormat: 'JSON with passed boolean, testsRun, remainingViolations array, and artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        testsRun: { type: 'number' },
        remainingViolations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-system', 'verification']
}));
