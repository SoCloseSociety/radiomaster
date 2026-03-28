"use client";

import { useState, useEffect } from "react";

interface DiagnosticItem {
  id: string;
  severity: "error" | "warning" | "info" | "ok";
  category: string;
  title: string;
  detail: string;
  fix?: string;
  autoFixable: boolean;
}

interface ModelAnalysis {
  filename: string;
  name: string;
  protocol: string;
  channelCount: number;
  hasMixers: boolean;
  hasTimers: boolean;
  issues: string[];
}

interface SDCardAnalysis {
  mounted: boolean;
  mountPoint: string;
  radioName: string;
  firmwareVersion: string;
  hasRadioFolder: boolean;
  hasModelsFolder: boolean;
  hasScriptsFolder: boolean;
  hasSoundsFolder: boolean;
  modelCount: number;
  models: ModelAnalysis[];
  firmwareFiles: string[];
  logFiles: string[];
  hasELRSLua: boolean;
  elrsVersion: string;
  diagnostics: DiagnosticItem[];
  score: number;
}

interface BFConfig {
  success: boolean;
  port: string;
  boardId: string;
  firmwareVersion: string;
  craftName: string;
  rxProviderName: string;
  pids: { roll: number[]; pitch: number[]; yaw: number[] } | null;
  rates: { rcRate: number[]; superRate: number[]; rcExpo: number[] } | null;
  error?: string;
}

const severityIcon: Record<string, { icon: string; cls: string }> = {
  error: { icon: "✕", cls: "bg-danger text-black" },
  warning: { icon: "!", cls: "bg-warning text-black" },
  info: { icon: "i", cls: "bg-accent text-black" },
  ok: { icon: "✓", cls: "bg-success text-black" },
};

export default function RadioAnalyzer() {
  const [analysis, setAnalysis] = useState<SDCardAnalysis | null>(null);
  const [bfConfig, setBfConfig] = useState<BFConfig | null>(null);
  const [bfPorts, setBfPorts] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReadingBF, setIsReadingBF] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [bindingPhrase, setBindingPhrase] = useState("");
  const [noSD, setNoSD] = useState<{ error: string; steps: string[] } | null>(null);

  useEffect(() => {
    analyzeRadio();
    readBetaflight();
  }, []);

  const analyzeRadio = async () => {
    setIsAnalyzing(true);
    setNoSD(null);
    try {
      const res = await fetch("/api/analyze");
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setNoSD({ error: data.error, steps: data.steps || [] });
      }
    } catch (err) {
      setNoSD({ error: String(err), steps: [] });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readBetaflight = async () => {
    setIsReadingBF(true);
    try {
      const res = await fetch("/api/betaflight");
      const data = await res.json();
      if (data.success) {
        setBfConfig(data.config);
      }
      if (data.ports) setBfPorts(data.ports);
    } catch { /* ignore */ } finally {
      setIsReadingBF(false);
    }
  };

  const executeAction = async (action: string) => {
    setActionInProgress(action);
    setActionResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, bindingPhrase }),
      });
      const data = await res.json();
      setActionResult({
        success: data.success,
        message: data.message || data.error || "Done",
      });
      if (data.success) {
        // Re-analyze after action
        await analyzeRadio();
      }
    } catch (err) {
      setActionResult({ success: false, message: String(err) });
    } finally {
      setActionInProgress(null);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-danger";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Analyse & Configuration</h2>
          <p className="text-sm text-foreground/40">
            Branche ta radio ou ton drone — analyse automatique et injection des configs
          </p>
        </div>
        <button
          onClick={() => { analyzeRadio(); readBetaflight(); }}
          disabled={isAnalyzing}
          className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-bold hover:bg-accent-dim transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isAnalyzing ? "Analyse..." : "Re-analyser"}
        </button>
      </div>

      {/* No SD Card */}
      {noSD && !analysis && (
        <div className="bg-surface rounded-xl border border-warning/30 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🔌</div>
            <div>
              <h3 className="font-bold text-warning">{noSD.error}</h3>
              <p className="text-xs text-foreground/40 mt-1">
                Pour analyser ta radio, elle doit être branchée en mode USB Storage
              </p>
            </div>
          </div>
          {noSD.steps.length > 0 && (
            <ol className="space-y-2 ml-14">
              {noSD.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/60">
                  <span className="text-accent font-mono flex-shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Score + Radio info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4">
              <div className={`text-4xl font-black ${scoreColor(analysis.score)}`}>
                {analysis.score}
              </div>
              <div>
                <p className="text-xs text-foreground/30">Score santé</p>
                <p className="font-bold">{analysis.radioName}</p>
                <p className="text-xs text-foreground/40">EdgeTX {analysis.firmwareVersion}</p>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-5">
              <p className="text-xs text-foreground/30 mb-2">Modèles</p>
              <p className="text-2xl font-bold">{analysis.modelCount}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {analysis.models.map((m) => (
                  <span key={m.filename} className="text-[10px] px-2 py-0.5 bg-background rounded-full text-foreground/50">
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-5">
              <p className="text-xs text-foreground/30 mb-2">ELRS</p>
              {analysis.hasELRSLua ? (
                <div>
                  <p className="text-sm text-success font-medium">Lua script installé</p>
                  {analysis.elrsVersion && (
                    <p className="text-xs text-foreground/40">Version: {analysis.elrsVersion}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-warning">Script Lua absent</p>
              )}
              <p className="text-xs text-foreground/30 mt-2">SD: {analysis.mountPoint}</p>
            </div>
          </div>

          {/* Diagnostics */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">
              Diagnostic ({analysis.diagnostics.length} points vérifiés)
            </h3>
            <div className="space-y-2">
              {analysis.diagnostics
                .sort((a, b) => {
                  const order: Record<string, number> = { error: 0, warning: 1, info: 2, ok: 3 };
                  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
                })
                .map((d) => {
                  const sev = severityIcon[d.severity];
                  return (
                    <div key={d.id} className="flex gap-3 items-start">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${sev.cls}`}>
                        {sev.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-foreground/40">{d.detail}</p>
                        {d.fix && (
                          <p className="text-xs text-accent mt-1">
                            Fix: {d.fix}
                            {d.autoFixable && " (automatique)"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Models detail */}
          {analysis.models.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="font-bold text-sm mb-4">Détail des modèles</h3>
              <div className="space-y-3">
                {analysis.models.map((model) => (
                  <div key={model.filename} className="bg-background rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{model.name}</span>
                      <span className="text-xs text-foreground/30 font-mono">{model.filename}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-foreground/40">
                      <span>Protocole: {model.protocol}</span>
                      <span>Canaux: {model.channelCount}</span>
                      <span>Mixers: {model.hasMixers ? "Oui" : "Non"}</span>
                      <span>Timers: {model.hasTimers ? "Oui" : "Non"}</span>
                    </div>
                    {model.issues.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {model.issues.map((issue, i) => (
                          <p key={i} className="text-xs text-warning">⚠ {issue}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-surface rounded-xl border border-accent/20 p-5">
            <h3 className="font-bold text-sm mb-2">Actions</h3>
            <p className="text-xs text-foreground/40 mb-4">
              Toutes les actions font un backup automatique avant de modifier la carte SD.
            </p>

            <div className="mb-4">
              <label className="text-xs text-foreground/50 mb-1 block">Binding Phrase ELRS (pour les configs injectées)</label>
              <input
                type="text"
                value={bindingPhrase}
                onChange={(e) => setBindingPhrase(e.target.value)}
                placeholder="ta_binding_phrase"
                className="w-full max-w-md px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => executeAction("backup")}
                disabled={!!actionInProgress}
                className="px-4 py-2.5 rounded-lg bg-surface-hover border border-border text-sm hover:border-foreground/20 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {actionInProgress === "backup" ? "Backup..." : "📦 Backup seulement"}
              </button>

              <button
                onClick={() => executeAction("inject-all")}
                disabled={!!actionInProgress}
                className="px-4 py-2.5 rounded-lg bg-accent/10 text-accent border border-accent/20 text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {actionInProgress === "inject-all" ? "Injection..." : "📥 Injecter les 6 modèles"}
              </button>

              <button
                onClick={() => executeAction("clean-inject")}
                disabled={!!actionInProgress}
                className="px-4 py-2.5 rounded-lg bg-warning/10 text-warning border border-warning/20 text-sm font-medium hover:bg-warning/20 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning"
              >
                {actionInProgress === "clean-inject" ? "Nettoyage..." : "🧹 Clean + re-inject (remplace les anciens)"}
              </button>
            </div>

            {actionResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                actionResult.success
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              }`}>
                {actionResult.message}
              </div>
            )}
          </div>
        </>
      )}

      {/* Betaflight FC */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">Flight Controller (Betaflight)</h3>
          <button
            onClick={readBetaflight}
            disabled={isReadingBF}
            className="px-3 py-1.5 rounded-lg bg-drone/10 text-drone text-xs font-medium hover:bg-drone/20 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-drone"
          >
            {isReadingBF ? "Lecture..." : "Lire le FC"}
          </button>
        </div>

        {bfConfig && bfConfig.success ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-foreground/30">Board</p>
                <p className="font-mono text-sm">{bfConfig.boardId}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-foreground/30">Firmware</p>
                <p className="font-mono text-sm">BF {bfConfig.firmwareVersion}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-foreground/30">Nom</p>
                <p className="font-mono text-sm">{bfConfig.craftName || "(aucun)"}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-foreground/30">Récepteur</p>
                <p className={`font-mono text-sm ${bfConfig.rxProviderName === "CRSF" ? "text-success" : ""}`}>
                  {bfConfig.rxProviderName}
                </p>
              </div>
            </div>

            {bfConfig.pids && (
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-foreground/30 mb-1">PIDs</p>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>Roll: {bfConfig.pids.roll.join("/")}</div>
                  <div>Pitch: {bfConfig.pids.pitch.join("/")}</div>
                  <div>Yaw: {bfConfig.pids.yaw.join("/")}</div>
                </div>
              </div>
            )}

            {bfConfig.rates && (
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-foreground/30 mb-1">Rates</p>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>RC Rate: {bfConfig.rates.rcRate.join("/")}</div>
                  <div>Super Rate: {bfConfig.rates.superRate.join("/")}</div>
                  <div>Expo: {bfConfig.rates.rcExpo.join("/")}</div>
                </div>
              </div>
            )}

            <p className="text-[10px] text-foreground/20">Port: {bfConfig.port}</p>
          </div>
        ) : (
          <div className="text-center py-6 text-foreground/30">
            {bfPorts.length === 0 ? (
              <div>
                <p className="text-sm">Aucun flight controller détecté</p>
                <p className="text-xs mt-1">
                  Branche ton Hulk 2 ou Nazgul en USB. <strong className="text-danger">SANS les hélices !</strong>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm">FC détecté sur {bfPorts.join(", ")}</p>
                <p className="text-xs mt-1">
                  {bfConfig?.error || "Clique 'Lire le FC' pour récupérer la configuration"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {isAnalyzing && !analysis && !noSD && (
        <div className="text-center py-16 text-foreground/30">
          <div className="text-4xl mb-3 animate-pulse">🔍</div>
          <p>Analyse de la carte SD en cours...</p>
        </div>
      )}
    </div>
  );
}
