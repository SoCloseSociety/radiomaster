import { NextRequest, NextResponse } from "next/server";
import { getAllDevices, upsertDevice, removeDevice } from "@/lib/inventory-store";
import { FPVDevice } from "@/types/devices";

export const dynamic = "force-dynamic";

export async function GET() {
  const devices = getAllDevices();
  return NextResponse.json({ success: true, devices });
}

export async function POST(request: NextRequest) {
  try {
    const device: FPVDevice = await request.json();
    const saved = upsertDevice(device);
    return NextResponse.json({ success: true, device: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Device ID required" },
      { status: 400 }
    );
  }

  const removed = removeDevice(id);
  return NextResponse.json({ success: true, removed });
}
