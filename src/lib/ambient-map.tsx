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
  // Strip extension so both .png and .webp resolve to the same ambient layer
  const raw = bg.split("/").pop() ?? "";
  const file = raw.replace(/\.(png|webp)$/, "");

  switch (file) {
    case "cold-open-glitch":
    case "morning-desk":
    case "feud-board":
    case "control-room":
      return <DustMotes variant="standard" />;

    case "sponsor-pedestal":
      return <SpotlightPulse />;

    case "bachelor-mansion":
    case "limo-interior":
      return <CandleFlicker />;

    case "shark-warehouse":
      return <HazeDrift />;

    case "tribal-council":
      return <FirelightVariation />;

    case "maury-studio":
      return <StageLightShimmer />;

    case "credits-bg":
      return <DustMotes variant="closing" />;

    default:
      return null;
  }
}
