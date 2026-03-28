import { NextResponse } from "next/server";
import { detectFPVDevices, findSerialPorts, findEdgeTXMountPoint } from "@/lib/usb-detector";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const devices = detectFPVDevices();
    const serialPorts = findSerialPorts();
    const edgeTXMount = findEdgeTXMountPoint();

    return NextResponse.json({
      success: true,
      devices,
      serialPorts,
      edgeTXMount,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
