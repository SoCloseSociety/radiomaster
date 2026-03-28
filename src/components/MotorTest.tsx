"use client";

import { useState } from "react";

interface MotorStatus {
  id: number;
  name: string;
  position: string;
  direction: string;
  pin: string;
  spinning: boolean;
  tested: boolean;
  ok: boolean | null;
}

export default function MotorTest() {
  const [motors, setMotors] = useState<MotorStatus[]>([
    { id: 1, name: "M1", position: "Arrière Droit", direction: "CCW", pin: "B01", spinning: false, tested: false, ok: null },
    { id: 2, name: "M2", position: "Avant Droit", direction: "CW", pin: "B00", spinning: false, tested: false, ok: null },
    { id: 3, name: "M3", position: "Arrière Gauche", direction: "CW", pin: "C08", spinning: false, tested: false, ok: null },
    { id: 4, name: "M4", position: "Avant Gauche", direction: "CCW", pin: "C09", spinning: false, tested: false, ok: null },
  ]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [allTestsDone, setAllTestsDone] = useState(false);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);

  const spinMotor = async (motorIdx: number) => {
    // motor command in BF CLI: motor <index> <value>
    // index 0-3, value 0=stop, 1050=minimum spin
    setMotors((prev) =>
      prev.map((m, i) => (i === motorIdx ? { ...m, spinning: true } : m))
    );
    setTestLog((prev) => [...prev, `Test M${motorIdx + 1} (${motors[motorIdx].position})...`]);

    try {
      // Spin at minimum for 2 seconds
      await fetch("/api/betaflight/flash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commands: [`motor ${motorIdx} 1050`],
        }),
      });

      // Wait 3 seconds
      await new Promise((r) => setTimeout(r, 3000));

      // Stop
      await fetch("/api/betaflight/flash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commands: ["motor stop"],
        }),
      });

      setMotors((prev) =>
        prev.map((m, i) => (i === motorIdx ? { ...m, spinning: false, tested: true, ok: true } : m))
      );
      setTestLog((prev) => [...prev, `M${motorIdx + 1} OK — a tourné`]);
    } catch (err) {
      setMotors((prev) =>
        prev.map((m, i) => (i === motorIdx ? { ...m, spinning: false, tested: true, ok: false } : m))
      );
      setTestLog((prev) => [...prev, `M${motorIdx + 1} ERREUR: ${err}`]);
    }
  };

  const runAllTests = async () => {
    setIsTestRunning(true);
    setTestLog(["Début du test séquentiel des 4 moteurs..."]);
    setAllTestsDone(false);

    for (let i = 0; i < 4; i++) {
      await spinMotor(i);
      // Pause between motors
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Final stop
    await fetch("/api/betaflight/flash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands: ["motor stop"] }),
    });

    setTestLog((prev) => [...prev, "", "Test terminé !"]);
    setIsTestRunning(false);
    setAllTestsDone(true);
  };

  const stopAll = async () => {
    await fetch("/api/betaflight/flash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands: ["motor stop"] }),
    });
    setMotors((prev) => prev.map((m) => ({ ...m, spinning: false })));
    setTestLog((prev) => [...prev, "STOP — tous les moteurs arrêtés"]);
    setIsTestRunning(false);
  };

  const motorColors = {
    spinning: "border-warning bg-warning/20 shadow-lg shadow-warning/20",
    ok: "border-success bg-success/10",
    fail: "border-danger bg-danger/10",
    idle: "border-border bg-surface",
  };

  const getMotorStyle = (m: MotorStatus) => {
    if (m.spinning) return motorColors.spinning;
    if (m.tested && m.ok) return motorColors.ok;
    if (m.tested && !m.ok) return motorColors.fail;
    return motorColors.idle;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Test des moteurs</h2>
        <p className="text-sm text-foreground/40">
          Vérifie que les 4 moteurs fonctionnent et tournent dans le bon sens
        </p>
      </div>

      {/* Safety confirmation */}
      {!safetyConfirmed && (
        <div className="bg-danger/10 border-2 border-danger rounded-xl p-6 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-danger mb-2">SÉCURITÉ</h3>
          <p className="text-sm text-foreground/60 mb-4">
            Les moteurs vont tourner pendant le test.<br />
            Les hélices DOIVENT être retirées.
          </p>
          <button
            onClick={() => setSafetyConfirmed(true)}
            className="px-6 py-3 rounded-xl bg-danger text-white font-bold text-sm hover:bg-danger/80 transition-colors"
          >
            Les hélices sont enlevées — lancer le test
          </button>
        </div>
      )}

      {safetyConfirmed && (
        <>
          {/* Drone visual — top view */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-sm font-bold text-center mb-6 text-foreground/60">Vue de dessus</h3>

            <div className="relative w-72 h-72 mx-auto">
              {/* Drone body */}
              <div className="absolute inset-[35%] bg-background rounded-lg border border-border flex items-center justify-center">
                <span className="text-xs text-foreground/30">FC</span>
              </div>

              {/* Direction arrow */}
              <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-full text-foreground/20 text-xs">
                AVANT ↑
              </div>

              {/* Arms */}
              <div className="absolute top-[15%] left-[15%] w-[30%] h-[1px] bg-foreground/10 origin-bottom-right rotate-45" />
              <div className="absolute top-[15%] right-[15%] w-[30%] h-[1px] bg-foreground/10 origin-bottom-left -rotate-45" />
              <div className="absolute bottom-[15%] left-[15%] w-[30%] h-[1px] bg-foreground/10 origin-top-right -rotate-45" />
              <div className="absolute bottom-[15%] right-[15%] w-[30%] h-[1px] bg-foreground/10 origin-top-left rotate-45" />

              {/* Motor 4 — Front Left */}
              <button
                onClick={() => !isTestRunning && spinMotor(3)}
                disabled={isTestRunning}
                className={`absolute top-0 left-0 w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition-all ${getMotorStyle(motors[3])}`}
              >
                <span className="font-bold text-sm">M4</span>
                <span className="text-[9px] text-foreground/40">AV-G</span>
                <span className="text-[9px] text-accent">CCW ↺</span>
                {motors[3].spinning && <span className="text-[9px] text-warning animate-pulse">SPIN...</span>}
                {motors[3].tested && motors[3].ok && <span className="text-[9px] text-success">OK</span>}
              </button>

              {/* Motor 2 — Front Right */}
              <button
                onClick={() => !isTestRunning && spinMotor(1)}
                disabled={isTestRunning}
                className={`absolute top-0 right-0 w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition-all ${getMotorStyle(motors[1])}`}
              >
                <span className="font-bold text-sm">M2</span>
                <span className="text-[9px] text-foreground/40">AV-D</span>
                <span className="text-[9px] text-drone">CW ↻</span>
                {motors[1].spinning && <span className="text-[9px] text-warning animate-pulse">SPIN...</span>}
                {motors[1].tested && motors[1].ok && <span className="text-[9px] text-success">OK</span>}
              </button>

              {/* Motor 3 — Rear Left */}
              <button
                onClick={() => !isTestRunning && spinMotor(2)}
                disabled={isTestRunning}
                className={`absolute bottom-0 left-0 w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition-all ${getMotorStyle(motors[2])}`}
              >
                <span className="font-bold text-sm">M3</span>
                <span className="text-[9px] text-foreground/40">AR-G</span>
                <span className="text-[9px] text-drone">CW ↻</span>
                {motors[2].spinning && <span className="text-[9px] text-warning animate-pulse">SPIN...</span>}
                {motors[2].tested && motors[2].ok && <span className="text-[9px] text-success">OK</span>}
              </button>

              {/* Motor 1 — Rear Right */}
              <button
                onClick={() => !isTestRunning && spinMotor(0)}
                disabled={isTestRunning}
                className={`absolute bottom-0 right-0 w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition-all ${getMotorStyle(motors[0])}`}
              >
                <span className="font-bold text-sm">M1</span>
                <span className="text-[9px] text-foreground/40">AR-D</span>
                <span className="text-[9px] text-accent">CCW ↺</span>
                {motors[0].spinning && <span className="text-[9px] text-warning animate-pulse">SPIN...</span>}
                {motors[0].tested && motors[0].ok && <span className="text-[9px] text-success">OK</span>}
              </button>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4 text-[10px] text-foreground/40">
              <span><span className="text-accent">CCW ↺</span> = sens anti-horaire</span>
              <span><span className="text-drone">CW ↻</span> = sens horaire</span>
              <span>Config: <strong>Props In</strong></span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex gap-3">
            <button
              onClick={runAllTests}
              disabled={isTestRunning}
              className="flex-1 px-4 py-3 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent-dim disabled:opacity-50 transition-colors"
            >
              {isTestRunning ? "Test en cours..." : "Tester les 4 moteurs (séquentiel)"}
            </button>
            <button
              onClick={stopAll}
              className="px-6 py-3 rounded-xl bg-danger text-white font-bold text-sm hover:bg-danger/80 transition-colors"
            >
              STOP
            </button>
          </div>

          {/* Direction check info */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold mb-2">Comment vérifier le sens de rotation</h3>
            <p className="text-xs text-foreground/50 mb-3">
              Quand un moteur tourne, regarde-le par dessus et vérifie qu&apos;il tourne dans le bon sens :
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-background rounded-lg p-3">
                <p className="font-bold text-accent">M1 (AR-D) + M4 (AV-G)</p>
                <p className="text-foreground/50">Doivent tourner <strong>CCW</strong> (anti-horaire) ↺</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="font-bold text-drone">M2 (AV-D) + M3 (AR-G)</p>
                <p className="text-foreground/50">Doivent tourner <strong>CW</strong> (horaire) ↻</p>
              </div>
            </div>
            <p className="text-xs text-foreground/30 mt-3">
              Si un moteur tourne dans le mauvais sens : dans Betaflight → onglet Motors → coche &quot;Motor direction is reversed&quot; pour ce moteur.
              Ou inverse 2 fils du moteur physiquement.
            </p>
          </div>

          {/* Test log */}
          {testLog.length > 0 && (
            <div className="bg-background rounded-xl p-4 max-h-40 overflow-y-auto">
              <h3 className="text-xs font-bold text-foreground/40 mb-2">Log</h3>
              {testLog.map((log, i) => (
                <p key={i} className={`text-xs font-mono ${
                  log.includes("OK") ? "text-success" :
                  log.includes("ERREUR") ? "text-danger" :
                  log.includes("STOP") ? "text-warning" :
                  "text-foreground/50"
                }`}>
                  {log}
                </p>
              ))}
            </div>
          )}

          {/* All tests done */}
          {allTestsDone && motors.every((m) => m.ok) && (
            <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center">
              <p className="text-success font-bold">4/4 moteurs fonctionnent !</p>
              <p className="text-xs text-foreground/50 mt-1">
                Vérifie visuellement que chaque moteur tourne dans le bon sens (CCW/CW)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
