"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FPVDevice, FPVProfile, EdgeTXRadioConfig } from "@/types/devices";
import {
  RadioSpec,
  DroneSpec,
  EdgeTXModelTemplate,
  BetaflightTemplate,
  ELRSConfig,
  BeginnerTip,
} from "@/lib/config-templates";
import DeviceCard from "@/components/DeviceCard";
import ScanButton from "@/components/ScanButton";
import ProfileCard from "@/components/ProfileCard";
import EdgeTXInfo from "@/components/EdgeTXInfo";
import BindingWizard from "@/components/BindingWizard";
import ConfigPreview from "@/components/ConfigPreview";
import BeginnerGuide from "@/components/BeginnerGuide";
import SimulatorTab from "@/components/SimulatorTab";
import RadioAnalyzer from "@/components/RadioAnalyzer";
import ELRSFlashGuide from "@/components/ELRSFlashGuide";
import DroneControl from "@/components/DroneControl";

type Tab = "detection" | "drone" | "analyze" | "elrs" | "configs" | "simulator" | "guide";

export default function Dashboard() {
  // Tab
  const [activeTab, setActiveTab] = useState<Tab>("detection");

  // Detection state
  const [detectedDevices, setDetectedDevices] = useState<FPVDevice[]>([]);
  const [savedDevices, setSavedDevices] = useState<FPVDevice[]>([]);
  const [profiles, setProfiles] = useState<FPVProfile[]>([]);
  const [edgeTXConfig, setEdgeTXConfig] = useState<EdgeTXRadioConfig | null>(null);
  const [edgeTXMount, setEdgeTXMount] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [serialPorts, setSerialPorts] = useState<string[]>([]);
  const [lastScan, setLastScan] = useState<string>("");
  const [autoScan, setAutoScan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Config templates state
  const [radios, setRadios] = useState<Record<string, RadioSpec>>({});
  const [drones, setDrones] = useState<Record<string, DroneSpec>>({});
  const [edgetxModels, setEdgetxModels] = useState<EdgeTXModelTemplate[]>([]);
  const [betaflightConfigs, setBetaflightConfigs] = useState<BetaflightTemplate[]>([]);
  const [elrsConfig, setElrsConfig] = useState<ELRSConfig | null>(null);
  const [tips, setTips] = useState<BeginnerTip[]>([]);
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectResult, setInjectResult] = useState<{ success: boolean; message: string } | null>(null);

  // Ref to track saved device IDs (avoids stale closure in scanUSB)
  const savedDeviceIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    savedDeviceIdsRef.current = new Set(savedDevices.map((d) => d.id));
  }, [savedDevices]);

  // Load data on mount
  useEffect(() => {
    loadInventory();
    loadProfiles();
    loadTemplates();
  }, []);

  // Auto-scan with stable callback (no stale closure)
  const scanUSB = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      // Scan USB devices
      const usbRes = await fetch("/api/usb/scan");
      if (!usbRes.ok) throw new Error(`Scan USB failed (${usbRes.status})`);
      const usbData = await usbRes.json();

      if (usbData.success) {
        if (Array.isArray(usbData.devices)) setDetectedDevices(usbData.devices);
        setSerialPorts(Array.isArray(usbData.serialPorts) ? usbData.serialPorts : []);
        if (usbData.scannedAt) setLastScan(usbData.scannedAt);

        // Auto-save new devices — use ref to avoid stale closure
        const currentSavedIds = savedDeviceIdsRef.current;
        for (const device of usbData.devices) {
          if (!currentSavedIds.has(device.id)) {
            await saveToInventory(device);
          }
        }
      }

      // Try to read EdgeTX SD card (404 is expected when not plugged in)
      const edgetxRes = await fetch("/api/edgetx");
      if (edgetxRes.ok) {
        const edgetxData = await edgetxRes.json();
        if (edgetxData.success && edgetxData.config) {
          setEdgeTXConfig(edgetxData.config);
          setEdgeTXMount(edgetxData.mountPoint || "");
        } else {
          setEdgeTXConfig(null);
        }
      } else {
        setEdgeTXConfig(null);
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du scan USB");
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Auto-scan interval — stable because scanUSB has no deps
  useEffect(() => {
    if (!autoScan) return;
    const interval = setInterval(scanUSB, 3000);
    return () => clearInterval(interval);
  }, [autoScan, scanUSB]);

  const loadInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.devices)) {
        setSavedDevices(data.devices);
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    }
  };

  const loadProfiles = async () => {
    try {
      const res = await fetch("/api/profiles");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
      }
    } catch (err) {
      console.error("Failed to load profiles:", err);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        if (data.radios) setRadios(data.radios);
        if (data.drones) setDrones(data.drones);
        if (Array.isArray(data.edgetxModels)) setEdgetxModels(data.edgetxModels);
        if (Array.isArray(data.betaflightConfigs)) setBetaflightConfigs(data.betaflightConfigs);
        if (data.elrs) setElrsConfig(data.elrs);
        if (Array.isArray(data.tips)) setTips(data.tips);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  };

  const saveToInventory = async (device: FPVDevice) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(device),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setSavedDevices((prev) => {
          if (prev.some((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }
    } catch (err) {
      console.error("Failed to save device:", err);
    }
  };

  const createProfile = async (droneId: string, radioId: string, bindingPhrase: string) => {
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoCreate: true, droneId, radioId, bindingPhrase }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setProfiles((prev) => [...prev, data.profile]);
        setShowWizard(false);
      } else {
        setError(data.error || "Erreur lors de la création du profil");
      }
    } catch (err) {
      console.error("Failed to create profile:", err);
      setError("Erreur lors de la création du profil — vérifie ta connexion");
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete profile:", err);
      setError("Erreur lors de la suppression du profil");
    }
  };

  const injectConfig = async (radioId: string, droneId: string, bindingPhrase: string) => {
    setIsInjecting(true);
    setInjectResult(null);
    try {
      const res = await fetch("/api/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ radioId, droneId, bindingPhrase }),
      });
      const data = await res.json();
      setInjectResult({
        success: data.success,
        message: data.message || data.error || "Erreur inconnue",
      });
    } catch (err) {
      setInjectResult({
        success: false,
        message: err instanceof Error ? err.message : "Erreur réseau",
      });
    } finally {
      setIsInjecting(false);
    }
  };

  const allDevices = [...savedDevices];
  for (const d of detectedDevices) {
    if (!allDevices.some((s) => s.id === d.id)) {
      allDevices.push(d);
    }
  }

  const deviceDrones = allDevices.filter((d) => d.category === "drone");
  const deviceRadios = allDevices.filter((d) => d.category === "radio");
  const deviceOthers = allDevices.filter(
    (d) => d.category !== "drone" && d.category !== "radio"
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-surface rounded-xl p-1">
          {([
            { id: "detection" as Tab, label: "Detection", icon: "🔌" },
            { id: "drone" as Tab, label: "Drone", icon: "🚁" },
            { id: "analyze" as Tab, label: "Radio SD", icon: "🔍" },
            { id: "elrs" as Tab, label: "Flash ELRS", icon: "📡" },
            { id: "configs" as Tab, label: "Templates", icon: "⚙️" },
            { id: "simulator" as Tab, label: "Simulateur", icon: "🎮" },
            { id: "guide" as Tab, label: "Guide", icon: "📖" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-black"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "detection" && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground/50 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScan}
                onChange={(e) => {
                  setAutoScan(e.target.checked);
                  if (e.target.checked) scanUSB();
                }}
                className="rounded"
              />
              Auto-scan
            </label>
            <ScanButton
              isScanning={isScanning}
              onScan={scanUSB}
              deviceCount={detectedDevices.length}
            />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between bg-danger/10 border border-danger/20 text-danger rounded-xl px-4 py-3 text-sm">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-danger/50 hover:text-danger ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: DETECTION USB */}
      {/* ============================================================ */}
      {activeTab === "detection" && (
        <div className="space-y-8">
          {/* Status Bar */}
          {lastScan && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/40">
              <span>Dernier scan: {new Date(lastScan).toLocaleTimeString("fr-FR")}</span>
              <span className="hidden md:inline">|</span>
              <span>{detectedDevices.length} appareil(s) USB détecté(s)</span>
              <span className="hidden md:inline">|</span>
              <span>{serialPorts.length} port(s) série</span>
              {edgeTXConfig && (
                <>
                  <span className="hidden md:inline">|</span>
                  <span className="text-radio">EdgeTX SD détectée</span>
                </>
              )}
            </div>
          )}

          {/* Detected Devices */}
          {detectedDevices.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                Appareils détectés
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {detectedDevices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    isSaved={savedDevices.some((s) => s.id === device.id)}
                    onSaveToInventory={saveToInventory}
                    onConfigure={() => setActiveTab("configs")}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No devices */}
          {detectedDevices.length === 0 && !isScanning && (
            <div className="text-center py-16 text-foreground/30">
              <div className="text-6xl mb-4">🔌</div>
              <p className="text-lg">Aucun appareil FPV détecté</p>
              <p className="text-sm mt-2">
                Branche ta TX16S, ton Pocket, ou un FC en USB puis clique sur Scanner
              </p>
              <div className="mt-6 text-left max-w-md mx-auto bg-surface rounded-xl p-4 text-xs text-foreground/50 space-y-2">
                <p className="font-medium text-foreground/70">Comment connecter tes appareils :</p>
                <p><strong className="text-radio">TX16S / Pocket :</strong> Branche en USB-C. La radio te demandera le mode — choisis &quot;USB Storage&quot; pour lire la carte SD, ou &quot;USB Serial (VCP)&quot; pour le port série.</p>
                <p><strong className="text-drone">Hulk 2 / Nazgul :</strong> Branche le FC en USB (le petit port sur le flight controller). Pas besoin de batterie. ENLÈVE LES HÉLICES !</p>
                <p><strong className="text-goggles">DJI Remote :</strong> Branche en USB-C sur le Mac.</p>
              </div>
            </div>
          )}

          {/* Scanning animation */}
          {isScanning && detectedDevices.length === 0 && (
            <div className="text-center py-16 text-foreground/30">
              <div className="text-6xl mb-4 animate-pulse">📡</div>
              <p className="text-lg">Scan USB en cours...</p>
              <p className="text-sm mt-2">Recherche des appareils FPV sur les ports USB</p>
            </div>
          )}

          {/* EdgeTX Config */}
          {edgeTXConfig && (
            <section>
              <h2 className="text-lg font-bold mb-4">Configuration EdgeTX</h2>
              <EdgeTXInfo config={edgeTXConfig} mountPoint={edgeTXMount} />
            </section>
          )}

          {/* Inventory */}
          {savedDevices.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">
                Inventaire ({savedDevices.length})
              </h2>

              {deviceDrones.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-drone mb-3">
                    🚁 Drones ({deviceDrones.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deviceDrones.map((d) => (
                      <DeviceCard key={d.id} device={d} isSaved onConfigure={() => setActiveTab("configs")} />
                    ))}
                  </div>
                </div>
              )}

              {deviceRadios.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-radio mb-3">
                    🎮 Radios ({deviceRadios.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deviceRadios.map((r) => (
                      <DeviceCard key={r.id} device={r} isSaved onConfigure={() => setActiveTab("configs")} />
                    ))}
                  </div>
                </div>
              )}

              {deviceOthers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground/50 mb-3">
                    📡 Autres ({deviceOthers.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deviceOthers.map((d) => (
                      <DeviceCard key={d.id} device={d} isSaved onConfigure={() => setActiveTab("configs")} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Profiles */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                Profils de vol ({profiles.length})
              </h2>
              <button
                onClick={() => setShowWizard(true)}
                className="px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
              >
                + Nouveau profil (Binding Wizard)
              </button>
            </div>

            {profiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((p) => (
                  <ProfileCard
                    key={p.id}
                    profile={p}
                    devices={allDevices}
                    onDelete={deleteProfile}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/30 border border-dashed border-border rounded-xl">
                <p>Aucun profil de vol</p>
                <p className="text-xs mt-1">
                  Détecte un drone + une radio puis crée un profil pour les associer
                </p>
              </div>
            )}
          </section>

          {/* Serial Ports */}
          {serialPorts.length > 0 && (
            <section className="text-xs text-foreground/20">
              <h3 className="font-medium mb-1">Ports série détectés:</h3>
              <div className="flex flex-wrap gap-2 font-mono">
                {serialPorts.map((p) => (
                  <span key={p} className="px-2 py-1 bg-surface rounded">{p}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: DRONE CONTROL */}
      {/* ============================================================ */}
      {activeTab === "drone" && <DroneControl />}

      {/* ============================================================ */}
      {/* TAB: ANALYZE & CONFIGURE */}
      {/* ============================================================ */}
      {activeTab === "analyze" && <RadioAnalyzer />}

      {/* ============================================================ */}
      {/* TAB: ELRS FLASH GUIDE */}
      {/* ============================================================ */}
      {activeTab === "elrs" && <ELRSFlashGuide />}

      {/* ============================================================ */}
      {/* TAB: CONFIGS & TEMPLATES */}
      {/* ============================================================ */}
      {activeTab === "configs" && Object.keys(radios).length > 0 && elrsConfig && (
        <ConfigPreview
          radios={radios}
          drones={drones}
          edgetxModels={edgetxModels}
          betaflightConfigs={betaflightConfigs}
          elrs={elrsConfig}
          onInject={injectConfig}
          isInjecting={isInjecting}
          injectResult={injectResult}
        />
      )}
      {activeTab === "configs" && Object.keys(radios).length === 0 && (
        <div className="text-center py-16 text-foreground/30">
          <div className="text-4xl mb-3 animate-pulse">⚙️</div>
          <p>Chargement des templates...</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: SIMULATOR */}
      {/* ============================================================ */}
      {activeTab === "simulator" && <SimulatorTab />}

      {/* ============================================================ */}
      {/* TAB: GUIDE DEBUTANT */}
      {/* ============================================================ */}
      {activeTab === "guide" && tips.length > 0 && (
        <BeginnerGuide tips={tips} />
      )}
      {activeTab === "guide" && tips.length === 0 && (
        <div className="text-center py-16 text-foreground/30">
          <div className="text-4xl mb-3 animate-pulse">📖</div>
          <p>Chargement du guide...</p>
        </div>
      )}

      {/* Binding Wizard Modal */}
      {showWizard && (
        <BindingWizard
          drones={deviceDrones}
          radios={deviceRadios}
          onComplete={createProfile}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
