import { NextRequest, NextResponse } from "next/server";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { findEdgeTXMountPoint } from "@/lib/usb-detector";
import {
  RADIOS,
  DRONES,
  ELRS_BEGINNER_CONFIG,
  generateEdgeTXModel,
} from "@/lib/config-templates";

export const dynamic = "force-dynamic";

/**
 * POST /api/inject
 * Injects an EdgeTX model template onto the mounted SD card.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { radioId, droneId, bindingPhrase } = body;

    // Validate inputs
    const radio = RADIOS[radioId];
    const drone = DRONES[droneId];
    if (!radio || !drone) {
      return NextResponse.json(
        { success: false, error: `Radio "${radioId}" ou drone "${droneId}" inconnu` },
        { status: 400 }
      );
    }

    // Find EdgeTX SD card
    const mountPoint = findEdgeTXMountPoint();
    if (!mountPoint) {
      return NextResponse.json({
        success: false,
        error: "Aucune carte SD EdgeTX détectée. Branche ta radio en USB mode stockage.",
        hint: "Sur ta radio: SYS → USB → Storage Mode",
      });
    }

    // Generate the model template
    const elrs = { ...ELRS_BEGINNER_CONFIG, bindingPhrase: bindingPhrase || "" };
    const template = generateEdgeTXModel(radio, drone, elrs);

    // Ensure MODELS directory exists
    const modelsDir = join(mountPoint, "MODELS");
    if (!existsSync(modelsDir)) {
      mkdirSync(modelsDir, { recursive: true });
    }

    // Sanitize and write model file
    const safeFilename = template.filename.replace(/\.\./g, "_").replace(/[\/\\]/g, "");
    const filePath = join(modelsDir, safeFilename);
    if (!filePath.startsWith(modelsDir)) {
      return NextResponse.json(
        { success: false, error: "Nom de fichier invalide" },
        { status: 400 }
      );
    }
    const alreadyExists = existsSync(filePath);

    writeFileSync(filePath, template.content, "utf-8");

    return NextResponse.json({
      success: true,
      message: alreadyExists
        ? `Modèle "${template.filename}" mis à jour sur la carte SD`
        : `Modèle "${template.filename}" créé sur la carte SD`,
      filePath,
      mountPoint,
      template: {
        filename: template.filename,
        radioId: template.radioId,
        droneId: template.droneId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inject — Check if injection is possible (SD card mounted)
 */
export async function GET() {
  const mountPoint = findEdgeTXMountPoint();

  return NextResponse.json({
    success: true,
    sdCardMounted: !!mountPoint,
    mountPoint: mountPoint || null,
    availableRadios: Object.keys(RADIOS),
    availableDrones: Object.keys(DRONES),
  });
}
