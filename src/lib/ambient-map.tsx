import type { ReactNode } from "react";
import {
  DustMotes,
  CandleFlicker,
  HazeDrift,
  FirelightVariation,
  SpotlightPulse,
  StageLightShimmer,
} from "@/components/ambient";

/**
 * Maps a screen bg path to its scene-specific ambient layer.
 * PaperShimmer is applied to ALL scenes separately in ScreenPlayer.
 */
export function getAmbientLayer(bg: string): ReactNode | null {
  const file = bg.split("/").pop() ?? "";

  switch (file) {
    case "cold-open-glitch.png":
    case "morning-desk.png":
    case "feud-board.png":
    case "control-room.png":
      return <DustMotes variant="standard" />;

    case "sponsor-pedestal.png":
      return <SpotlightPulse />;

    case "bachelor-mansion.png":
    case "limo-interior.png":
      return <CandleFlicker />;

    case "shark-warehouse.png":
      return <HazeDrift />;

    case "tribal-council.png":
      return <FirelightVariation />;

    case "maury-studio.png":
      return <StageLightShimmer />;

    case "credits-bg.png":
      return <DustMotes variant="closing" />;

    default:
      return null;
  }
}
