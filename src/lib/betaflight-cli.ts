/**
 * Betaflight CLI command sender via serial port.
 * Sends CLI commands directly to the FC without needing Betaflight Configurator.
 */

import { SerialPort } from "serialport";

export interface CLIResult {
  success: boolean;
  port: string;
  commandsSent: number;
  responses: string[];
  error?: string;
}

/**
 * Send CLI commands to Betaflight FC.
 * Opens serial, enters CLI mode (#), sends commands, then saves.
 */
export async function sendBetaflightCLI(
  portPath: string,
  commands: string[]
): Promise<CLIResult> {
  const result: CLIResult = {
    success: false,
    port: portPath,
    commandsSent: 0,
    responses: [],
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

    // Flush
    await new Promise<void>((resolve) => {
      port!.flush(() => resolve());
    });
    await sleep(300);

    // Enter CLI mode by sending '#'
    await writeAndWait(port, "#\n", 1000);
    result.responses.push("Entered CLI mode");

    // Send each command
    for (const cmd of commands) {
      const trimmed = cmd.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith("#")) continue;

      const response = await writeAndWait(port, trimmed + "\n", 500);
      result.commandsSent++;
      result.responses.push(`${trimmed} → ${response.trim().slice(0, 100)}`);

      // If it's the 'save' command, wait longer for reboot
      if (trimmed.toLowerCase() === "save") {
        await sleep(2000);
        result.responses.push("FC rebooting...");
      }
    }

    result.success = true;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  } finally {
    if (port) {
      port.removeAllListeners("data");
      if (port.isOpen) {
        await new Promise<void>((resolve) => {
          port!.close(() => resolve());
        });
      }
    }
  }

  return result;
}

function writeAndWait(port: SerialPort, data: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve) => {
    let buffer = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        port.removeListener("data", onData);
        resolve(buffer);
      }
    }, timeoutMs);

    const onData = (chunk: Buffer) => {
      if (settled) return;
      buffer += chunk.toString("utf-8");
      // If we see the CLI prompt '# ', the command is done
      if (buffer.includes("# ") || buffer.includes("Rebooting")) {
        settled = true;
        clearTimeout(timer);
        port.removeListener("data", onData);
        resolve(buffer);
      }
    };

    port.on("data", onData);
    port.write(data, (err) => {
      if (err && !settled) {
        settled = true;
        clearTimeout(timer);
        port.removeListener("data", onData);
        resolve(`ERROR: ${err.message}`);
      }
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
