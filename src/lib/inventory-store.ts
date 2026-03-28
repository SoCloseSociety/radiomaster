/**
 * JSON file-based inventory store for FPV devices and profiles.
 * Stores data in a local JSON file so it persists between sessions.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { FPVDevice, FPVProfile, DeviceInventory } from "@/types/devices";

const DATA_DIR = join(process.cwd(), "data");
const INVENTORY_FILE = join(DATA_DIR, "inventory.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadInventory(): DeviceInventory {
  ensureDataDir();
  if (!existsSync(INVENTORY_FILE)) {
    return { devices: [], profiles: [] };
  }
  try {
    const raw = readFileSync(INVENTORY_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { devices: [], profiles: [] };
  }
}

function saveInventory(inventory: DeviceInventory) {
  ensureDataDir();
  writeFileSync(INVENTORY_FILE, JSON.stringify(inventory, null, 2), "utf-8");
}

// === Devices ===

export function getAllDevices(): FPVDevice[] {
  return loadInventory().devices;
}

export function getDevice(id: string): FPVDevice | undefined {
  return loadInventory().devices.find((d) => d.id === id);
}

export function upsertDevice(device: FPVDevice): FPVDevice {
  const inventory = loadInventory();
  const existingIdx = inventory.devices.findIndex((d) => d.id === device.id);

  if (existingIdx >= 0) {
    // Update: merge new data with existing
    inventory.devices[existingIdx] = {
      ...inventory.devices[existingIdx],
      ...device,
      detectedAt: inventory.devices[existingIdx].detectedAt, // keep original detection date
    };
  } else {
    inventory.devices.push(device);
  }

  saveInventory(inventory);
  return device;
}

export function removeDevice(id: string): boolean {
  const inventory = loadInventory();
  const before = inventory.devices.length;
  inventory.devices = inventory.devices.filter((d) => d.id !== id);
  saveInventory(inventory);
  return inventory.devices.length < before;
}

// === Profiles ===

export function getAllProfiles(): FPVProfile[] {
  return loadInventory().profiles;
}

export function getProfile(id: string): FPVProfile | undefined {
  return loadInventory().profiles.find((p) => p.id === id);
}

export function upsertProfile(profile: FPVProfile): FPVProfile {
  const inventory = loadInventory();
  const existingIdx = inventory.profiles.findIndex((p) => p.id === profile.id);

  if (existingIdx >= 0) {
    inventory.profiles[existingIdx] = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
  } else {
    inventory.profiles.push({
      ...profile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveInventory(inventory);
  return profile;
}

export function removeProfile(id: string): boolean {
  const inventory = loadInventory();
  const before = inventory.profiles.length;
  inventory.profiles = inventory.profiles.filter((p) => p.id !== id);
  saveInventory(inventory);
  return inventory.profiles.length < before;
}

/**
 * Auto-create a profile from a detected radio + drone combo
 */
export function autoCreateProfile(
  drone: FPVDevice,
  radio: FPVDevice,
  name?: string,
  bindingPhrase?: string
): FPVProfile {
  const profile: FPVProfile = {
    id: `profile-${Date.now()}`,
    name: name || `${drone.model} + ${radio.model}`,
    droneId: drone.id,
    radioId: radio.id,
    protocol: drone.protocol !== "unknown" ? drone.protocol : radio.protocol,
    bindingPhrase: bindingPhrase || undefined,
    notes: `Auto-created from detected devices`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return upsertProfile(profile);
}
