import { NextRequest, NextResponse } from "next/server";
import {
  RADIOS,
  DRONES,
  ELRS_BEGINNER_CONFIG,
  ELRS_ADVANCED_CONFIG,
  generateEdgeTXModel,
  generateBetaflightCLI,
  generateAllTemplates,
  BEGINNER_TIPS,
} from "@/lib/config-templates";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const radioId = searchParams.get("radio");
  const droneId = searchParams.get("drone");
  const level = searchParams.get("level") || "beginner";
  const bindingPhrase = searchParams.get("bindingPhrase") || "";

  const elrs = level === "advanced"
    ? { ...ELRS_ADVANCED_CONFIG, bindingPhrase }
    : { ...ELRS_BEGINNER_CONFIG, bindingPhrase };

  // If specific combo requested
  if (radioId && droneId) {
    const radio = RADIOS[radioId];
    const drone = DRONES[droneId];

    if (!radio || !drone) {
      return NextResponse.json(
        { success: false, error: `Radio "${radioId}" ou drone "${droneId}" inconnu` },
        { status: 404 }
      );
    }

    const edgetxModel = generateEdgeTXModel(radio, drone, elrs);
    const betaflightCli = generateBetaflightCLI(drone, radio, elrs);

    return NextResponse.json({
      success: true,
      radio,
      drone,
      elrs,
      edgetxModel,
      betaflightCli,
      tips: BEGINNER_TIPS,
    });
  }

  // Return all combos
  const { edgetxModels, betaflightConfigs } = generateAllTemplates(elrs);

  return NextResponse.json({
    success: true,
    radios: RADIOS,
    drones: DRONES,
    elrs,
    edgetxModels,
    betaflightConfigs,
    tips: BEGINNER_TIPS,
  });
}
