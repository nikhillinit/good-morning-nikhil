/**
 * @process visual-polish-immersion
 * @description Visual polish process for Good Morning Nikhil TV survey app.
 * Handles: TV frame removal after intro, illustrated backgrounds, darker answer cards,
 * brand reveal animation, and character art positioning fixes.
 *
 * Combines web development for code changes, UX/UI design for quality assurance,
 * and game development art pipeline patterns for illustrated asset creation.
 *
 * @inputs {
 *   projectName: string,
 *   requirements: array,
 *   targetUrl: string,
 *   maxIterations?: number,
 *   artStyle?: string
 * }
 * @outputs {
 *   success: boolean,
 *   codeChanges: array,
 *   assetSpecs: array,
 *   styleGuide: object,
 *   verificationReport: object
 * }
 *
 * @skill specializations/web-development/skills/nextjs-app-router
 * @skill specializations/web-development/skills/tailwind-css
 * @skill specializations/web-development/skills/react-development
 * @skill specializations/ux-ui-design/skills/screenshot-comparison
 * @skill specializations/mobile-development/skills/mobile-animation
 * @agent specializations/web-development/agents/nextjs-developer
 * @agent specializations/web-development/agents/react-developer
 * @agent specializations/web-development/agents/animation-developer
 * @agent specializations/ux-ui-design/agents/visual-qa-scorer
 * @agent specializations/ux-ui-design/agents/ui-implementer
 * @agent specializations/ux-ui-design/agents/design-mock-analyzer
 * @agent specializations/game-development/agents/art-director-agent
 * @agent specializations/game-development/agents/technical-artist
 *
 * @references
 * - specializations/game-development/art-asset-pipeline.js
 * - specializations/game-development/animation-implementation.js
 * - specializations/ux-ui-design/pixel-perfect-implementation.js
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Save reference to Node's process global before export function shadows it
const nodeProcess = globalThis.process;

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const analyzeCurrentStateTask = defineTask('analyze-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Current Visual State',
  agent: {
    name: 'visual-qa-scorer',
    prompt: {
      role: 'Visual QA Analyst',
      task: 'Analyze the current visual state of the Good Morning Nikhil TV survey app',
      context: {
        projectPath: args.projectPath,
        screens: [
          'intro-tv (relationship picker)',
          'gmn-feud-kickoff (start button)',
          'feud-top3 (three text inputs)',
          'commercial-break (brand input)',
          'bachelor-roses (rose ceremony)'
        ],
        focusAreas: [
          'TelevisionFrame visibility across screens',
          'Answer card text contrast/legibility',
          'Background asset types (real photos vs animated)',
          'Commercial break brand reveal moment',
          'Character positioning in bachelor-roses screen'
        ]
      },
      instructions: [
        'Read src/components/ambient/TelevisionFrame.tsx to understand frame logic',
        'Read src/components/ScreenPlayer.tsx to understand zoomedIn prop usage',
        'Read src/components/ui-inputs/index.tsx for answer card styling',
        'Read src/data/screens.ts for commercial-break and bachelor-roses config',
        'List all background images in public/sets/',
        'Document current state for each focus area'
      ],
      outputFormat: 'JSON with currentState object containing: frameLogic, cardContrast, backgroundAssets, brandReveal, characterPositioning'
    },
    outputSchema: {
      type: 'object',
      required: ['currentState'],
      properties: {
        currentState: {
          type: 'object',
          properties: {
            frameLogic: { type: 'object' },
            cardContrast: { type: 'object' },
            backgroundAssets: { type: 'array' },
            brandReveal: { type: 'object' },
            characterPositioning: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const implementFrameRemovalTask = defineTask('implement-frame-removal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement TV Frame Removal via Screen Data',
  agent: {
    name: 'nextjs-developer',
    prompt: {
      role: 'Next.js Frontend Developer following data-driven architecture',
      task: 'Add hideTvFrame boolean to screen data objects to control frame visibility',
      context: {
        requirement: 'TV frame should be visible only on intro screens, then disappear for survey proper',
        designConstraint: 'CRITICAL: Do NOT hardcode screenIndex >= 2. This is brittle and breaks if onboarding screens are added.',
        approach: 'Add a hideTvFrame: true property to each screen object in src/data/screens.ts that should hide the frame',
        currentLogic: 'zoomedIn={screen.bg !== "crt"} in ScreenPlayer.tsx',
        targetLogic: 'zoomedIn={screen.hideTvFrame === true} - data-driven, not index-based'
      },
      instructions: [
        'Read src/data/screens.ts to understand the screen object schema',
        'Add hideTvFrame?: boolean to the Screen type definition',
        'Add hideTvFrame: true to all screens AFTER the intro screens (gmn-feud-kickoff onwards)',
        'Keep hideTvFrame: false (or omit) for intro-tv and any CRT boot screens',
        'Modify ScreenPlayer.tsx to use zoomedIn={screen.hideTvFrame === true}',
        'This approach is future-proof: adding new intro screens just requires setting hideTvFrame appropriately'
      ],
      outputFormat: 'JSON with changes array listing file paths and descriptions'
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'success'],
      properties: {
        success: { type: 'boolean' },
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              description: { type: 'string' },
              linesModified: { type: 'number' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const implementDarkerCardsTask = defineTask('implement-darker-cards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Darker Answer Cards via Design System',
  agent: {
    name: 'react-developer',
    prompt: {
      role: 'React UI Developer following Code-as-Truth design system',
      task: 'Increase answer card background opacity for better text contrast using semantic CSS variables',
      context: {
        requirement: 'Answer text needs better contrast - modify the --surface CSS variable to increase opacity',
        designConstraint: 'CRITICAL: Do NOT use literal Tailwind classes like bg-black/80. Must use semantic tokens from DESIGN.md',
        targetFile: 'src/app/globals.css',
        targetVariable: '--surface',
        targetPrimitive: 'InputField component (not raw classes in ui-inputs/index.tsx)',
        semanticClasses: ['bg-surface', 'text-foreground', 'text-muted']
      },
      instructions: [
        'Read DESIGN.md to understand the Code-as-Truth philosophy and semantic token system',
        'Read src/app/globals.css to find the current --surface CSS variable definition',
        'Modify the --surface variable alpha/opacity value to approximately 80% (e.g., rgba with 0.8 alpha)',
        'Verify the InputField primitive uses bg-surface (not raw Tailwind classes)',
        'Ensure text uses text-foreground semantic class for contrast',
        'Do NOT modify ui-inputs/index.tsx with literal bg-black/80 - this violates design system'
      ],
      outputFormat: 'JSON with changes array showing CSS variable modifications'
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'success'],
      properties: {
        success: { type: 'boolean' },
        changes: { type: 'array' },
        contrastBefore: { type: 'string' },
        contrastAfter: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Art Direction task (from game-development/art-asset-pipeline pattern)
const artDirectionTask = defineTask('art-direction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Art Direction & Style Guide',
  agent: {
    name: 'art-director-agent',
    prompt: {
      role: 'Art Director',
      task: 'Define unified art direction for cinematic TV broadcast backgrounds',
      context: {
        projectName: 'Good Morning Nikhil',
        artStyle: args.artStyle || 'painterly-cinematic',
        designPhilosophy: 'CRITICAL: This is a cinematic broadcast TV experience, NOT an arcade game. Emulate pre-recorded, high-fidelity television footage.',
        showThemes: [
          'Family Feud - game show energy, dramatic studio lighting, blue/gold palette',
          'The Bachelor - romantic, elegant, soft focus cinematography, rose reds and golds',
          'Shark Tank - industrial, dramatic warehouse lighting, cinematic depth',
          'Survivor - tribal, natural firelit atmosphere, documentary realism',
          'Maury - daytime talk show, professional studio lighting, warm broadcast tones',
          'Commercial Break - premium advertising aesthetic, spotlight drama, broadcast quality'
        ],
        constraints: [
          'MUST feel like pre-recorded, cinematic broadcast television',
          'Stylized realism or painterly cinematic - NOT cartoon/arcade aesthetic',
          'Must work with animated overlays (dust motes, flicker, etc.)',
          'Consistent cinematic quality across all sets',
          'Dark enough for light text overlays with broadcast-quality contrast',
          'Reference daytime TV production values, not mobile game tropes'
        ]
      },
      instructions: [
        'Read DESIGN.md to understand the cinematic broadcast TV philosophy',
        'Define the overall visual style as "painterly cinematic" or "stylized realism" - NOT cartoon',
        'Create a master color palette inspired by broadcast TV color grading',
        'Define cinematic lighting approach (3-point lighting, color temperatures, depth)',
        'Establish character style guidelines that feel like TV talent, not game characters',
        'Create mood board references from actual TV show production stills',
        'Write style guide to .a5c/processes/assets/style-guide.md'
      ],
      outputFormat: 'JSON with styleGuide object containing: visualStyle, colorPalette, lightingApproach, characterStyle, moodBoards'
    },
    outputSchema: {
      type: 'object',
      required: ['styleGuide', 'styleGuidePath'],
      properties: {
        styleGuide: {
          type: 'object',
          properties: {
            visualStyle: { type: 'string' },
            colorPalette: { type: 'array' },
            lightingApproach: { type: 'string' },
            characterStyle: { type: 'string' },
            moodBoards: { type: 'array' }
          }
        },
        styleGuidePath: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const createAssetSpecsTask = defineTask('create-asset-specs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Illustrated Asset Specifications',
  agent: {
    name: 'design-mock-analyzer',
    prompt: {
      role: 'Visual Design Specialist',
      task: 'Create detailed specifications for illustrated background assets and brand reveal video based on the established style guide',
      context: {
        requirement: 'Replace real photo backgrounds with illustrated/cartoon versions. Create animated video for commercial-break brand reveal.',
        currentAssets: [
          'public/sets/feud-board.webp - Family Feud set',
          'public/sets/sponsor-pedestal.webp - Commercial break sponsor set',
          'public/sets/bachelor-mansion.webp - Bachelor mansion',
          'public/sets/limo-interior.webp - Limo interior',
          'public/sets/shark-warehouse.webp - Shark Tank warehouse',
          'public/sets/tribal-council.webp - Survivor tribal council',
          'public/sets/maury-studio.webp - Maury studio',
          'public/sets/control-room.webp - TV control room',
          'public/sets/credits-bg.webp - Credits background'
        ],
        videoRequirement: 'commercial-break.mp4 - 5 second dramatic sponsor reveal animation (smoke, spotlight, "SPONSORED BY" text)'
      },
      instructions: [
        'For each background, create a detailed illustration spec including: style (cartoon/illustrated), color palette, key elements to include, mood/atmosphere',
        'Ensure consistent art style across all sets for visual cohesion',
        'For the brand reveal video, specify: duration, keyframes, effects (smoke, spotlight), text animation, audio sync points',
        'Suggest AI generation prompts (Midjourney/DALL-E style) for each asset',
        'Write specs to .a5c/processes/assets/illustrated-backgrounds-spec.md',
        'Write video spec to .a5c/processes/assets/brand-reveal-video-spec.md'
      ],
      outputFormat: 'JSON with assetSpecs array and file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['assetSpecs', 'specFiles'],
      properties: {
        assetSpecs: { type: 'array' },
        specFiles: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const fixCharacterPositioningTask = defineTask('fix-character-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix Steve Character Positioning',
  agent: {
    name: 'ui-implementer',
    prompt: {
      role: 'UI Implementation Specialist with CSS stacking context expertise',
      task: 'Fix Steve character art layering in bachelor-roses screen using proper z-index stacking',
      context: {
        issue: 'Steve has floating hand placed on nothing. He should appear BEHIND the roses, with roses in foreground for rose ceremony composition.',
        screen: 'bachelor-roses',
        expectedLayout: 'Proper layering: Background → Steve character → Rose overlay layer → UI elements',
        layeringApproach: 'CRITICAL: This is a z-index stacking context issue, not just X/Y positioning. Consider layer masks and explicit z-index values.'
      },
      instructions: [
        'Find the bachelor-roses screen configuration in src/data/screens.ts',
        'Analyze the current z-index stacking context for all visual layers',
        'Identify all layers: background image, character art, rose elements, UI overlay',
        'Check if roses need a dedicated overlay layer with higher z-index than Steve',
        'Consider implementing a rose overlay layer mask that sits between Steve and the UI',
        'If layout fix: specify exact z-index values for each stacking layer',
        'If asset fix: document if Steve/roses need to be separate PNG layers with transparency',
        'Ensure the fix creates proper visual depth: Steve behind roses, roses behind UI'
      ],
      outputFormat: 'JSON with issueType, fixDescription, layerStructure (array of layers with z-index), and changes'
    },
    outputSchema: {
      type: 'object',
      required: ['issueType', 'fixDescription', 'layerStructure'],
      properties: {
        issueType: { type: 'string', enum: ['layout', 'asset', 'both'] },
        fixDescription: { type: 'string' },
        layerStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              layer: { type: 'string' },
              zIndex: { type: 'number' },
              notes: { type: 'string' }
            }
          }
        },
        changes: { type: 'array' },
        assetNote: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const verifyVisualQualityTask = defineTask('verify-visual-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Visual Quality',
  agent: {
    name: 'visual-qa-scorer',
    prompt: {
      role: 'Visual QA Specialist',
      task: 'Verify all visual changes meet quality standards',
      context: {
        changesImplemented: args.changesImplemented,
        targetUrl: args.targetUrl || 'http://localhost:3000'
      },
      instructions: [
        'Start the dev server if not running',
        'Navigate through intro screens and verify frame disappears at screen 2',
        'Check answer card contrast on feud-top3, commercial-break screens',
        'Verify brand reveal screen (commercial-break) has proper reveal moment (if video implemented)',
        'Check bachelor-roses for character positioning',
        'Score each area: pass/partial/fail with notes'
      ],
      outputFormat: 'JSON with verificationReport containing scores and notes for each area'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationReport', 'overallScore'],
      properties: {
        verificationReport: { type: 'object' },
        overallScore: { type: 'number' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

export async function process(inputs, ctx) {
  const {
    projectName = 'Good Morning Nikhil Visual Polish',
    requirements = [
      'Frame removal after intro screens',
      'Illustrated background assets',
      'Darker answer cards for contrast',
      'Brand reveal video animation',
      'Steve character positioning fix'
    ],
    targetUrl = 'http://localhost:3000',
    maxIterations = 3
  } = inputs;

  const results = {
    projectName,
    codeChanges: [],
    assetSpecs: [],
    verificationReport: null,
    success: false
  };

  ctx.log('info', `Starting Visual Polish Process: ${projectName}`);
  ctx.log('info', `Requirements: ${requirements.join(', ')}`);

  // ============================================================================
  // PHASE 1: ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current visual state...');

  const analysisResult = await ctx.task(analyzeCurrentStateTask, {
    projectPath: nodeProcess.cwd()
  });

  await ctx.breakpoint({
    question: `Current state analysis complete. Found: ${Object.keys(analysisResult.currentState || {}).length} areas analyzed. Review the current state before proceeding with changes?`,
    title: 'Analysis Complete - Review Current State',
    options: [
      { label: 'Proceed with all changes', value: 'all' },
      { label: 'Proceed with code changes only', value: 'code-only' },
      { label: 'Review analysis and adjust', value: 'review' }
    ]
  });

  // ============================================================================
  // PHASE 2: CODE CHANGES
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing code changes...');

  // 2.1 Frame removal
  const frameResult = await ctx.task(implementFrameRemovalTask, {
    currentState: analysisResult.currentState
  });
  results.codeChanges.push({ task: 'frame-removal', ...frameResult });

  // 2.2 Darker cards
  const cardsResult = await ctx.task(implementDarkerCardsTask, {
    currentState: analysisResult.currentState
  });
  results.codeChanges.push({ task: 'darker-cards', ...cardsResult });

  await ctx.breakpoint({
    question: `Code changes implemented: Frame removal (${frameResult.success ? 'success' : 'failed'}), Darker cards (${cardsResult.success ? 'success' : 'failed'}). Test the changes before proceeding?`,
    title: 'Code Changes Complete',
    options: [
      { label: 'Test and continue', value: 'continue' },
      { label: 'Pause for manual testing', value: 'pause' }
    ]
  });

  // ============================================================================
  // PHASE 3: ART DIRECTION (from game-development/art-asset-pipeline)
  // ============================================================================

  ctx.log('info', 'Phase 3: Establishing art direction and style guide...');

  const artDirectionResult = await ctx.task(artDirectionTask, {
    artStyle: inputs.artStyle || 'stylized-cartoon'
  });
  results.styleGuide = artDirectionResult.styleGuide;

  await ctx.breakpoint({
    question: `Art direction established: ${artDirectionResult.styleGuide?.visualStyle || 'stylized cartoon'}. Style guide written to ${artDirectionResult.styleGuidePath}. Review before generating asset specs?`,
    title: 'Art Direction Complete',
    options: [
      { label: 'Approve and continue', value: 'continue' },
      { label: 'Revise style direction', value: 'revise' }
    ]
  });

  // ============================================================================
  // PHASE 4: ASSET SPECIFICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating asset specifications based on style guide...');

  const assetSpecsResult = await ctx.task(createAssetSpecsTask, {
    currentAssets: analysisResult.currentState?.backgroundAssets,
    styleGuide: artDirectionResult.styleGuide,
    // Full asset list from inventory
    allAssets: [
      'intro-retro-tv.webp',
      'cold-open-glitch.webp',
      'morning-desk.webp',
      'feud-board.webp',
      'sponsor-pedestal.webp',
      'bachelor-mansion.webp',
      'limo-interior.webp',
      'shark-warehouse.webp',
      'tribal-council.webp',
      'maury-studio.webp',
      'control-room.webp',
      'credits-bg.webp'
    ]
  });
  results.assetSpecs = assetSpecsResult.assetSpecs;

  // ============================================================================
  // PHASE 5: CHARACTER POSITIONING FIX
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing character positioning...');

  const characterResult = await ctx.task(fixCharacterPositioningTask, {
    screen: 'bachelor-roses'
  });
  results.codeChanges.push({ task: 'character-positioning', ...characterResult });

  await ctx.breakpoint({
    question: `Character positioning analysis: Issue type is "${characterResult.issueType}". ${characterResult.fixDescription}. How would you like to proceed?`,
    title: 'Character Art Fix',
    options: [
      { label: 'Apply fix if code-based', value: 'apply' },
      { label: 'Add to asset specs for manual fix', value: 'asset' },
      { label: 'Skip for now', value: 'skip' }
    ]
  });

  // ============================================================================
  // PHASE 6: VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Verifying visual quality...');

  const verificationResult = await ctx.task(verifyVisualQualityTask, {
    changesImplemented: results.codeChanges,
    targetUrl
  });
  results.verificationReport = verificationResult.verificationReport;

  // ============================================================================
  // COMPLETION
  // ============================================================================

  results.success = verificationResult.overallScore >= 80;

  await ctx.breakpoint({
    question: `Visual polish process complete. Overall score: ${verificationResult.overallScore}%. ${results.success ? 'All requirements met!' : 'Some items need attention.'}`,
    title: 'Process Complete',
    options: [
      { label: 'Accept results', value: 'accept' },
      { label: 'Iterate on remaining issues', value: 'iterate' }
    ]
  });

  ctx.log('info', `Visual Polish Process Complete. Success: ${results.success}`);

  return results;
}
