import { NextRequest, NextResponse } from "next/server";
import {
  SIMULATORS,
  SIMULATOR_TIPS,
  MAC_JOYSTICK_SETUP,
  generateSimModel,
  getAxisMapping,
} from "@/lib/simulator-templates";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const radioId = searchParams.get("radio") as "tx16s" | "pocket" | null;
  const simulatorId = searchParams.get("simulator");

  // Filter Mac-compatible simulators
  const macSimulators = SIMULATORS.filter((s) => s.platform.includes("mac"));
  const allSimulators = SIMULATORS;

  // Generate sim models for requested radio (or both)
  const simModels = radioId
    ? [generateSimModel(radioId)]
    : [generateSimModel("tx16s"), generateSimModel("pocket")];

  // Axis mappings
  let axisMappings = null;
  if (simulatorId && radioId) {
    axisMappings = getAxisMapping(simulatorId, radioId);
  }

  return NextResponse.json({
    success: true,
    macSimulators,
    allSimulators,
    simModels,
    axisMappings,
    tips: SIMULATOR_TIPS,
    joystickSetup: MAC_JOYSTICK_SETUP,
  });
}
