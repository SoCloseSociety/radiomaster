/**
 * EdgeTX SD Card Parser
 * Reads radio configuration and model files from a mounted EdgeTX SD card.
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { EdgeTXModel, EdgeTXRadioConfig, Protocol } from "@/types/devices";

interface RadioYamlData {
  generalSettings?: {
    name?: string;
  };
  version?: string;
}

export function parseEdgeTXSDCard(mountPath: string): EdgeTXRadioConfig | null {
  if (!existsSync(mountPath)) return null;

  const radioConfig: EdgeTXRadioConfig = {
    radioName: "EdgeTX Radio",
    firmwareVersion: "unknown",
    models: [],
  };

  // Read radio.yml — real EdgeTX format has "board: tx16s" and "semver: 2.7.1"
  const radioYml = join(mountPath, "RADIO", "radio.yml");
  if (existsSync(radioYml)) {
    try {
      const content = readFileSync(radioYml, "utf-8");

      // Board detection
      const boardMatch = content.match(/^board:\s*(.+)/m);
      if (boardMatch) {
        const board = boardMatch[1].trim().toLowerCase();
        const names: Record<string, string> = {
          tx16s: "RadioMaster TX16S", pocket: "RadioMaster Pocket",
          zorro: "RadioMaster Zorro", boxer: "RadioMaster Boxer",
        };
        radioConfig.radioName = names[board] || `EdgeTX ${board.toUpperCase()}`;
      }

      // Firmware version
      const semverMatch = content.match(/^semver:\s*(.+)/m);
      if (semverMatch) radioConfig.firmwareVersion = semverMatch[1].trim();
    } catch {
      // fallback to defaults
    }
  }

  // Read edgetx.sdcard.version for SD version
  const sdVersionFile = join(mountPath, "edgetx.sdcard.version");
  if (existsSync(sdVersionFile)) {
    try {
      const ver = readFileSync(sdVersionFile, "utf-8").trim();
      if (ver && radioConfig.firmwareVersion === "unknown") {
        radioConfig.firmwareVersion = ver;
      }
    } catch { /* ignore */ }
  }

  // Detect firmware version from FIRMWARE folder
  const firmwareDir = join(mountPath, "FIRMWARE");
  if (existsSync(firmwareDir)) {
    try {
      const files = readdirSync(firmwareDir);
      const fwFile = files.find((f) => f.endsWith(".bin") && f.includes("edgetx"));
      if (fwFile) {
        const match = fwFile.match(/edgetx-(\w+)-(\d+\.\d+\.\d+)/);
        if (match) {
          radioConfig.radioName = `RadioMaster ${match[1].toUpperCase()}`;
          radioConfig.firmwareVersion = match[2];
        }
      }
    } catch {
      // ignore
    }
  }

  // Parse model files from MODELS folder
  const modelsDir = join(mountPath, "MODELS");
  if (existsSync(modelsDir)) {
    try {
      const modelFiles = readdirSync(modelsDir).filter(
        (f) => f.endsWith(".yml") || f.endsWith(".bin")
      );

      for (const file of modelFiles) {
        const filePath = join(modelsDir, file);
        if (file.endsWith(".yml")) {
          const model = parseModelYaml(filePath, file);
          if (model) {
            radioConfig.models.push(model);
          }
        } else if (file.endsWith(".bin")) {
          // Binary model files can't be parsed but should be tracked
          radioConfig.models.push({
            name: file.replace(".bin", ""),
            filename: file,
            moduleBay: "internal",
            protocol: "unknown",
            channels: 16,
            trims: {},
            mixers: [],
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // Check for ELRS lua script config
  // ELRS lua script can have various names: ELRS.lua, elrsV3.lua, ExpressLRS.lua
  const elrsLuaPaths = [
    join(mountPath, "SCRIPTS", "TOOLS", "ELRS.lua"),
    join(mountPath, "SCRIPTS", "TOOLS", "elrs.lua"),
    join(mountPath, "SCRIPTS", "TOOLS", "elrsV3.lua"),
    join(mountPath, "SCRIPTS", "TOOLS", "ExpressLRS.lua"),
  ];
  const elrsLuaConfig = elrsLuaPaths.find((p) => existsSync(p)) || null;
  const elrsConfigFile = join(mountPath, "SCRIPTS", "ELRS", "config.lua");
  if (elrsLuaConfig || existsSync(elrsConfigFile)) {
    radioConfig.elrsConfig = {
      bindingPhrase: "",
      rate: 500,
      power: 250,
      switchMode: "Wide",
    };

    // Try to read ELRS config
    const configPath = existsSync(elrsConfigFile) ? elrsConfigFile : null;
    if (configPath) {
      try {
        const content = readFileSync(configPath, "utf-8");
        const bpMatch = content.match(/bindingPhrase\s*=\s*["']([^"']+)/);
        if (bpMatch) radioConfig.elrsConfig.bindingPhrase = bpMatch[1];
      } catch {
        // ignore
      }
    }
  }

  return radioConfig;
}

function parseModelYaml(filePath: string, filename: string): EdgeTXModel | null {
  try {
    const content = readFileSync(filePath, "utf-8");

    // Model name — real EdgeTX format: header:\n   name: "ModelName"
    const nameMatch = content.match(/name:\s*"?([^"\n]+)"?/);
    const modelName = nameMatch ? nameMatch[1].trim() : filename.replace(".yml", "");

    // Protocol detection from moduleData section
    let protocol: Protocol = "unknown";
    if (content.includes("TYPE_CROSSFIRE")) protocol = "CRSF";
    else if (content.includes("TYPE_MULTIMODULE")) protocol = "unknown";
    else if (content.includes("TYPE_FRSKY")) protocol = "FrSky";

    // CRSF = ELRS in our context
    if (protocol === "CRSF") protocol = "ELRS";

    // Module bay — real format: moduleData:\n   0: = internal, 1: = external
    const hasInternal = /moduleData:\s*\n\s+0:/.test(content);
    const hasExternal = /moduleData:\s*\n[\s\S]*1:/.test(content);

    // Count mixer channels
    const mixerChannels = (content.match(/destCh:\s*\d+/g) || []).length;

    return {
      name: modelName,
      filename,
      moduleBay: hasInternal ? "internal" : (hasExternal ? "external" : "internal"),
      protocol,
      channels: Math.max(mixerChannels, 4),
      trims: {},
      mixers: [],
    };
  } catch {
    return null;
  }
}

/**
 * Simple YAML-ish parser (for EdgeTX yml files which are simple key-value)
 */
function parseSimpleYaml(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * List all available models on the SD card
 */
export function listModels(mountPath: string): string[] {
  const modelsDir = join(mountPath, "MODELS");
  if (!existsSync(modelsDir)) return [];

  try {
    return readdirSync(modelsDir).filter(
      (f) => f.endsWith(".yml") || f.endsWith(".bin")
    );
  } catch {
    return [];
  }
}
