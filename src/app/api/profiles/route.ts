import { NextRequest, NextResponse } from "next/server";
import {
  getAllProfiles,
  upsertProfile,
  removeProfile,
  autoCreateProfile,
} from "@/lib/inventory-store";
import { getAllDevices } from "@/lib/inventory-store";
import { FPVProfile } from "@/types/devices";

export const dynamic = "force-dynamic";

export async function GET() {
  const profiles = getAllProfiles();
  return NextResponse.json({ success: true, profiles });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Auto-create mode: provide droneId + radioId
    if (body.autoCreate && body.droneId && body.radioId) {
      const devices = getAllDevices();
      const drone = devices.find((d) => d.id === body.droneId);
      const radio = devices.find((d) => d.id === body.radioId);

      if (!drone || !radio) {
        return NextResponse.json(
          { success: false, error: "Drone or Radio not found in inventory" },
          { status: 404 }
        );
      }

      const profile = autoCreateProfile(drone, radio, body.name, body.bindingPhrase);
      return NextResponse.json({ success: true, profile });
    }

    // Manual create/update
    const profile: FPVProfile = body;
    const saved = upsertProfile(profile);
    return NextResponse.json({ success: true, profile: saved });
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
      { success: false, error: "Profile ID required" },
      { status: 400 }
    );
  }

  const removed = removeProfile(id);
  return NextResponse.json({ success: true, removed });
}
