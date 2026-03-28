import { NextResponse } from "next/server";
import { findEdgeTXMountPoint } from "@/lib/usb-detector";
import { parseEdgeTXSDCard } from "@/lib/edgetx-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mountPoint = findEdgeTXMountPoint();

    if (!mountPoint) {
      return NextResponse.json(
        {
          success: false,
          error: "No EdgeTX SD card detected. Make sure your radio is connected in USB Storage mode.",
        },
        { status: 404 }
      );
    }

    const config = parseEdgeTXSDCard(mountPoint);

    return NextResponse.json({
      success: true,
      mountPoint,
      config,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
