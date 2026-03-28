/**
 * Full radio SD card analyzer.
 * Reads everything on the EdgeTX SD card and produces a health report
 * with issues, warnings, and recommendations.
 */

import { existsSync, readdirSync, readFileSync, statSync, mkdirSync, copyFileSync, accessSync, constants } from "fs";
import { join, extname } from "path";

// ============================================================
// TYPES
// ============================================================

export type Severity = "error" | "warning" | "info" | "ok";

export interface DiagnosticItem {
  id: string;
  severity: Severity;
  category: "structure" | "models" | "elrs" | "firmware" | "scripts" | "sounds" | "storage";
  title: string;
  detail: string;
  fix?: string;
  autoFixable: boolean;
}

export interface ModelAnalysis {
  filename: string;
  name: string;
  hasInternalModule: boolean;
  hasExternalModule: boolean;
  protocol: string;
  channelCount: number;
  hasMixers: boolean;
  hasTimers: boolean;
  rawContent: string;
  issues: string[];
}

export interface SDCardAnalysis {
  mounted: boolean;
  mountPoint: string;
  radioName: string;
  firmwareVersion: string;
  totalSizeMB: number;
  usedSizeMB: number;
  freeSizeMB: number;

  // Structure
  hasRadioFolder: boolean;
  hasModelsFolder: boolean;
  hasFirmwareFolder: boolean;
  hasScriptsFolder: boolean;
  hasSoundsFolder: boolean;
  hasLogsFolder: boolean;
  hasScreenshotsFolder: boolean;

  // Content
  modelCount: number;
  models: ModelAnalysis[];
  firmwareFiles: string[];
  scriptFiles: string[];
  soundPacks: string[];
  logFiles: string[];

  // ELRS
  hasELRSLua: boolean;
  elrsVersion: string;
  elrsBindingPhrase: string;

  // Diagnostics
  diagnostics: DiagnosticItem[];
  score: number; // 0-100 health score
}

// ============================================================
// ANALYZER
// ============================================================

export function analyzeSDCard(mountPoint: string): SDCardAnalysis {
  const analysis: SDCardAnalysis = {
    mounted: false,
    mountPoint,
    radioName: "Unknown",
    firmwareVersion: "Unknown",
    totalSizeMB: 0,
    usedSizeMB: 0,
    freeSizeMB: 0,
    hasRadioFolder: false,
    hasModelsFolder: false,
    hasFirmwareFolder: false,
    hasScriptsFolder: false,
    hasSoundsFolder: false,
    hasLogsFolder: false,
    hasScreenshotsFolder: false,
    modelCount: 0,
    models: [],
    firmwareFiles: [],
    scriptFiles: [],
    soundPacks: [],
    logFiles: [],
    hasELRSLua: false,
    elrsVersion: "",
    elrsBindingPhrase: "",
    diagnostics: [],
    score: 0,
  };

  if (!existsSync(mountPoint)) {
    analysis.diagnostics.push({
      id: "no-mount",
      severity: "error",
      category: "structure",
      title: "Carte SD non accessible",
      detail: `Le point de montage ${mountPoint} n'existe pas.`,
      autoFixable: false,
    });
    return analysis;
  }

  analysis.mounted = true;

  // ---- Folder structure ----
  analysis.hasRadioFolder = existsSync(join(mountPoint, "RADIO"));
  analysis.hasModelsFolder = existsSync(join(mountPoint, "MODELS"));
  analysis.hasFirmwareFolder = existsSync(join(mountPoint, "FIRMWARE"));
  analysis.hasScriptsFolder = existsSync(join(mountPoint, "SCRIPTS"));
  analysis.hasSoundsFolder = existsSync(join(mountPoint, "SOUNDS"));
  analysis.hasLogsFolder = existsSync(join(mountPoint, "LOGS"));
  analysis.hasScreenshotsFolder = existsSync(join(mountPoint, "SCREENSHOTS"));

  if (!analysis.hasRadioFolder) {
    analysis.diagnostics.push({
      id: "no-radio-folder",
      severity: "error",
      category: "structure",
      title: "Dossier RADIO/ manquant",
      detail: "Le dossier RADIO/ contient la configuration générale de ta radiocommande. Sans lui, la radio ne peut pas fonctionner correctement.",
      fix: "Reflash EdgeTX sur ta radio — ça recréera les dossiers.",
      autoFixable: false,
    });
  }

  if (!analysis.hasModelsFolder) {
    analysis.diagnostics.push({
      id: "no-models-folder",
      severity: "warning",
      category: "structure",
      title: "Dossier MODELS/ manquant",
      detail: "Aucun dossier MODELS/ trouvé. Tes modèles (configs drone) sont stockés ici.",
      fix: "Le dossier sera créé automatiquement lors de l'injection des configs.",
      autoFixable: true,
    });
  }

  if (!analysis.hasScriptsFolder) {
    analysis.diagnostics.push({
      id: "no-scripts-folder",
      severity: "warning",
      category: "scripts",
      title: "Dossier SCRIPTS/ manquant",
      detail: "Pas de scripts Lua. Le script ELRS Lua est nécessaire pour configurer ELRS depuis ta radio.",
      fix: "Télécharge le script ELRS Lua depuis expresslrs.org et copie-le dans SCRIPTS/TOOLS/",
      autoFixable: false,
    });
  }

  if (!analysis.hasSoundsFolder) {
    analysis.diagnostics.push({
      id: "no-sounds",
      severity: "info",
      category: "sounds",
      title: "Pas de pack de sons",
      detail: "Le dossier SOUNDS/ est absent. Les sons vocaux aident à savoir quand la batterie est faible, etc.",
      fix: "Télécharge un voice pack (FR) depuis edgetx.org/downloads",
      autoFixable: false,
    });
  }

  // ---- Radio config ----
  const radioYml = join(mountPoint, "RADIO", "radio.yml");
  if (existsSync(radioYml)) {
    try {
      const content = readFileSync(radioYml, "utf-8");

      // Real EdgeTX format: "board: tx16s" at top level
      const boardMatch = content.match(/^board:\s*(.+)/m);
      if (boardMatch) {
        const board = boardMatch[1].trim().toLowerCase();
        const boardNames: Record<string, string> = {
          tx16s: "RadioMaster TX16S",
          pocket: "RadioMaster Pocket",
          zorro: "RadioMaster Zorro",
          boxer: "RadioMaster Boxer",
          mt12: "RadioMaster MT12",
          tx12: "RadioMaster TX12",
        };
        analysis.radioName = boardNames[board] || `EdgeTX ${board.toUpperCase()}`;
      }

      // Read semver for firmware version
      const semverMatch = content.match(/^semver:\s*(.+)/m);
      if (semverMatch && analysis.firmwareVersion === "Unknown") {
        analysis.firmwareVersion = semverMatch[1].trim();
      }

      // Check internal module type
      const moduleMatch = content.match(/^internalModule:\s*(.+)/m);
      const moduleType = moduleMatch ? moduleMatch[1].trim() : "";

      // Read EdgeTX SD card version file
      const versionFile = join(mountPoint, "edgetx.sdcard.version");
      let sdVersion = "";
      if (existsSync(versionFile)) {
        try {
          sdVersion = readFileSync(versionFile, "utf-8").trim();
        } catch { /* ignore */ }
      }

      const details = [
        `radio.yml lu avec succès.`,
        analysis.radioName !== "Unknown" ? `Radio: ${analysis.radioName}` : "",
        moduleType ? `Module interne: ${moduleType}` : "",
        sdVersion ? `SD card: EdgeTX ${sdVersion}` : "",
      ].filter(Boolean).join(" | ");

      analysis.diagnostics.push({
        id: "radio-yml-ok",
        severity: "ok",
        category: "structure",
        title: "Configuration radio trouvée",
        detail: details,
        autoFixable: false,
      });

      // Check if CRSF/ELRS is configured
      if (moduleType === "TYPE_CROSSFIRE") {
        analysis.diagnostics.push({
          id: "internal-module-crsf",
          severity: "ok",
          category: "elrs",
          title: "Module interne: CRSF (ELRS)",
          detail: "Le module interne est configuré en CRSF — compatible ELRS. Parfait !",
          autoFixable: false,
        });
      } else if (moduleType && moduleType !== "TYPE_CROSSFIRE") {
        analysis.diagnostics.push({
          id: "internal-module-not-crsf",
          severity: "warning",
          category: "elrs",
          title: `Module interne: ${moduleType} (pas CRSF)`,
          detail: "Le module interne n'est pas en mode CRSF. Pour utiliser ELRS, change le type de module interne en TYPE_CROSSFIRE dans les paramètres radio.",
          fix: "Sur la radio: SYS → HARDWARE → Internal RF → CRSF",
          autoFixable: false,
        });
      }
    } catch {
      analysis.diagnostics.push({
        id: "radio-yml-corrupt",
        severity: "warning",
        category: "structure",
        title: "radio.yml illisible",
        detail: "Le fichier de config radio existe mais ne peut pas être lu. Il est peut-être corrompu.",
        fix: "Un reset des paramètres radio dans EdgeTX peut le régénérer.",
        autoFixable: false,
      });
    }
  }

  // ---- Firmware ----
  if (analysis.hasFirmwareFolder) {
    try {
      analysis.firmwareFiles = readdirSync(join(mountPoint, "FIRMWARE"))
        .filter((f) => f.endsWith(".bin"));

      let fwDetected = false;
      for (const fw of analysis.firmwareFiles) {
        const match = fw.match(/edgetx[_-](\w+)[_-]v?(\d+\.\d+\.\d+)/i);
        if (match) {
          const modelName = match[1].toLowerCase();
          const knownModels = ["tx16s", "pocket", "zorro", "boxer", "xlite", "el18", "mt12", "tx12"];
          if (knownModels.includes(modelName)) {
            analysis.radioName = `RadioMaster ${match[1].toUpperCase()}`;
          } else {
            analysis.radioName = `EdgeTX ${match[1].toUpperCase()}`;
          }
          analysis.firmwareVersion = match[2];
          fwDetected = true;
        }
      }

      if (!fwDetected && analysis.firmwareFiles.length > 0) {
        analysis.diagnostics.push({
          id: "unknown-firmware-name",
          severity: "info",
          category: "firmware",
          title: "Firmware trouvé mais modèle non reconnu",
          detail: `Fichiers: ${analysis.firmwareFiles.join(", ")}. Le nom de la radio sera détecté depuis d'autres sources.`,
          autoFixable: false,
        });
      }

      if (analysis.firmwareFiles.length > 0) {
        analysis.diagnostics.push({
          id: "firmware-found",
          severity: "ok",
          category: "firmware",
          title: `Firmware EdgeTX ${analysis.firmwareVersion}`,
          detail: `${analysis.firmwareFiles.length} fichier(s) firmware trouvé(s).`,
          autoFixable: false,
        });
      }
    } catch { /* ignore */ }
  }

  // ---- Models ----
  if (analysis.hasModelsFolder) {
    try {
      const modelFiles = readdirSync(join(mountPoint, "MODELS"))
        .filter((f) => extname(f) === ".yml" || extname(f) === ".bin");

      analysis.modelCount = modelFiles.length;

      for (const file of modelFiles) {
        if (extname(file) === ".yml") {
          const model = analyzeModel(join(mountPoint, "MODELS", file), file);
          analysis.models.push(model);
        }
      }

      if (analysis.modelCount === 0) {
        analysis.diagnostics.push({
          id: "no-models",
          severity: "warning",
          category: "models",
          title: "Aucun modèle configuré",
          detail: "Le dossier MODELS/ est vide. Tu n'as aucune config drone sur cette radio.",
          fix: "Utilise le dashboard pour injecter les modèles pour tes drones.",
          autoFixable: true,
        });
      } else {
        analysis.diagnostics.push({
          id: "models-found",
          severity: "ok",
          category: "models",
          title: `${analysis.modelCount} modèle(s) trouvé(s)`,
          detail: analysis.models.map((m) => m.name).join(", "),
          autoFixable: false,
        });

        // Check each model for issues
        for (const model of analysis.models) {
          for (const issue of model.issues) {
            analysis.diagnostics.push({
              id: `model-issue-${model.filename}`,
              severity: "warning",
              category: "models",
              title: `Problème dans "${model.name}"`,
              detail: issue,
              autoFixable: false,
            });
          }
        }
      }
    } catch { /* ignore */ }
  }

  // ---- ELRS ----
  const elrsLuaPaths = [
    join(mountPoint, "SCRIPTS", "TOOLS", "ELRS.lua"),
    join(mountPoint, "SCRIPTS", "TOOLS", "elrs.lua"),
    join(mountPoint, "SCRIPTS", "TOOLS", "elrsV3.lua"),
    join(mountPoint, "SCRIPTS", "TOOLS", "ExpressLRS.lua"),
  ];

  for (const p of elrsLuaPaths) {
    if (existsSync(p)) {
      analysis.hasELRSLua = true;
      try {
        const content = readFileSync(p, "utf-8");
        const verMatch = content.match(/version\s*=\s*["']([^"']+)/);
        if (verMatch) analysis.elrsVersion = verMatch[1];
      } catch { /* ignore */ }
      break;
    }
  }

  if (analysis.hasELRSLua) {
    analysis.diagnostics.push({
      id: "elrs-lua-ok",
      severity: "ok",
      category: "elrs",
      title: `Script ELRS Lua trouvé${analysis.elrsVersion ? ` (v${analysis.elrsVersion})` : ""}`,
      detail: "Tu peux configurer ELRS directement depuis ta radio via SYS → TOOLS → ELRS.",
      autoFixable: false,
    });
  } else if (analysis.hasScriptsFolder) {
    analysis.diagnostics.push({
      id: "elrs-lua-missing",
      severity: "warning",
      category: "elrs",
      title: "Script ELRS Lua absent",
      detail: "Le script Lua ELRS n'est pas installé. Tu ne pourras pas configurer ELRS depuis la radio.",
      fix: "Télécharge ELRS Lua depuis github.com/ExpressLRS/ExpressLRS → copie dans SCRIPTS/TOOLS/",
      autoFixable: false,
    });
  }

  // ---- Scripts ----
  if (analysis.hasScriptsFolder) {
    try {
      analysis.scriptFiles = listFilesRecursive(join(mountPoint, "SCRIPTS"), ".lua");
    } catch { /* ignore */ }
  }

  // ---- Logs ----
  if (analysis.hasLogsFolder) {
    try {
      analysis.logFiles = readdirSync(join(mountPoint, "LOGS"))
        .filter((f) => f.endsWith(".csv") || f.endsWith(".log"));

      if (analysis.logFiles.length > 20) {
        const totalSize = analysis.logFiles.reduce((sum, f) => {
          try {
            return sum + statSync(join(mountPoint, "LOGS", f)).size;
          } catch { return sum; }
        }, 0);
        const sizeMB = Math.round(totalSize / 1024 / 1024);

        analysis.diagnostics.push({
          id: "many-logs",
          severity: "info",
          category: "storage",
          title: `${analysis.logFiles.length} fichiers de log (${sizeMB}MB)`,
          detail: "Beaucoup de logs accumulés. Tu peux les supprimer pour libérer de l'espace.",
          fix: "Supprime les anciens fichiers dans le dossier LOGS/",
          autoFixable: true,
        });
      }
    } catch { /* ignore */ }
  }

  // Check for a SIMU model
  const hasSimuModel = analysis.models.some(
    (m) => m.name.toUpperCase().includes("SIMU") || m.name.toUpperCase().includes("SIM")
  );
  if (!hasSimuModel && analysis.modelCount > 0) {
    analysis.diagnostics.push({
      id: "no-simu-model",
      severity: "info",
      category: "models",
      title: "Pas de modèle simulateur",
      detail: "Tu n'as pas de modèle dédié au simulateur. C'est recommandé pour éviter d'émettre du signal RF pendant l'entraînement.",
      fix: "Va dans l'onglet Simulateur du dashboard pour créer un modèle SIMU.",
      autoFixable: true,
    });
  }

  // ---- Calculate score ----
  // Score based on critical structure (not per-model warnings)
  const errors = analysis.diagnostics.filter((d) => d.severity === "error").length;
  const structureWarnings = analysis.diagnostics.filter(
    (d) => d.severity === "warning" && d.category !== "models"
  ).length;
  const oks = analysis.diagnostics.filter((d) => d.severity === "ok").length;

  let score = 50; // base
  score += oks * 10;           // each OK adds 10
  score -= errors * 25;        // each error removes 25
  score -= structureWarnings * 10; // structure warnings remove 10 (not model-level ones)

  // Bonus for having models, ELRS, scripts
  if (analysis.modelCount > 0) score += 5;
  if (analysis.hasELRSLua) score += 5;
  if (analysis.hasScriptsFolder) score += 5;

  analysis.score = Math.max(0, Math.min(100, Math.round(score)));

  return analysis;
}

// ============================================================
// MODEL ANALYZER
// ============================================================

function analyzeModel(filePath: string, filename: string): ModelAnalysis {
  const model: ModelAnalysis = {
    filename,
    name: filename.replace(".yml", ""),
    hasInternalModule: false,
    hasExternalModule: false,
    protocol: "unknown",
    channelCount: 0,
    hasMixers: false,
    hasTimers: false,
    rawContent: "",
    issues: [],
  };

  try {
    const content = readFileSync(filePath, "utf-8");
    model.rawContent = content;

    // Name — real EdgeTX: name: "ModelName" (with quotes)
    const nameMatch = content.match(/name:\s*"?([^"\n]+)"?/);
    if (nameMatch) model.name = nameMatch[1].trim();

    // Module — real EdgeTX: "moduleData:" section with "type: TYPE_CROSSFIRE"
    model.hasInternalModule = content.includes("moduleData:");
    model.hasExternalModule = content.includes("externalModule:");

    // Protocol — real EdgeTX uses TYPE_CROSSFIRE for ELRS/CRSF
    if (content.includes("TYPE_CROSSFIRE")) model.protocol = "CRSF/ELRS";
    else if (content.includes("TYPE_MULTIMODULE")) model.protocol = "Multi";
    else if (content.includes("TYPE_FRSKY")) model.protocol = "FrSky";
    else if (content.includes("TYPE_NONE") || content.match(/moduleData:\s*$/m)) model.protocol = "OFF (simu?)";

    // Mixers — real EdgeTX uses "mixData:" with "destCh:" entries
    model.hasMixers = content.includes("mixData:");
    const mixerMatches = content.match(/destCh:\s*\d+/g);
    if (mixerMatches) model.channelCount = mixerMatches.length;

    // Timers — real EdgeTX uses "timers:" section
    model.hasTimers = content.includes("timers:");
    // Check if timers have actual non-zero content
    const timerStartMatch = content.match(/start:\s*(\d+)/);
    const hasRealTimers = timerStartMatch && parseInt(timerStartMatch[1]) > 0;

    // Issues — only flag real problems
    if (!model.hasMixers) {
      model.issues.push("Aucun mixer configuré — les sticks ne feront rien");
    }
    if (model.channelCount > 0 && model.channelCount < 4 && model.hasMixers) {
      model.issues.push(`Seulement ${model.channelCount} canaux configurés (minimum 4 pour un quad)`);
    }
    if (!model.hasInternalModule) {
      model.issues.push("Aucun module radio configuré (moduleData absent)");
    }
    if (!hasRealTimers && model.hasMixers) {
      model.issues.push("Pas de timer actif — configure un countdown pour protéger ta batterie");
    }
  } catch {
    model.issues.push("Fichier illisible ou corrompu");
  }

  return model;
}

// ============================================================
// BACKUP & CLEAN
// ============================================================

export interface BackupResult {
  success: boolean;
  backupPath: string;
  filesBackedUp: number;
  message: string;
}

export function backupSDCard(mountPoint: string): BackupResult {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dataDir = join(process.cwd(), "data");
  const backupDir = join(dataDir, "backups", timestamp);

  // Check write permissions first
  try {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    accessSync(dataDir, constants.W_OK);
  } catch {
    return {
      success: false,
      backupPath: backupDir,
      filesBackedUp: 0,
      message: "Erreur: pas de permission d'écriture dans le dossier data/. Vérifie les permissions du projet.",
    };
  }

  try {
    mkdirSync(backupDir, { recursive: true });
    let count = 0;

    // Backup MODELS/
    const modelsDir = join(mountPoint, "MODELS");
    if (existsSync(modelsDir)) {
      const modelsBackup = join(backupDir, "MODELS");
      mkdirSync(modelsBackup, { recursive: true });
      for (const f of readdirSync(modelsDir)) {
        copyFileSync(join(modelsDir, f), join(modelsBackup, f));
        count++;
      }
    }

    // Backup RADIO/radio.yml
    const radioYml = join(mountPoint, "RADIO", "radio.yml");
    if (existsSync(radioYml)) {
      const radioBackup = join(backupDir, "RADIO");
      mkdirSync(radioBackup, { recursive: true });
      copyFileSync(radioYml, join(radioBackup, "radio.yml"));
      count++;
    }

    // Backup SCRIPTS/TOOLS/ (ELRS lua etc)
    const toolsDir = join(mountPoint, "SCRIPTS", "TOOLS");
    if (existsSync(toolsDir)) {
      const toolsBackup = join(backupDir, "SCRIPTS", "TOOLS");
      mkdirSync(toolsBackup, { recursive: true });
      for (const f of readdirSync(toolsDir)) {
        const src = join(toolsDir, f);
        if (statSync(src).isFile()) {
          copyFileSync(src, join(toolsBackup, f));
          count++;
        }
      }
    }

    return {
      success: true,
      backupPath: backupDir,
      filesBackedUp: count,
      message: `Backup créé: ${count} fichiers sauvegardés dans ${backupDir}`,
    };
  } catch (err) {
    return {
      success: false,
      backupPath: backupDir,
      filesBackedUp: 0,
      message: `Erreur backup: ${err}`,
    };
  }
}

export interface CleanResult {
  success: boolean;
  backup: BackupResult;
  modelsRemoved: number;
  modelsInjected: number;
  message: string;
}

// ============================================================
// HELPERS
// ============================================================

function listFilesRecursive(dir: string, ext: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        results.push(...listFilesRecursive(full, ext));
      } else if (entry.endsWith(ext)) {
        results.push(full.replace(dir + "/", ""));
      }
    }
  } catch { /* ignore */ }
  return results;
}
