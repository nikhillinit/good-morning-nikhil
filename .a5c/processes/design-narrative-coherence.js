/**
 * @process gmn/design-narrative-coherence
 * @description Comprehensive design improvements and narrative arc consistency for Good Morning Nikhil.
 * Covers visual transitions, typography, show segment identity, and audio/VO pacing with emotional journey optimization.
 * @inputs { projectRoot?: string, focusAreas?: array, narrativeFocus?: string }
 * @outputs { success: boolean, auditReport: object, improvements: array, emotionalArcMap: object }
 *
 * @skill design-review antigravity-bundle-web-designer/frontend-design
 * @skill visual-audit thinking-frameworks-skills/design-evaluation-audit
 * @agent design-critic general-purpose
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectRoot = '.',
    focusAreas = ['visual-transitions', 'typography-layout', 'segment-identity', 'audio-vo-pacing'],
    narrativeFocus = 'emotional-journey'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const improvements = [];

  ctx.log('info', 'Starting Design & Narrative Coherence Process for Good Morning Nikhil');
  ctx.log('info', `Focus Areas: ${focusAreas.join(', ')}`);
  ctx.log('info', `Narrative Focus: ${narrativeFocus}`);

  // ============================================================================
  // PHASE 1: COMPREHENSIVE AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 1: Auditing current design state and narrative arc');

  const [designAudit, narrativeAudit] = await ctx.parallel.all([
    () => ctx.task(designSystemAuditTask, { projectRoot, focusAreas }),
    () => ctx.task(narrativeArcAuditTask, { projectRoot, narrativeFocus })
  ]);

  artifacts.push(...(designAudit.artifacts || []));
  artifacts.push(...(narrativeAudit.artifacts || []));

  // ============================================================================
  // PHASE 2: EMOTIONAL ARC MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Mapping emotional journey across screens');

  const emotionalArcMap = await ctx.task(emotionalArcMappingTask, {
    screens: narrativeAudit.screens,
    currentEmotionalFlow: narrativeAudit.emotionalFlow,
    targetArc: 'tension-humor-reflection'
  });

  artifacts.push(...(emotionalArcMap.artifacts || []));

  // ============================================================================
  // PHASE 3: DESIGN TOKEN EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Extracting and normalizing design tokens');

  const designTokens = await ctx.task(designTokenExtractionTask, {
    auditResults: designAudit,
    showSegments: ['family-feud', 'bachelor', 'shark-tank', 'survivor', 'maury'],
    focusAreas
  });

  artifacts.push(...(designTokens.artifacts || []));

  // ============================================================================
  // PHASE 4: INCONSISTENCY RESOLUTION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 4: Planning inconsistency resolutions');

  const resolutionPlan = await ctx.task(inconsistencyResolutionTask, {
    designAudit,
    narrativeAudit,
    emotionalArcMap,
    designTokens,
    focusAreas
  });

  // ============================================================================
  // PHASE 5: BREAKPOINT - REVIEW PLAN (only major checkpoint in autonomous mode)
  // ============================================================================

  await ctx.breakpoint({
    question: [
      '## Design & Narrative Coherence Plan Ready',
      '',
      `**Issues Found:** ${resolutionPlan.issueCount}`,
      `**High Priority:** ${resolutionPlan.highPriority?.length || 0}`,
      `**Estimated Changes:** ${resolutionPlan.estimatedChanges}`,
      '',
      '### Emotional Arc Assessment:',
      emotionalArcMap.summary || 'Mapping complete',
      '',
      '### Key Improvements Planned:',
      ...(resolutionPlan.keyImprovements?.slice(0, 5).map(i => `- ${i}`) || ['Review pending']),
      '',
      'Approve to proceed with implementation, or provide feedback to adjust the plan.'
    ].join('\n'),
    title: 'Design Plan Review',
    options: ['Approve and implement', 'Adjust plan'],
    context: {
      runId: ctx.runId,
      issueCount: resolutionPlan.issueCount,
      focusAreas
    }
  });

  // ============================================================================
  // PHASE 6: IMPLEMENTATION - VISUAL TRANSITIONS
  // ============================================================================

  if (focusAreas.includes('visual-transitions')) {
    ctx.log('info', 'Phase 6a: Implementing visual transition improvements');

    const transitionFixes = await ctx.task(visualTransitionFixTask, {
      issues: resolutionPlan.transitionIssues,
      emotionalArcMap,
      projectRoot
    });

    improvements.push(...(transitionFixes.improvements || []));
    artifacts.push(...(transitionFixes.artifacts || []));
  }

  // ============================================================================
  // PHASE 7: IMPLEMENTATION - TYPOGRAPHY & LAYOUT
  // ============================================================================

  if (focusAreas.includes('typography-layout')) {
    ctx.log('info', 'Phase 6b: Implementing typography and layout improvements');

    const typographyFixes = await ctx.task(typographyLayoutFixTask, {
      issues: resolutionPlan.typographyIssues,
      designTokens,
      projectRoot
    });

    improvements.push(...(typographyFixes.improvements || []));
    artifacts.push(...(typographyFixes.artifacts || []));
  }

  // ============================================================================
  // PHASE 8: IMPLEMENTATION - SHOW SEGMENT IDENTITY
  // ============================================================================

  if (focusAreas.includes('segment-identity')) {
    ctx.log('info', 'Phase 6c: Implementing show segment identity improvements');

    const segmentFixes = await ctx.task(segmentIdentityFixTask, {
      issues: resolutionPlan.segmentIssues,
      designTokens,
      showSegments: ['family-feud', 'bachelor', 'shark-tank', 'survivor', 'maury'],
      projectRoot
    });

    improvements.push(...(segmentFixes.improvements || []));
    artifacts.push(...(segmentFixes.artifacts || []));
  }

  // ============================================================================
  // PHASE 9: IMPLEMENTATION - AUDIO/VO PACING
  // ============================================================================

  if (focusAreas.includes('audio-vo-pacing')) {
    ctx.log('info', 'Phase 6d: Implementing audio/VO pacing improvements');

    const audioFixes = await ctx.task(audioVoPacingFixTask, {
      issues: resolutionPlan.audioIssues,
      emotionalArcMap,
      projectRoot
    });

    improvements.push(...(audioFixes.improvements || []));
    artifacts.push(...(audioFixes.artifacts || []));
  }

  // ============================================================================
  // PHASE 10: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating improvements');

  const validation = await ctx.task(qualityValidationTask, {
    improvements,
    focusAreas,
    emotionalArcMap,
    projectRoot
  });

  // ============================================================================
  // PHASE 11: GENERATE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating final report');

  const finalReport = await ctx.task(generateReportTask, {
    designAudit,
    narrativeAudit,
    emotionalArcMap,
    improvements,
    validation,
    artifacts
  });

  return {
    success: validation.passed,
    auditReport: {
      design: designAudit,
      narrative: narrativeAudit
    },
    improvements,
    emotionalArcMap,
    validation,
    finalReport,
    artifacts,
    metadata: {
      processId: 'gmn/design-narrative-coherence',
      duration: ctx.now() - startTime,
      focusAreas,
      narrativeFocus
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const designSystemAuditTask = defineTask('design-system-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit Design System',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UI/UX Designer and Design System Architect',
      task: `Audit the Good Morning Nikhil codebase for design consistency across: ${args.focusAreas.join(', ')}`,
      context: {
        projectRoot: args.projectRoot,
        focusAreas: args.focusAreas,
        keyFiles: [
          'src/app/globals.css',
          'src/components/*.tsx',
          'src/data/screens.ts',
          'src/lib/animations.ts'
        ]
      },
      instructions: [
        'Read src/app/globals.css to understand current design tokens and CSS variables',
        'Read src/data/screens.ts to understand the screen structure and show segments',
        'Read src/lib/animations.ts to understand transition patterns',
        'Scan src/components/ for UI component styling patterns',
        'Identify inconsistencies in: colors, typography, spacing, transitions, animations',
        'Note which show segments (Feud, Bachelor, Shark Tank, Survivor, Maury) have distinct vs. generic styling',
        'Return structured JSON with findings'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'inconsistencies'],
      properties: {
        success: { type: 'boolean' },
        findings: { type: 'object' },
        inconsistencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const narrativeArcAuditTask = defineTask('narrative-arc-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit Narrative Arc',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Story Editor and Narrative Designer specializing in interactive media',
      task: 'Audit the narrative arc and emotional flow across all screens in Good Morning Nikhil',
      context: {
        projectRoot: args.projectRoot,
        narrativeFocus: args.narrativeFocus,
        keyFiles: ['src/data/screens.ts', 'public/vo/']
      },
      instructions: [
        'Read src/data/screens.ts to understand the full screen sequence',
        'List all audio files in public/vo/ to understand VO coverage',
        'Map the emotional beats: which screens create tension, humor, reflection?',
        'Identify pacing issues: too fast, too slow, jarring transitions',
        'Note where the TV show conceit is strong vs. weak',
        'Assess if the show order (Feud → Bachelor → Shark Tank → Survivor → Maury) supports the emotional journey',
        'Return structured JSON with the narrative arc analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'screens', 'emotionalFlow'],
      properties: {
        success: { type: 'boolean' },
        screens: { type: 'array' },
        emotionalFlow: { type: 'object' },
        pacingIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const emotionalArcMappingTask = defineTask('emotional-arc-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Emotional Arc',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Narrative Psychologist and Experience Designer',
      task: 'Create a detailed emotional arc map for the Good Morning Nikhil survey experience',
      context: {
        screens: args.screens,
        currentEmotionalFlow: args.currentEmotionalFlow,
        targetArc: args.targetArc
      },
      instructions: [
        'Analyze the current emotional flow data',
        'Map each screen to an emotional beat: setup, tension, comic-relief, vulnerability, reflection, catharsis',
        'Identify gaps where emotional transitions are jarring',
        'Recommend adjustments to achieve the target arc: tension → humor → reflection',
        'Consider: respondent fatigue, engagement peaks/valleys, completion motivation',
        'Return a structured emotional arc map with recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'arcMap', 'summary'],
      properties: {
        success: { type: 'boolean' },
        arcMap: { type: 'array' },
        summary: { type: 'string' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const designTokenExtractionTask = defineTask('design-token-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract Design Tokens',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Systems Engineer',
      task: 'Extract and normalize design tokens from the Good Morning Nikhil codebase',
      context: {
        auditResults: args.auditResults,
        showSegments: args.showSegments,
        focusAreas: args.focusAreas
      },
      instructions: [
        'Read src/app/globals.css and extract all CSS custom properties',
        'Identify per-show-segment color palettes and typography',
        'Document spacing scale, animation durations, easing functions',
        'Flag inconsistent or undefined tokens',
        'Propose a normalized token structure for consistency',
        'Return the extracted tokens and normalization recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tokens', 'normalized'],
      properties: {
        success: { type: 'boolean' },
        tokens: { type: 'object' },
        normalized: { type: 'object' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const inconsistencyResolutionTask = defineTask('inconsistency-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Inconsistency Resolutions',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Lead and Design QA Specialist',
      task: 'Create a prioritized plan to resolve all design and narrative inconsistencies',
      context: {
        designAudit: args.designAudit,
        narrativeAudit: args.narrativeAudit,
        emotionalArcMap: args.emotionalArcMap,
        designTokens: args.designTokens,
        focusAreas: args.focusAreas
      },
      instructions: [
        'Consolidate all issues from design and narrative audits',
        'Prioritize by: impact on emotional journey > visual inconsistency > minor polish',
        'Group issues by focus area: transitions, typography, segment-identity, audio-vo',
        'For each issue, specify: file to change, type of change, expected outcome',
        'Estimate total changes and flag any breaking changes',
        'Return structured resolution plan'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'issueCount', 'highPriority', 'keyImprovements'],
      properties: {
        success: { type: 'boolean' },
        issueCount: { type: 'number' },
        highPriority: { type: 'array' },
        keyImprovements: { type: 'array' },
        estimatedChanges: { type: 'number' },
        transitionIssues: { type: 'array' },
        typographyIssues: { type: 'array' },
        segmentIssues: { type: 'array' },
        audioIssues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const visualTransitionFixTask = defineTask('visual-transition-fix', (args, taskCtx) => ({
  kind: 'skill',
  title: 'Fix Visual Transitions',
  skill: {
    name: 'code',
    context: {
      role: 'Motion Designer and Animation Engineer',
      task: 'Implement visual transition improvements for Good Morning Nikhil',
      issues: args.issues,
      emotionalArcMap: args.emotionalArcMap,
      projectRoot: args.projectRoot,
      instructions: [
        'Read src/lib/animations.ts and src/components/SceneTransition.tsx',
        'Implement smoother transitions between show segments',
        'Ensure transition timing supports the emotional arc',
        'Update animation durations and easing to match TV broadcast feel',
        'Add any missing transition effects',
        'Run tests to verify changes'
      ]
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const typographyLayoutFixTask = defineTask('typography-layout-fix', (args, taskCtx) => ({
  kind: 'skill',
  title: 'Fix Typography & Layout',
  skill: {
    name: 'code',
    context: {
      role: 'Typography Expert and Layout Engineer',
      task: 'Implement typography and layout improvements for Good Morning Nikhil',
      issues: args.issues,
      designTokens: args.designTokens,
      projectRoot: args.projectRoot,
      instructions: [
        'Read src/app/globals.css and src/components/Captions.tsx',
        'Normalize font sizes, line heights, and spacing across all screens',
        'Ensure caption styling is consistent and readable',
        'Update CSS custom properties for typography tokens',
        'Fix any layout inconsistencies in QuestionPrompt and UI components',
        'Run tests to verify changes'
      ]
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const segmentIdentityFixTask = defineTask('segment-identity-fix', (args, taskCtx) => ({
  kind: 'skill',
  title: 'Fix Show Segment Identity',
  skill: {
    name: 'code',
    context: {
      role: 'Brand Designer and Visual Identity Specialist',
      task: 'Implement show segment identity improvements for Good Morning Nikhil',
      issues: args.issues,
      designTokens: args.designTokens,
      showSegments: args.showSegments,
      projectRoot: args.projectRoot,
      instructions: [
        'Read src/data/screens.ts to understand show segment definitions',
        'Ensure each show (Feud, Bachelor, Shark Tank, Survivor, Maury) has distinct visual identity',
        'Add or update show-specific color variables if needed',
        'Ensure backgrounds, overlays, and UI elements match each show\'s aesthetic',
        'Maintain cohesion as part of the "Good Morning Nikhil" meta-show',
        'Run tests to verify changes'
      ]
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const audioVoPacingFixTask = defineTask('audio-vo-pacing-fix', (args, taskCtx) => ({
  kind: 'skill',
  title: 'Fix Audio/VO Pacing',
  skill: {
    name: 'code',
    context: {
      role: 'Audio Director and Pacing Specialist',
      task: 'Implement audio/VO pacing improvements for Good Morning Nikhil',
      issues: args.issues,
      emotionalArcMap: args.emotionalArcMap,
      projectRoot: args.projectRoot,
      instructions: [
        'Read src/data/screens.ts to check audio paths and uiRevealAt timings',
        'Read src/hooks/useCaptions.ts to understand caption sync logic',
        'Adjust uiRevealAt timings for better pacing',
        'Ensure caption timing matches VO delivery',
        'Update any duration overrides that feel off',
        'Verify pacing supports the emotional arc (tension → humor → reflection)',
        'Run tests to verify changes'
      ]
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Quality',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer and Design Reviewer',
      task: 'Validate all design and narrative improvements for Good Morning Nikhil',
      context: {
        improvements: args.improvements,
        focusAreas: args.focusAreas,
        emotionalArcMap: args.emotionalArcMap,
        projectRoot: args.projectRoot
      },
      instructions: [
        'Run npm test to verify all tests pass',
        'Check that CSS changes are applied correctly',
        'Verify screen data is valid in src/data/screens.ts',
        'Confirm transitions and animations work as expected',
        'Assess if the emotional arc is better supported now',
        'Return validation results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'testResults'],
      properties: {
        passed: { type: 'boolean' },
        testResults: { type: 'object' },
        issues: { type: 'array' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const generateReportTask = defineTask('generate-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Final Report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Design Documentation Specialist',
      task: 'Generate a comprehensive report of the design and narrative improvements',
      context: args,
      instructions: [
        'Summarize the audit findings',
        'List all improvements made',
        'Document the emotional arc map',
        'Include validation results',
        'Provide recommendations for future iterations',
        'Return the report as structured JSON'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'report'],
      properties: {
        success: { type: 'boolean' },
        report: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
