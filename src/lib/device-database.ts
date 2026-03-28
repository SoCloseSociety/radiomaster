import { DeviceCategory, Protocol } from "@/types/devices";

interface KnownDevice {
  vendorId: string;
  productId: string;
  brand: string;
  model: string;
  category: DeviceCategory;
  protocol: Protocol;
  firmware: string;
}

// Known FPV USB device signatures (VID:PID)
export const KNOWN_DEVICES: KnownDevice[] = [
  // === RadioMaster Radios (EdgeTX) ===
  {
    vendorId: "1209",
    productId: "4f54",
    brand: "RadioMaster",
    model: "TX16S",
    category: "radio",
    protocol: "ELRS",
    firmware: "EdgeTX",
  },
  {
    vendorId: "1209",
    productId: "4f54",
    brand: "RadioMaster",
    model: "TX16S MK2",
    category: "radio",
    protocol: "ELRS",
    firmware: "EdgeTX",
  },
  {
    vendorId: "1209",
    productId: "4f54",
    brand: "RadioMaster",
    model: "Pocket",
    category: "radio",
    protocol: "ELRS",
    firmware: "EdgeTX",
  },
  {
    vendorId: "1209",
    productId: "4f54",
    brand: "RadioMaster",
    model: "Zorro",
    category: "radio",
    protocol: "ELRS",
    firmware: "EdgeTX",
  },
  {
    vendorId: "1209",
    productId: "4f54",
    brand: "RadioMaster",
    model: "Boxer",
    category: "radio",
    protocol: "ELRS",
    firmware: "EdgeTX",
  },
  // EdgeTX bootloader mode
  {
    vendorId: "0483",
    productId: "5720",
    brand: "EdgeTX",
    model: "Radio (Bootloader)",
    category: "radio",
    protocol: "unknown",
    firmware: "EdgeTX",
  },

  // === Flight Controllers (STM32 VCP - Betaflight) ===
  {
    vendorId: "0483",
    productId: "5740",
    brand: "STM32",
    model: "Flight Controller",
    category: "drone",
    protocol: "unknown",
    firmware: "Betaflight",
  },
  // iFlight Nazgul / SpeedyBee / generic BF FC
  {
    vendorId: "2e3c",
    productId: "df11",
    brand: "iFlight",
    model: "Flight Controller",
    category: "drone",
    protocol: "ELRS",
    firmware: "Betaflight",
  },

  // === DJI Devices ===
  {
    vendorId: "2ca3",
    productId: "001f",
    brand: "DJI",
    model: "FPV Goggles V2",
    category: "goggles",
    protocol: "DJI",
    firmware: "DJI",
  },
  {
    vendorId: "2ca3",
    productId: "0036",
    brand: "DJI",
    model: "Goggles 2",
    category: "goggles",
    protocol: "DJI",
    firmware: "DJI",
  },
  {
    vendorId: "2ca3",
    productId: "0042",
    brand: "DJI",
    model: "Goggles 3",
    category: "goggles",
    protocol: "DJI",
    firmware: "DJI",
  },
  {
    vendorId: "2ca3",
    productId: "0020",
    brand: "DJI",
    model: "FPV Remote Controller",
    category: "radio",
    protocol: "DJI",
    firmware: "DJI",
  },
  {
    vendorId: "2ca3",
    productId: "001e",
    brand: "DJI",
    model: "FPV Air Unit",
    category: "vtx",
    protocol: "DJI",
    firmware: "DJI",
  },
  {
    vendorId: "2ca3",
    productId: "0037",
    brand: "DJI",
    model: "O3 Air Unit",
    category: "vtx",
    protocol: "DJI",
    firmware: "DJI",
  },

  // === ELRS USB Receivers/Dongles ===
  {
    vendorId: "10c4",
    productId: "ea60",
    brand: "ELRS",
    model: "WiFi Receiver (CP210x)",
    category: "receiver",
    protocol: "ELRS",
    firmware: "ExpressLRS",
  },
  {
    vendorId: "1a86",
    productId: "7523",
    brand: "ELRS",
    model: "Receiver (CH340)",
    category: "receiver",
    protocol: "ELRS",
    firmware: "ExpressLRS",
  },

  // === FTDI-based devices (various FC/VTX) ===
  {
    vendorId: "0403",
    productId: "6001",
    brand: "Generic",
    model: "FTDI Serial Device",
    category: "unknown",
    protocol: "unknown",
    firmware: "unknown",
  },
];

export function identifyDevice(vendorId: string, productId: string, usbName?: string): KnownDevice | null {
  const vid = (vendorId || "").toLowerCase().replace(/^0x/, "");
  const pid = (productId || "").toLowerCase().replace(/^0x/, "");

  // First try exact VID:PID match
  const matches = KNOWN_DEVICES.filter(
    (d) => d.vendorId === vid && d.productId === pid
  );

  if (matches.length === 0) return null;

  // If multiple matches (like EdgeTX radios sharing same VID:PID), try to disambiguate from USB name
  if (matches.length > 1 && usbName) {
    const nameUpper = usbName.toUpperCase();
    const specific = matches.find((m) => nameUpper.includes(m.model.toUpperCase()));
    if (specific) return specific;

    // Check for keywords
    if (nameUpper.includes("TX16S")) return matches.find((m) => m.model.includes("TX16S")) || matches[0];
    if (nameUpper.includes("POCKET")) return matches.find((m) => m.model === "Pocket") || matches[0];
    if (nameUpper.includes("ZORRO")) return matches.find((m) => m.model === "Zorro") || matches[0];
    if (nameUpper.includes("BOXER")) return matches.find((m) => m.model === "Boxer") || matches[0];
  }

  return matches[0];
}

// Common Betaflight FC VID (STM32)
export function isBetaflightFC(vendorId: string, productId: string): boolean {
  const vid = (vendorId || "").toLowerCase().replace(/^0x/, "");
  const pid = (productId || "").toLowerCase().replace(/^0x/, "");
  return (vid === "0483" && pid === "5740") || (vid === "2e3c" && pid === "df11");
}

// EdgeTX radio detection
export function isEdgeTXRadio(vendorId: string, productId: string): boolean {
  const vid = (vendorId || "").toLowerCase().replace(/^0x/, "");
  const pid = (productId || "").toLowerCase().replace(/^0x/, "");
  return vid === "1209" && pid === "4f54";
}

// DJI device detection
export function isDJIDevice(vendorId: string): boolean {
  return (vendorId || "").toLowerCase().replace(/^0x/, "") === "2ca3";
}
