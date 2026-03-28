/**
 * Betaflight serial communication via MSP protocol.
 * Reads FC configuration when a drone is connected via USB.
 */

import { SerialPort } from "serialport";
import {
  MSP,
  encodeMSPv2,
  decodeMSPv2,
  parseBoardInfo,
  parseFCVersion,
  parseCraftName,
  parsePIDs,
  parseRCTuning,
  parseRXConfig,
  SERIAL_RX_PROVIDERS,
} from "./msp-protocol";

export interface BetaflightReadResult {
  success: boolean;
  port: string;
  boardId: string;
  firmwareVersion: string;
  craftName: string;
  rxProvider: string;
  rxProviderName: string;
  pids: { roll: number[]; pitch: number[]; yaw: number[] } | null;
  rates: { rcRate: number[]; superRate: number[]; rcExpo: number[] } | null;
  error?: string;
}

/**
 * List available serial ports that might be Betaflight FCs.
 */
export async function listBetaflightPorts(): Promise<string[]> {
  try {
    const ports = await SerialPort.list();
    return ports
      .filter(
        (p) =>
          // STM32 VCP (most Betaflight FCs)
          (p.vendorId?.toLowerCase() === "0483" && p.productId?.toLowerCase() === "5740") ||
          // Other common FC USB IDs
          p.manufacturer?.toLowerCase().includes("stm") ||
          p.manufacturer?.toLowerCase().includes("betaflight") ||
          // macOS: /dev/tty.usbmodem*
          p.path.includes("usbmodem")
      )
      .map((p) => p.path);
  } catch {
    return [];
  }
}

/**
 * Send an MSP command and wait for response.
 * Uses write callback to ensure data is sent before waiting.
 * Properly cleans up listeners on timeout.
 */
function mspCommand(
  port: SerialPort,
  command: number,
  timeoutMs = 2000
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const frame = encodeMSPv2(command);
    let buffer = Buffer.alloc(0);
    let settled = false;

    const cleanup = () => {
      settled = true;
      clearTimeout(timer);
      port.removeListener("data", onData);
    };

    const timer = setTimeout(() => {
      if (!settled) {
        cleanup();
        reject(new Error(`MSP timeout for command ${command}`));
      }
    }, timeoutMs);

    const onData = (chunk: Buffer) => {
      if (settled) return;
      buffer = Buffer.concat([buffer, chunk]);
      const msg = decodeMSPv2(buffer);
      if (msg && msg.command === command) {
        cleanup();
        resolve(msg.data);
      }
    };

    port.on("data", onData);

    // Wait for write to complete before expecting response
    port.write(frame, (err) => {
      if (err && !settled) {
        cleanup();
        reject(new Error(`MSP write error: ${err.message}`));
      }
    });
  });
}

/**
 * Read Betaflight configuration from a serial port.
 */
export async function readBetaflightConfig(
  portPath: string
): Promise<BetaflightReadResult> {
  const result: BetaflightReadResult = {
    success: false,
    port: portPath,
    boardId: "",
    firmwareVersion: "",
    craftName: "",
    rxProvider: "",
    rxProviderName: "",
    pids: null,
    rates: null,
  };

  let port: SerialPort | null = null;

  try {
    port = new SerialPort({
      path: portPath,
      baudRate: 115200,
      autoOpen: false,
    });

    // Open port
    await new Promise<void>((resolve, reject) => {
      port!.open((err) => {
        if (err) reject(new Error(`Cannot open ${portPath}: ${err.message}`));
        else resolve();
      });
    });

    // Flush input buffer to discard bootloader or leftover data
    await new Promise<void>((resolve) => {
      port!.flush((err) => {
        if (err) console.warn("Port flush warning:", err);
        resolve();
      });
    });

    // Wait for FC to be ready after flush
    await new Promise((r) => setTimeout(r, 200));

    // Read board info
    try {
      const boardData = await mspCommand(port, MSP.BOARD_INFO);
      const board = parseBoardInfo(boardData);
      result.boardId = board.boardId;
    } catch (e) {
      console.warn("MSP BOARD_INFO failed:", e);
    }

    // Read firmware version
    try {
      const versionData = await mspCommand(port, MSP.FC_VERSION);
      result.firmwareVersion = parseFCVersion(versionData);
    } catch (e) {
      console.warn("MSP FC_VERSION failed:", e);
    }

    // Read craft name
    try {
      const nameData = await mspCommand(port, MSP.NAME);
      result.craftName = parseCraftName(nameData);
    } catch (e) {
      console.warn("MSP NAME failed:", e);
    }

    // Read RX config
    try {
      const rxData = await mspCommand(port, MSP.RX_CONFIG);
      const rxConfig = parseRXConfig(rxData);
      result.rxProvider = String(rxConfig.serialProvider);
      result.rxProviderName = SERIAL_RX_PROVIDERS[rxConfig.serialProvider] || "Unknown";
    } catch (e) {
      console.warn("MSP RX_CONFIG failed:", e);
    }

    // Read PIDs
    try {
      const pidData = await mspCommand(port, MSP.PID);
      result.pids = parsePIDs(pidData);
    } catch (e) {
      console.warn("MSP PID failed:", e);
    }

    // Read rates
    try {
      const rateData = await mspCommand(port, MSP.RC_TUNING);
      result.rates = parseRCTuning(rateData);
    } catch (e) {
      console.warn("MSP RC_TUNING failed:", e);
    }

    result.success = true;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  } finally {
    // Clean close — remove all listeners first
    if (port) {
      port.removeAllListeners("data");
      if (port.isOpen) {
        await new Promise<void>((resolve) => {
          port!.close((err) => {
            if (err) console.warn("Port close warning:", err);
            resolve();
          });
        });
      }
    }
  }

  return result;
}
