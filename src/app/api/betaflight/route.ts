import { NextResponse } from "next/server";
import { listBetaflightPorts, readBetaflightConfig } from "@/lib/betaflight-serial";

export const dynamic = "force-dynamic";

/**
 * GET /api/betaflight — Detect and read Betaflight FC config via serial
 */
export async function GET() {
  try {
    // Find FC serial ports
    const ports = await listBetaflightPorts();

    if (ports.length === 0) {
      return NextResponse.json({
        success: false,
        ports: [],
        error: "Aucun flight controller détecté sur les ports série.",
        hint: "Branche ton drone en USB (le petit port sur le FC). Pas besoin de batterie. ENLÈVE LES HÉLICES !",
      });
    }

    // Try to read config from first FC found
    const config = await readBetaflightConfig(ports[0]);

    return NextResponse.json({
      success: config.success,
      ports,
      config,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
