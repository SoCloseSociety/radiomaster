import { NextRequest, NextResponse } from "next/server";
import { listBetaflightPorts } from "@/lib/betaflight-serial";
import { sendBetaflightCLI } from "@/lib/betaflight-cli";

export const dynamic = "force-dynamic";

/**
 * POST /api/betaflight/flash — Send CLI commands to Betaflight FC
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const commands: string[] = body.commands;
    const portPath: string | undefined = body.port;

    if (!commands || !Array.isArray(commands) || commands.length === 0) {
      return NextResponse.json(
        { success: false, error: "No commands provided" },
        { status: 400 }
      );
    }

    // Find FC port
    let targetPort = portPath;
    if (!targetPort) {
      const ports = await listBetaflightPorts();
      if (ports.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Aucun flight controller détecté. Branche ton drone en USB.",
        });
      }
      targetPort = ports[0];
    }

    // Send commands
    const result = await sendBetaflightCLI(targetPort, commands);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
