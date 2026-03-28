"use client";

import { useState } from "react";
import {
  RadioSpec,
  DroneSpec,
  EdgeTXModelTemplate,
  BetaflightTemplate,
  ELRSConfig,
} from "@/lib/config-templates";

interface ConfigPreviewProps {
  radios: Record<string, RadioSpec>;
  drones: Record<string, DroneSpec>;
  edgetxModels: EdgeTXModelTemplate[];
  betaflightConfigs: BetaflightTemplate[];
  elrs: ELRSConfig;
  onInject?: (radioId: string, droneId: string, bindingPhrase: string) => void;
  isInjecting?: boolean;
  injectResult?: { success: boolean; message: string } | null;
}

export default function ConfigPreview({
  radios,
  drones,
  edgetxModels,
  betaflightConfigs,
  elrs,
  onInject,
  isInjecting,
  injectResult,
}: ConfigPreviewProps) {
  const [selectedRadio, setSelectedRadio] = useState<string>(Object.keys(radios)[0] || "");
  const [selectedDrone, setSelectedDrone] = useState<string>(Object.keys(drones)[0] || "");
  const [activeTab, setActiveTab] = useState<"edgetx" | "betaflight" | "elrs">("edgetx");
  const [bindingPhrase, setBindingPhrase] = useState(elrs.bindingPhrase || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const radio = radios[selectedRadio] || null;
  const drone = drones[selectedDrone] || null;
  const edgetxModel = edgetxModels.find(
    (m) => m.radioId === selectedRadio && m.droneId === selectedDrone
  );
  const bfConfig = betaflightConfigs.find(
    (c) => c.radioId === selectedRadio && c.droneId === selectedDrone
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Configs prêtes à injecter</h2>
        <p className="text-sm text-foreground/40">
          Sélectionne ta combo radio + drone pour voir et appliquer la config
        </p>
      </div>

      {/* Combo selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Radio selector */}
        <div>
          <label className="text-sm font-medium text-foreground/50 mb-2 block">
            🎮 Radio
          </label>
          <div className="space-y-2">
            {Object.values(radios).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRadio(r.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedRadio === r.id
                    ? "border-radio bg-radio/10"
                    : "border-border bg-surface hover:border-foreground/20"
                }`}
              >
                <div className="font-medium">{r.fullName}</div>
                <div className="text-xs text-foreground/40 mt-1">
                  ELRS interne: {r.hasInternalELRS ? "Oui" : "Non"} — Switches: {r.switches.join(", ")}
                </div>
                {r.id === "tx16s" && (
                  <div className="text-xs text-warning mt-1">
                    Note: bouton face gauche cassé — contourné dans la config
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Drone selector */}
        <div>
          <label className="text-sm font-medium text-foreground/50 mb-2 block">
            🚁 Drone
          </label>
          <div className="space-y-2">
            {Object.values(drones).map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDrone(d.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedDrone === d.id
                    ? "border-drone bg-drone/10"
                    : "border-border bg-surface hover:border-foreground/20"
                }`}
              >
                <div className="font-medium">{d.fullName}</div>
                <div className="text-xs text-foreground/40 mt-1">
                  {d.frameSize} — {d.fc} — {d.motorProtocol} — {d.batterySpec}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Binding phrase */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <label className="text-sm font-medium text-foreground/60 mb-2 block">
          🔗 Binding Phrase ELRS (commune à tous tes appareils)
        </label>
        <input
          type="text"
          value={bindingPhrase}
          onChange={(e) => setBindingPhrase(e.target.value)}
          placeholder="entre ta binding phrase ici..."
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground font-mono text-sm focus:border-accent focus:outline-none"
        />
        <p className="text-xs text-foreground/30 mt-2">
          Cette phrase doit être identique sur ta radio ET sur le récepteur ELRS du drone.
          Choisis quelque chose de unique (ex: &quot;{`neo_fpv_2024`}&quot;).
        </p>
      </div>

      {/* Specs summary for selected combo */}
      {radio && drone && (
        <div className="bg-surface rounded-xl border border-accent/20 p-4">
          <h3 className="font-bold text-sm mb-3 text-accent">
            Résumé: {radio.name} + {drone.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-background rounded-lg p-3">
              <div className="text-foreground/30 mb-1">ARM</div>
              <div className="font-mono font-bold">{radio.armSwitch} → AUX1</div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <div className="text-foreground/30 mb-1">Mode vol</div>
              <div className="font-mono font-bold">{radio.modeSwitch} → AUX2</div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <div className="text-foreground/30 mb-1">Beeper</div>
              <div className="font-mono font-bold">{radio.beeperSwitch} → AUX3</div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <div className="text-foreground/30 mb-1">RX UART</div>
              <div className="font-mono font-bold">UART{drone.uartRX}</div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <div className="text-foreground/30 mb-1">Moteurs</div>
              <div className="font-mono font-bold">{drone.motorProtocol}</div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <div className="text-foreground/30 mb-1">ELRS Rate</div>
              <div className="font-mono font-bold">{elrs.rate}Hz</div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <div className="text-foreground/30 mb-1">Puissance</div>
              <div className="font-mono font-bold">{elrs.power}mW</div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <div className="text-foreground/30 mb-1">Batterie</div>
              <div className="font-mono font-bold">{drone.batterySpec}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {[
            { id: "edgetx" as const, label: "EdgeTX Model (.yml)" },
            { id: "betaflight" as const, label: "Betaflight CLI" },
            { id: "elrs" as const, label: "Config ELRS" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-foreground/40 hover:text-foreground/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "edgetx" && edgetxModel && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">
                  Fichier: <span className="font-mono text-accent">{edgetxModel.filename}</span>
                </h3>
                <p className="text-xs text-foreground/40">
                  Ce fichier va dans le dossier MODELS/ de ta carte SD EdgeTX
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(edgetxModel.content, "edgetx")}
                  className="px-3 py-1.5 rounded-lg bg-surface text-sm text-foreground/60 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {copiedId === "edgetx" ? "✓ Copié !" : "Copier"}
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([edgetxModel.content], { type: "text/yaml" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = edgetxModel.filename;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
                >
                  Télécharger .yml
                </button>
                {onInject && (
                  <button
                    onClick={() => onInject(selectedRadio, selectedDrone, bindingPhrase)}
                    disabled={isInjecting}
                    className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors disabled:opacity-50"
                  >
                    {isInjecting ? "Injection..." : "Injecter sur la SD"}
                  </button>
                )}
              </div>
            </div>

            {injectResult && (
              <div className={`p-3 rounded-lg text-sm ${
                injectResult.success
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              }`}>
                {injectResult.message}
              </div>
            )}

            <pre className="bg-background rounded-xl p-4 text-xs text-foreground/70 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed border border-border">
              {edgetxModel.content}
            </pre>
          </div>
        )}

        {activeTab === "betaflight" && bfConfig && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">{bfConfig.name}</h3>
                <p className="text-xs text-foreground/40">{bfConfig.description}</p>
              </div>
              <button
                onClick={() => copyToClipboard(bfConfig.cliDump, "betaflight")}
                className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {copiedId === "betaflight" ? "✓ Copié !" : "Copier le CLI"}
              </button>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-sm text-warning">
              <p className="font-bold mb-1">Comment utiliser :</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Connecte ton {drone?.name} en USB (SANS les hélices !)</li>
                <li>Ouvre Betaflight Configurator</li>
                <li>Clique &quot;Connect&quot; en haut à droite</li>
                <li>Va dans l&apos;onglet <strong>CLI</strong></li>
                <li>Copie tout le texte ci-dessous et colle-le</li>
                <li>Le &quot;save&quot; à la fin redémarrera le FC automatiquement</li>
                <li>Vérifie dans l&apos;onglet <strong>Receiver</strong> que les sticks répondent</li>
              </ol>
            </div>

            <pre className="bg-background rounded-xl p-4 text-xs text-foreground/70 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed border border-border font-mono">
              {bfConfig.cliDump}
            </pre>
          </div>
        )}

        {activeTab === "elrs" && (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl p-5 border border-border">
              <h3 className="font-bold text-sm mb-4">Configuration ELRS recommandée</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-foreground/30 text-xs">Binding Phrase</span>
                  <p className="font-mono text-accent">
                    {bindingPhrase || "(pas encore définie)"}
                  </p>
                </div>
                <div>
                  <span className="text-foreground/30 text-xs">Packet Rate</span>
                  <p className="font-mono">{elrs.rate} Hz</p>
                </div>
                <div>
                  <span className="text-foreground/30 text-xs">Télémétrie</span>
                  <p className="font-mono">{elrs.tlmRatio}</p>
                </div>
                <div>
                  <span className="text-foreground/30 text-xs">Puissance TX</span>
                  <p className="font-mono">{elrs.power} mW</p>
                </div>
                <div>
                  <span className="text-foreground/30 text-xs">Switch Mode</span>
                  <p className="font-mono">{elrs.switchMode}</p>
                </div>
                <div>
                  <span className="text-foreground/30 text-xs">Fréquence</span>
                  <p className="font-mono">2.4 GHz</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-5 border border-border">
              <h3 className="font-bold text-sm mb-3">Où configurer ELRS</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-radio mb-2">Sur la radio ({radio?.name})</h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-foreground/60">
                    <li>Allume ta radio</li>
                    <li>Long press sur SYS → TOOLS → ExpressLRS (Lua script)</li>
                    <li>Tu peux modifier: Packet Rate, TX Power, Switch Mode</li>
                    <li>La Binding Phrase se configure en flashant le module TX via ExpressLRS Configurator</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium text-drone mb-2">Sur le drone ({drone?.name})</h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-foreground/60">
                    <li>Méthode 1 (WiFi): Allume le drone sans la radio → après ~60s le RX passe en mode WiFi</li>
                    <li>Connecte-toi au réseau WiFi &quot;ExpressLRS RX&quot; → 10.0.0.1</li>
                    <li>Entre ta Binding Phrase dans le champ et flash</li>
                    <li>Méthode 2 (Passthrough): Dans Betaflight CLI, tape <code className="bg-background px-1 rounded">serialpassthrough X Y</code></li>
                    <li>Puis flash via ExpressLRS Configurator en mode &quot;Betaflight Passthrough&quot;</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
