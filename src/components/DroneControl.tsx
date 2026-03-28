"use client";

import { useState, useEffect, useRef } from "react";
import MotorTest from "./MotorTest";

interface DroneStatus {
  connected: boolean;
  port: string;
  rxProvider: string;
  failsafe: string;
  motorProtocol: string;
  rates: { rc: string; srate: string; expo: string };
  modes: string[];
  serial: string[];
  armed: boolean;
  bindStatus: string;
}

export default function DroneControl() {
  const [status, setStatus] = useState<DroneStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [flashLog, setFlashLog] = useState<string[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState<"nazgul" | "hulk2">("nazgul");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkDrone();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const startLiveMonitor = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(checkDrone, 3000);
  };

  const stopLiveMonitor = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const checkDrone = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/betaflight/flash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commands: [
            "get serialrx_provider",
            "get failsafe_procedure",
            "get motor_pwm_protocol",
            "get roll_rc_rate",
            "get roll_srate",
            "get roll_expo",
            "serial",
            "aux",
          ],
        }),
      });
      const data = await res.json();

      if (data.success && data.result) {
        const responses = data.result.responses || [];
        const allText = responses.join("\n");

        const getValue = (key: string) => {
          const match = allText.match(new RegExp(`${key}\\s*=\\s*(.+)`));
          return match ? match[1].trim() : "?";
        };

        const serials: string[] = [];
        const modes: string[] = [];
        for (const r of responses) {
          for (const line of r.split("\n")) {
            const l = line.trim();
            if (l.startsWith("serial ") && !l.startsWith("serial →")) serials.push(l);
            if (l.startsWith("aux ") && !l.startsWith("aux →")) modes.push(l);
          }
        }

        const rxOk = getValue("serialrx_provider") === "CRSF";
        const hasSerialRx = serials.some((s) => {
          const parts = s.split(" ");
          return parts.length >= 3 && (parseInt(parts[2]) & 64) !== 0;
        });

        setStatus({
          connected: true,
          port: data.result.port,
          rxProvider: getValue("serialrx_provider"),
          failsafe: getValue("failsafe_procedure"),
          motorProtocol: getValue("motor_pwm_protocol"),
          rates: {
            rc: getValue("roll_rc_rate"),
            srate: getValue("roll_srate"),
            expo: getValue("roll_expo"),
          },
          modes,
          serial: serials,
          armed: false,
          bindStatus: rxOk && hasSerialRx ? "CRSF OK" : "Problème RX",
        });
      } else {
        setStatus(null);
      }
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const flashConfig = async () => {
    setIsFlashing(true);
    setFlashLog(["Envoi de la config Betaflight..."]);

    const uartIndex = selectedDrone === "nazgul" ? 1 : 0;
    const craftName = selectedDrone === "nazgul" ? "Nazgul" : "Hulk2";

    const commands = [
      `serial ${uartIndex} 64 115200 57600 0 115200`,
      "set serialrx_provider = CRSF",
      "set serialrx_inverted = OFF",
      "set serialrx_halfduplex = OFF",
      "map AETR1234",
      "set failsafe_procedure = DROP",
      "set failsafe_throttle = 1000",
      "set failsafe_delay = 4",
      "set failsafe_recovery_delay = 20",
      "aux 0 0 0 1800 2100 0 0",
      "aux 1 1 1 900 1300 0 0",
      "aux 2 2 1 1300 1700 0 0",
      "aux 3 13 2 1800 2100 0 0",
      "aux 4 35 3 1800 2100 0 0",
      "set motor_pwm_protocol = DSHOT600",
      "set dshot_bidir = ON",
      "set motor_poles = 14",
      "set rates_type = BETAFLIGHT",
      "set roll_rc_rate = 100",
      "set roll_expo = 30",
      "set roll_srate = 70",
      "set pitch_rc_rate = 100",
      "set pitch_expo = 30",
      "set pitch_srate = 70",
      "set yaw_rc_rate = 100",
      "set yaw_expo = 30",
      "set yaw_srate = 70",
      "feature -SOFTSERIAL",
      "feature TELEMETRY",
      "feature OSD",
      "feature ANTI_GRAVITY",
      "feature DYNAMIC_FILTER",
      "set anti_gravity_gain = 80",
      "set vbat_min_cell_voltage = 340",
      "set vbat_warning_cell_voltage = 350",
      "set vbat_max_cell_voltage = 430",
      "set osd_vbat_pos = 2433",
      "set osd_rssi_pos = 2081",
      "set osd_tim_1_pos = 2455",
      "set osd_flymode_pos = 2457",
      "set osd_craft_name_pos = 2506",
      "set osd_warnings_pos = 2378",
      "save",
    ];

    try {
      const res = await fetch("/api/betaflight/flash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands }),
      });
      const data = await res.json();
      const r = data.result || {};

      setFlashLog((prev) => [
        ...prev,
        `Commands: ${r.commandsSent || 0}`,
        ...(r.responses || []).slice(0, 5).map((s: string) => s.slice(0, 80)),
        data.success ? "FLASH RÉUSSI — FC reboot..." : `ERREUR: ${r.error || "?"}`,
      ]);

      if (data.success) {
        setTimeout(() => checkDrone(), 6000);
      }
    } catch (err) {
      setFlashLog((prev) => [...prev, `Erreur: ${err}`]);
    } finally {
      setIsFlashing(false);
    }
  };

  const modeNames: Record<string, string> = {
    "0": "ARM", "1": "ANGLE", "2": "HORIZON", "13": "BEEPER", "35": "TURTLE",
  };

  const switchNames: Record<string, string> = {
    "0": "AUX1 (SF)", "1": "AUX2 (SC)", "2": "AUX3 (SE)", "3": "AUX4 (SG)",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Contrôle Drone</h2>
          <p className="text-sm text-foreground/40">
            Lecture en direct et configuration Betaflight via USB
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkDrone}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-bold hover:bg-accent-dim disabled:opacity-50"
          >
            {isLoading ? "Lecture..." : "Rafraîchir"}
          </button>
        </div>
      </div>

      {/* Connection status */}
      {!status && !isLoading && (
        <div className="text-center py-12 text-foreground/30">
          <div className="text-5xl mb-4">🚁</div>
          <p className="text-lg">Aucun drone détecté en USB</p>
          <p className="text-sm mt-2">
            Branche ton drone en USB. <strong className="text-danger">HÉLICES ENLEVÉES !</strong>
          </p>
        </div>
      )}

      {status && (
        <>
          {/* Status cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-[10px] text-foreground/30 mb-1">Connexion</p>
              <p className={`font-bold text-sm ${status.connected ? "text-success" : "text-danger"}`}>
                {status.connected ? "Connecté" : "Déconnecté"}
              </p>
              <p className="text-[10px] text-foreground/20 mt-1 font-mono">{status.port}</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-[10px] text-foreground/30 mb-1">Récepteur</p>
              <p className={`font-bold text-sm ${status.rxProvider === "CRSF" ? "text-success" : "text-danger"}`}>
                {status.rxProvider}
              </p>
              <p className="text-[10px] text-foreground/20 mt-1">{status.bindStatus}</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-[10px] text-foreground/30 mb-1">Failsafe</p>
              <p className={`font-bold text-sm ${status.failsafe === "DROP" ? "text-success" : "text-danger"}`}>
                {status.failsafe}
              </p>
              <p className="text-[10px] text-foreground/20 mt-1">Coupe moteurs si perte signal</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-[10px] text-foreground/30 mb-1">Moteurs</p>
              <p className="font-bold text-sm text-foreground">{status.motorProtocol}</p>
              <p className="text-[10px] text-foreground/20 mt-1">Bidirectionnel</p>
            </div>
          </div>

          {/* Rates */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold mb-3">Rates (vitesse de rotation)</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-foreground/30">RC Rate</p>
                <p className="text-xl font-mono font-bold text-accent">{status.rates.rc}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-foreground/30">Super Rate</p>
                <p className="text-xl font-mono font-bold text-accent">{status.rates.srate}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-foreground/30">Expo</p>
                <p className="text-xl font-mono font-bold text-accent">{status.rates.expo}</p>
              </div>
            </div>
          </div>

          {/* Modes */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold mb-3">Modes de vol</h3>
            <div className="space-y-2">
              {status.modes.map((mode, i) => {
                const parts = mode.split(" ");
                if (parts.length < 6) return null;
                const modeId = parts[2];
                const auxCh = parts[3];
                const rangeLo = parts[4];
                const rangeHi = parts[5];
                const name = modeNames[modeId] || `MODE_${modeId}`;
                const sw = switchNames[auxCh] || `AUX${parseInt(auxCh) + 1}`;
                const colors: Record<string, string> = {
                  ARM: "text-danger",
                  ANGLE: "text-success",
                  HORIZON: "text-accent",
                  BEEPER: "text-purple-400",
                  TURTLE: "text-warning",
                };
                return (
                  <div key={i} className="flex items-center justify-between bg-background rounded-lg px-4 py-2">
                    <span className={`font-bold text-sm ${colors[name] || "text-foreground"}`}>{name}</span>
                    <span className="text-xs text-foreground/40">{sw}</span>
                    <span className="text-xs font-mono text-foreground/30">{rangeLo}-{rangeHi}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ARM warning */}
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-4">
            <h3 className="font-bold text-sm text-danger mb-2">Comment armer le drone</h3>
            <p className="text-xs text-foreground/60 mb-2">
              Le switch <strong>SF</strong> (en bas a droite de ta TX16S) arme/desarme les moteurs.
            </p>
            <ul className="text-xs text-foreground/50 space-y-1">
              <li><strong className="text-danger">SF vers le haut = ARMÉ</strong> — les moteurs peuvent tourner</li>
              <li><strong className="text-success">SF vers le bas = SAFE</strong> — moteurs bloqués</li>
            </ul>
            <div className="mt-3 p-3 bg-danger/10 rounded-lg">
              <p className="text-xs text-danger font-bold">
                NE JAMAIS ARMER AVEC LES HÉLICES ! Pour tester les moteurs sans hélices :
                arme avec SF, puis monte doucement les gaz (stick gauche vers le haut).
              </p>
            </div>
          </div>

          {/* Serial ports */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold mb-2">Ports série</h3>
            <div className="space-y-1">
              {status.serial.map((s, i) => {
                const parts = s.split(" ");
                const uart = parseInt(parts[1]) + 1;
                const func = parseInt(parts[2]);
                const funcs: string[] = [];
                if (func & 1) funcs.push("MSP");
                if (func & 64) funcs.push("SERIAL_RX");
                if (func & 32) funcs.push("TELEMETRY");
                const isRx = (func & 64) !== 0;
                return (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isRx ? "bg-success/10" : "bg-background"}`}>
                    <span className="text-sm font-mono">UART{uart}</span>
                    <span className={`text-xs ${isRx ? "text-success font-bold" : "text-foreground/40"}`}>
                      {funcs.join(" + ") || "OFF"} {isRx ? "← RX ELRS" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Flash section */}
      <div className="bg-surface rounded-xl border border-accent/20 p-5">
        <h3 className="font-bold text-sm mb-3">Flash Config Betaflight</h3>

        <div className="flex gap-2 mb-4">
          {(["nazgul", "hulk2"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDrone(d)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                selectedDrone === d
                  ? "bg-drone/20 text-drone border border-drone/30 font-medium"
                  : "bg-background border border-border text-foreground/50"
              }`}
            >
              {d === "nazgul" ? "Nazgul (UART2)" : "Hulk 2 (UART1)"}
            </button>
          ))}
        </div>

        <button
          onClick={flashConfig}
          disabled={isFlashing || !status}
          className="w-full px-4 py-3 rounded-lg bg-accent text-black font-bold text-sm hover:bg-accent-dim disabled:opacity-50 transition-colors"
        >
          {isFlashing ? "Flash en cours..." : `Flasher config ${selectedDrone === "nazgul" ? "Nazgul" : "Hulk 2"}`}
        </button>

        {flashLog.length > 0 && (
          <div className="mt-3 bg-background rounded-lg p-3 max-h-40 overflow-y-auto">
            {flashLog.map((log, i) => (
              <p key={i} className={`text-xs font-mono ${log.includes("RÉUSSI") ? "text-success" : log.includes("ERREUR") ? "text-danger" : "text-foreground/50"}`}>
                {log}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Motor test — only show when drone is connected */}
      {status && <MotorTest />}
    </div>
  );
}
