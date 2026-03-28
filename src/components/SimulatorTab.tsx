"use client";

import { useState, useEffect } from "react";
import {
  SimulatorInfo,
  SimAxisMapping,
  SimEdgeTXModel,
  SimTip,
} from "@/lib/simulator-templates";

interface JoystickSetupStep {
  step: number;
  title: string;
  detail: string;
}

interface TroubleshootItem {
  problem: string;
  solutions: string[];
}

interface JoystickSetup {
  title: string;
  steps: JoystickSetupStep[];
  troubleshooting: TroubleshootItem[];
}

interface SimData {
  macSimulators: SimulatorInfo[];
  allSimulators: SimulatorInfo[];
  simModels: SimEdgeTXModel[];
  tips: SimTip[];
  joystickSetup: JoystickSetup;
}

const difficultyBadge: Record<string, { label: string; cls: string }> = {
  beginner: { label: "Débutant", cls: "bg-success/20 text-success" },
  intermediate: { label: "Intermédiaire", cls: "bg-warning/20 text-warning" },
  advanced: { label: "Avancé", cls: "bg-danger/20 text-danger" },
};

const tipCategoryLabels: Record<string, { label: string; icon: string }> = {
  setup: { label: "Installation", icon: "🔧" },
  training: { label: "Entraînement", icon: "🎯" },
  progression: { label: "Progression", icon: "📈" },
  settings: { label: "Réglages", icon: "⚙️" },
};

export default function SimulatorTab() {
  const [data, setData] = useState<SimData | null>(null);
  const [selectedRadio, setSelectedRadio] = useState<"tx16s" | "pocket">("tx16s");
  const [selectedSim, setSelectedSim] = useState<string>("");
  const [axisMapping, setAxisMapping] = useState<SimAxisMapping | null>(null);
  const [activeSection, setActiveSection] = useState<"sims" | "setup" | "model" | "tips">("sims");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTrouble, setExpandedTrouble] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSim && selectedRadio) {
      loadAxisMapping();
    }
  }, [selectedSim, selectedRadio]);

  const loadData = async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/simulator");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.macSimulators.length > 0) {
          setSelectedSim(json.macSimulators[0].id);
        }
      }
    } catch (err) {
      console.error("Simulator load error:", err);
      setLoadError("Erreur lors du chargement des données simulateur");
    }
  };

  const loadAxisMapping = async () => {
    try {
      const res = await fetch(`/api/simulator?radio=${selectedRadio}&simulator=${selectedSim}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.axisMappings) {
        setAxisMapping(json.axisMappings);
      }
    } catch { /* ignore */ }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loadError) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-danger">{loadError}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 rounded-lg bg-accent text-black text-sm font-bold">
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-foreground/30">
        <div className="text-4xl mb-3 animate-pulse">🎮</div>
        <p>Chargement du mode simulateur...</p>
      </div>
    );
  }

  const currentSim = data.allSimulators.find((s) => s.id === selectedSim);
  const currentModel = data.simModels.find((m) => m.radioId === selectedRadio);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Mode Simulateur</h2>
        <p className="text-sm text-foreground/40">
          Configure ta radio pour voler sur simulateur — la meilleure façon de progresser sans casser de matos
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-1 bg-surface rounded-xl p-1">
        {([
          { id: "sims" as const, label: "Simulateurs Mac", icon: "🖥️" },
          { id: "setup" as const, label: "Config USB Joystick", icon: "🔌" },
          { id: "model" as const, label: "Modèle EdgeTX", icon: "📄" },
          { id: "tips" as const, label: "Conseils entraînement", icon: "🎯" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              activeSection === tab.id
                ? "bg-accent text-black font-medium"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Radio selector — visible everywhere */}
      <div className="flex gap-2">
        {(["tx16s", "pocket"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRadio(r)}
            className={`px-4 py-2 rounded-xl border text-sm transition-all ${
              selectedRadio === r
                ? "border-radio bg-radio/10 text-radio font-medium"
                : "border-border bg-surface hover:border-foreground/20"
            }`}
          >
            🎮 {r === "tx16s" ? "TX16S" : "Pocket"}
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* SECTION: SIMULATORS */}
      {/* ============================================ */}
      {activeSection === "sims" && (
        <div className="space-y-6">
          {/* Mac compatible */}
          <div>
            <h3 className="text-sm font-medium text-foreground/60 mb-3">
              Compatible macOS ({data.macSimulators.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.macSimulators.map((sim) => {
                const diff = difficultyBadge[sim.difficulty];
                return (
                  <button
                    key={sim.id}
                    onClick={() => {
                      setSelectedSim(sim.id);
                      setActiveSection("setup");
                    }}
                    className={`text-left rounded-xl border p-5 transition-all ${
                      selectedSim === sim.id
                        ? "border-accent bg-accent/5"
                        : "border-border bg-surface hover:border-foreground/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-foreground">{sim.name}</h4>
                      <div className="flex gap-2">
                        {sim.free && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/20 text-success font-bold">
                            GRATUIT
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${diff.cls}`}>
                          {diff.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/50 mb-3">{sim.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {sim.features.slice(0, 3).map((f) => (
                        <span key={f} className="text-[10px] px-2 py-0.5 bg-background rounded-full text-foreground/40">
                          {f}
                        </span>
                      ))}
                    </div>
                    {sim.price && (
                      <p className="text-xs text-foreground/30">{sim.price}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Windows only */}
          {data.allSimulators.filter((s) => !s.platform.includes("mac")).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground/30 mb-3">
                Windows uniquement (Parallels/CrossOver)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                {data.allSimulators.filter((s) => !s.platform.includes("mac")).map((sim) => (
                  <div key={sim.id} className="rounded-xl border border-border bg-surface p-5">
                    <h4 className="font-bold text-foreground mb-1">{sim.name}</h4>
                    <p className="text-xs text-foreground/50 mb-2">{sim.description}</p>
                    <p className="text-xs text-warning">{sim.macNotes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION: USB JOYSTICK SETUP */}
      {/* ============================================ */}
      {activeSection === "setup" && (
        <div className="space-y-6">
          {/* Joystick setup steps */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">{data.joystickSetup.title}</h3>
            <div className="space-y-3">
              {data.joystickSetup.steps.map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Axis mapping for selected sim */}
          {currentSim && axisMapping && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="font-bold text-sm mb-1">
                Mapping des axes — {currentSim.name}
              </h3>
              <p className="text-xs text-foreground/40 mb-4">
                Radio: {selectedRadio === "tx16s" ? "TX16S" : "Pocket"}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-foreground/30 text-xs border-b border-border">
                      <th className="text-left py-2 pr-4">Fonction</th>
                      <th className="text-left py-2 pr-4">Canal</th>
                      <th className="text-left py-2 pr-4">Axe dans le simu</th>
                      <th className="text-left py-2">Stick</th>
                    </tr>
                  </thead>
                  <tbody>
                    {axisMapping.axes.map((a) => (
                      <tr key={a.channel} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">{a.name}</td>
                        <td className="py-2 pr-4 font-mono text-accent">CH{a.channel}</td>
                        <td className="py-2 pr-4 font-mono text-foreground/60">{a.simAxis}</td>
                        <td className="py-2 text-foreground/40">{a.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Setup steps for selected sim */}
          {currentSim && axisMapping && axisMapping.setupSteps.length > 0 && (
            <div className="bg-surface rounded-xl border border-accent/20 p-5">
              <h3 className="font-bold text-sm mb-4 text-accent">
                Configuration pas à pas — {currentSim.name}
              </h3>
              <ol className="space-y-2">
                {axisMapping.setupSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-accent font-mono text-xs mt-0.5 flex-shrink-0 w-5 text-right">
                      {i + 1}.
                    </span>
                    <span className="text-foreground/70">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Sim selector */}
          <div>
            <label className="text-xs text-foreground/40 mb-2 block">Changer de simulateur :</label>
            <div className="flex flex-wrap gap-2">
              {data.macSimulators.map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => setSelectedSim(sim.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedSim === sim.id
                      ? "bg-accent text-black font-medium"
                      : "bg-surface border border-border text-foreground/50 hover:text-foreground"
                  }`}
                >
                  {sim.name.split(":")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">Dépannage</h3>
            <div className="space-y-2">
              {data.joystickSetup.troubleshooting.map((item, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedTrouble(expandedTrouble === i ? null : i)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between text-sm hover:bg-background transition-colors"
                  >
                    <span className="text-warning">{item.problem}</span>
                    <span className="text-foreground/30 text-xs ml-2">
                      {expandedTrouble === i ? "▲" : "▼"}
                    </span>
                  </button>
                  {expandedTrouble === i && (
                    <div className="px-4 pb-3 space-y-1">
                      {item.solutions.map((sol, j) => (
                        <p key={j} className="text-xs text-foreground/50 flex gap-2">
                          <span className="text-accent flex-shrink-0">→</span>
                          {sol}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION: EDGETX SIM MODEL */}
      {/* ============================================ */}
      {activeSection === "model" && currentModel && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">
                Fichier: <span className="font-mono text-accent">{currentModel.filename}</span>
              </h3>
              <p className="text-xs text-foreground/40">
                Modèle EdgeTX dédié au simulateur — module ELRS désactivé, USB Joystick uniquement
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(currentModel.content, "sim-model")}
                className="px-3 py-1.5 rounded-lg bg-surface text-sm text-foreground/60 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {copiedId === "sim-model" ? "✓ Copié !" : "Copier"}
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([currentModel.content], { type: "text/yaml" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = currentModel.filename;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Télécharger .yml
              </button>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-sm text-warning">
            <p className="font-bold mb-1">Comment installer ce modèle :</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Branche ta {selectedRadio === "tx16s" ? "TX16S" : "Pocket"} en USB mode <strong>Storage</strong></li>
              <li>Copie le fichier <code className="bg-black/20 px-1 rounded">{currentModel.filename}</code> dans le dossier <code className="bg-black/20 px-1 rounded">MODELS/</code> de la carte SD</li>
              <li>Débranche la radio et redémarre-la</li>
              <li>Sélectionne le modèle &quot;SIMU&quot; (appui long sur le nom du modèle)</li>
              <li>Rebranche en USB et choisis <strong>USB Joystick (HID)</strong></li>
              <li>Lance ton simulateur !</li>
            </ol>
          </div>

          <pre className="bg-background rounded-xl p-4 text-xs text-foreground/70 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed border border-border font-mono">
            {currentModel.content}
          </pre>
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION: TRAINING TIPS */}
      {/* ============================================ */}
      {activeSection === "tips" && (
        <div className="space-y-4">
          {(["setup", "training", "progression", "settings"] as const).map((category) => {
            const cat = tipCategoryLabels[category];
            const catTips = data.tips.filter((t) => t.category === category);
            if (catTips.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-sm font-medium text-foreground/60 mb-3">
                  {cat.icon} {cat.label}
                </h3>
                <div className="space-y-2">
                  {catTips.map((tip) => {
                    const pri = {
                      critical: { label: "CRITIQUE", cls: "bg-danger/20 text-danger" },
                      important: { label: "IMPORTANT", cls: "bg-warning/20 text-warning" },
                      nice: { label: "CONSEIL", cls: "bg-accent/20 text-accent" },
                    }[tip.priority];
                    return (
                      <div
                        key={tip.id}
                        className="rounded-xl border border-border bg-surface p-4"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${pri.cls}`}>
                            {pri.label}
                          </span>
                          <h4 className="text-sm font-medium">{tip.title}</h4>
                        </div>
                        <p className="text-xs text-foreground/50 leading-relaxed">
                          {tip.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
