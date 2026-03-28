import { execSync } from "child_process";
import { readdirSync, existsSync, statSync } from "fs";
import { USBDeviceInfo, FPVDevice, ConnectionStatus } from "@/types/devices";
import { identifyDevice, isBetaflightFC, isEdgeTXRadio } from "./device-database";

interface SystemProfilerUSBDevice {
  _name: string;
  vendor_id?: string;
  product_id?: string;
  manufacturer?: string;
  serial_num?: string;
  location_id?: string;
  _items?: SystemProfilerUSBDevice[];
}

interface SystemProfilerUSBEntry {
  _name: string;
  _items?: SystemProfilerUSBDevice[];
}

function flattenUSBDevices(items: SystemProfilerUSBEntry[]): SystemProfilerUSBDevice[] {
  const devices: SystemProfilerUSBDevice[] = [];

  function walk(list: SystemProfilerUSBDevice[]) {
    for (const item of list) {
      if (item.vendor_id) {
        devices.push(item);
      }
      if (item._items) {
        walk(item._items);
      }
    }
  }

  for (const entry of items) {
    if (entry._items) {
      walk(entry._items);
    }
  }

  return devices;
}

export function scanUSBDevices(): USBDeviceInfo[] {
  try {
    const raw = execSync("system_profiler SPUSBDataType -json 2>/dev/null", {
      timeout: 10000,
      encoding: "utf-8",
    });

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.warn("Failed to parse system_profiler JSON:", parseErr);
      return [];
    }
    const usbData: SystemProfilerUSBEntry[] = parsed.SPUSBDataType || [];
    const flatDevices = flattenUSBDevices(usbData);

    return flatDevices.map((dev) => ({
      vendorId: (dev.vendor_id || "").replace("0x", "").split(" ")[0],
      productId: (dev.product_id || "").replace("0x", "").split(" ")[0],
      name: dev._name || "Unknown Device",
      manufacturer: dev.manufacturer || "Unknown",
      serialNumber: dev.serial_num,
      locationId: dev.location_id || "",
    }));
  } catch (error) {
    console.warn("USB scan failed:", error);
    return [];
  }
}

export function findSerialPorts(): string[] {
  const devDir = "/dev";
  try {
    return readdirSync(devDir)
      .filter(
        (f) =>
          f.startsWith("tty.usb") ||
          f.startsWith("tty.SLAB") ||
          f.startsWith("tty.wch") ||
          f.startsWith("cu.usb") ||
          f.startsWith("cu.SLAB") ||
          f.startsWith("cu.wch")
      )
      .map((f) => `${devDir}/${f}`);
  } catch {
    return [];
  }
}

export function findEdgeTXMountPoint(): string | null {
  // EdgeTX radios mount as USB mass storage
  // Common volume names: "NO NAME", "RM TX16S", "EDGETX", etc.
  const volumesDir = "/Volumes";
  try {
    const volumes = readdirSync(volumesDir);
    for (const vol of volumes) {
      const volPath = `${volumesDir}/${vol}`;
      try {
        const stat = statSync(volPath);
        if (!stat.isDirectory() && !stat.isSymbolicLink()) continue;
      } catch { continue; }

      // Check for EdgeTX SD card signature: must have RADIO/ folder with radio.yml
      const hasRadio = existsSync(`${volPath}/RADIO/radio.yml`);
      const hasModels = existsSync(`${volPath}/MODELS`);
      const hasEdgeTXVersion = existsSync(`${volPath}/edgetx.sdcard.version`);

      if (hasRadio || (hasModels && hasEdgeTXVersion)) {
        return volPath;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function detectFPVDevices(): FPVDevice[] {
  const usbDevices = scanUSBDevices();
  const serialPorts = findSerialPorts();
  const edgeTXMount = findEdgeTXMountPoint();
  const devices: FPVDevice[] = [];

  for (const usb of usbDevices) {
    const known = identifyDevice(usb.vendorId, usb.productId, usb.name);
    if (!known) continue;

    // Try to find matching serial port
    let serialPort: string | undefined;
    if (isBetaflightFC(usb.vendorId, usb.productId) || isEdgeTXRadio(usb.vendorId, usb.productId)) {
      serialPort = serialPorts.find(
        (p) => p.includes("usbmodem") || p.includes("SLAB") || p.includes("wchusbserial")
      );
    }

    const status: ConnectionStatus = (serialPort || edgeTXMount) ? "connected" : "disconnected";

    const device: FPVDevice = {
      id: `${usb.vendorId}:${usb.productId}:${usb.locationId}`,
      usbInfo: { ...usb, path: serialPort },
      category: known.category,
      brand: known.brand,
      model: known.model,
      protocol: known.protocol,
      firmware: known.firmware,
      status,
      detectedAt: new Date().toISOString(),
    };

    // If EdgeTX radio and SD card is mounted, add mount path to config
    if (isEdgeTXRadio(usb.vendorId, usb.productId) && edgeTXMount) {
      device.config = { sdCardPath: edgeTXMount };
    }

    devices.push(device);
  }

  return devices;
}
