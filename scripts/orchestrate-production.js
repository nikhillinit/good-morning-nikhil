import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * TV Bezel & Daytime Broadcast Design Schema Requirements
 * Following the bdistill structured format concept constraint.
 */
const TV_BROADCAST_CONTEXT = `
MANDATORY CONTEXT FOR "GOOD MORNING, NIKHIL" UI REWRITE:
- The UI MUST be enclosed within a physical 'TelevisionFrame' object (a thick digital bezel). It cannot be "all screen".
- ARCADE/8-BIT CLICHES ARE BANNED: Do not use Press Start 2P, do not use inserting coins.
- This is a continuous 'Daytime Broadcast TV show' narrative.
- Use Light Mode/High Contrast layouts inside the screen.
- Use bold, modern broadcast typography (e.g., Bebas Neue / font-display) for chyrons/bumpers. 
- The background is a "cheery daytime HBO style" flash over a CRT base.
- All actions/copies must use television parlance ("TUNE IN", "PENDING SELECTION", "CHANGING CHANNEL", "SELECT TO CONTINUE").
`;

/**
 * Phase 1A: Discovery & Information Architecture Wireframing
 */
const uiUxDesignerTask = defineTask('ui-ux-designer-wireframe', (args) => ({
  kind: 'agent',
  title: `Phase 1A: UX Designer Structural Wireframe for: ${args.component}`,
  agent: {
    name: 'ui-ux-designer',
    prompt: {
      role: 'UX Designer',
      task: 'Define the structural HTML/React wireframe layout. Enforce a bounding TV box container and remove any legacy game/arcade structural components.',
      context: `${TV_BROADCAST_CONTEXT}\n\nTarget Component: ${args.component}\nRequirements: ${args.requirements}\nFeedback from Validation/User: ${args.feedback || 'None'}`,
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        wireframeConcept: { type: 'string', description: 'Detailed reasoning for the structural casing' },
        reactChanges: { type: 'string', description: 'Proposed React component changes establishing the bounding Television box.' }
      },
      required: ['wireframeConcept', 'reactChanges']
    }
  }
}));

/**
 * Phase 1B: UI Design & Aesthetic Application
 */
const uiUxProMaxTask = defineTask('ui-ux-promax-aesthetics', (args) => ({
  kind: 'agent',
  title: `Phase 1B: UI Designer Aesthetics for: ${args.component}`,
  agent: {
    name: 'ui-ux-pro-max',
    prompt: {
      role: 'UI Designer',
      task: 'Apply daytime broadcast TV styling, CSS design systems, typography (font-display), and colors to the wireframe.',
      context: `${TV_BROADCAST_CONTEXT}\n\nApproved Wireframe: ${args.wireframe}`,
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        aestheticChoices: { type: 'string', description: 'Justification for CSS, typography, and copy changes' },
        cssChanges: { type: 'string', description: 'Proposed CSS classes (Tailwind v4) or properties implementing the light-mode TV look.' },
        copyChanges: { type: 'string', description: 'Proposed text strings for interactive elements matching broadcast TV parlance.' }
      },
      required: ['aestheticChoices', 'cssChanges', 'copyChanges']
    }
  }
}));

/**
 * Phase 1C: Validation against brand guidelines
 */
const uiVisualValidatorTask = defineTask('ui-visual-validation', (args) => ({
  kind: 'agent',
  title: `Phase 1C: Visual Validation for: ${args.component}`,
  agent: {
    name: 'ui-visual-validator',
    prompt: {
      role: 'UX Researcher / Validator',
      task: 'Ensure the proposed layout thoroughly eliminates 8-bit/Arcade themes and rigidly adheres to the "Daytime Television Broadcast" logic.',
      context: `${TV_BROADCAST_CONTEXT}\n\nProposed React/Copy: ${args.reactChanges}\nProposed CSS: ${args.cssChanges}`,
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        approved: { type: 'boolean' },
        critique: { type: 'string', description: 'Violations found, if any, regarding the arcade constraint or TV bezel structure.' }
      },
      required: ['approved', 'critique']
    }
  }
}));

/**
 * Phase 2: Execution Tasks
 */
const applyCodeTask = defineTask('apply-code', (args) => ({
  kind: 'agent', // Acting as an execution agent to cleanly swap out code
  title: 'Apply React/CSS modifications',
  agent: {
    name: 'code-executor',
    prompt: {
      role: 'Frontend Engineer',
      task: 'Apply the structural UI changes and aesthetics verbatim to the codebase.',
      context: `Design State Spec:\n${args.spec}`,
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        filesChanged: { type: 'array', items: { type: 'string' } }
      },
      required: ['success', 'filesChanged']
    }
  }
}));

const generateAudioTask = defineTask('generate-audio', (args) => ({
  kind: 'agent',
  title: 'Generate VO Audio Asset',
  agent: {
    name: 'audio-director',
    prompt: {
      role: 'Audio Director',
      task: 'Simulate or orchestrate the VO audio generation for the provided script. Ensure no arcade tropes exist in spoken dialogue.',
      context: `${TV_BROADCAST_CONTEXT}\n\nScript: ${args.script}\nAudio Feedback: ${args.audioFeedback || 'None'}`,
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        audioPath: { type: 'string' }
      },
      required: ['audioPath']
    }
  }
}));

const generateVideoTask = defineTask('generate-video', (args) => ({
  kind: 'agent',
  title: 'Generate Cinematic Background Video',
  agent: {
    name: 'video-director',
    prompt: {
      role: 'Video Director',
      task: 'Simulate or orchestrate the cinematic video generation for the provided screen ID. The script generate-videos.mjs manages the visual payload loop.',
      context: `${TV_BROADCAST_CONTEXT}\n\nTarget Screen ID: ${args.screenId}\nCinematic prompt: ${args.videoPrompt}\nVideo Feedback: ${args.videoFeedback || 'None'}`,
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        videoPath: { type: 'string' }
      },
      required: ['videoPath']
    }
  }
}));

/**
 * Master Production Orchestrator Process 
 */
export async function process(inputs, ctx) {
  let isApproved = false;
  let layoutFeedback = null;
  let currentDesignState = null;
  let executionFeedback = null;
  let audioFeedback = null;
  let videoFeedback = null;

  ctx.log(`[Orchestrator] Starting UX/UI Phase-Gated Production for: ${inputs.component}`);

  // ---------------------------------------------------------
  // PHASE 1: RESEARCH, DESIGN & VALIDATION LOOP
  // ---------------------------------------------------------
  while (!isApproved) {
    ctx.log(`[Orchestrator] Running Phase 1A: ui-ux-designer wireframing...`);
    const uxRes = await ctx.task(uiUxDesignerTask, {
      component: inputs.component,
      requirements: inputs.requirements,
      feedback: layoutFeedback
    });

    ctx.log(`[Orchestrator] Running Phase 1B: ui-ux-pro-max aesthetic layering...`);
    const uiRes = await ctx.task(uiUxProMaxTask, {
      component: inputs.component,
      wireframe: uxRes.value.reactChanges
    });

    ctx.log(`[Orchestrator] Running Phase 1C: ui-visual-validator compliance check...`);
    const valRes = await ctx.task(uiVisualValidatorTask, {
      component: inputs.component,
      reactChanges: uxRes.value.reactChanges + "\n" + uiRes.value.copyChanges,
      cssChanges: uiRes.value.cssChanges
    });

    currentDesignState = {
      wireframe: uxRes.value.reactChanges,
      cssChanges: uiRes.value.cssChanges,
      copyChanges: uiRes.value.copyChanges,
      aestheticReasoning: uiRes.value.aestheticChoices,
      validatorCritique: valRes.value.critique,
      validatorApproved: valRes.value.approved
    };

    // Breakpoint 1: Mandatory Human Design Review Gate
    const bp1 = await ctx.breakpoint({
      question: `Approve the structural wireframe & aesthetics for ${inputs.component}? Validator says: ${valRes.value.approved ? "Compliant" : "Non-Compliant"}`,
      title: 'Phase 1: Design Review Framework Gate',
      expert: 'designer',
      context: currentDesignState
    });

    if (bp1.approved) {
      isApproved = true;
      ctx.log('[Orchestrator] Design System Approved. Proceeding to Execution Phase.');
    } else {
      layoutFeedback = bp1.feedback;
      ctx.log(`[Orchestrator] Design Rejected by Human: ${layoutFeedback}. Looping Phase 1.`);
    }
  }

  // ---------------------------------------------------------
  // PHASE 2: EXECUTE & REVIEW LOOP
  // ---------------------------------------------------------
  let finalReviewPassed = false;
  let executionLoopCount = 0;

  while (!finalReviewPassed && executionLoopCount < 5) {
    executionLoopCount++;
    ctx.log(`[Orchestrator] Executing Phase 2 changes (Attempt ${executionLoopCount})`);

    // Execute UI changes, Audio Generation, and Video Generation concurrently
    const [uiResult, audioResult, videoResult] = await ctx.parallel.all([
      () => ctx.task(applyCodeTask, { spec: JSON.stringify(currentDesignState), feedback: executionFeedback }),
      () => ctx.task(generateAudioTask, { script: inputs.voScript, audioFeedback: audioFeedback }),
      () => ctx.task(generateVideoTask, { screenId: inputs.screenId, videoPrompt: inputs.videoPrompt, videoFeedback: videoFeedback })
    ]);

    // Time Buffer to allow Next.js fast refresh
    await ctx.sleepUntil(Date.now() + 2000); 

    // Breakpoint 2: Final QA / Integration Review Gate
    const bp2 = await ctx.breakpoint({
      question: `Review localhost:3000, listen to ${audioResult.value.audioPath}, and watch ${videoResult.value.videoPath}. Approve Final Assets?`,
      title: 'Phase 2: Final Integration Review Gate',
      expert: 'producer',
      context: {
        filesChanged: uiResult.value.filesChanged,
        audioGenerated: audioResult.value.audioPath,
        videoGenerated: videoResult.value.videoPath
      }
    });

    if (bp2.approved) {
      finalReviewPassed = true;
      ctx.log('[Orchestrator] Final Integration Approved! Branch complete.');
    } else {
      ctx.log(`[Orchestrator] Integration Rejected: ${bp2.feedback}. Routing feedback vectors...`);
      executionFeedback = bp2.feedback;
      audioFeedback = bp2.feedback;
      videoFeedback = bp2.feedback;
    }
  }

  if (!finalReviewPassed) {
    return { success: false, reason: 'Failed to pass Phase 2 Q&A gates after 5 attempts.' };
  }

  return { success: true, component: inputs.component, audioFile: 'assets/output.mp3' };
}
