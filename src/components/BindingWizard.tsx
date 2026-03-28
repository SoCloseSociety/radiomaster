"use client";

import { useState } from "react";
import { FPVDevice } from "@/types/devices";

interface BindingWizardProps {
  drones: FPVDevice[];
  radios: FPVDevice[];
  onComplete: (droneId: string, radioId: string, bindingPhrase: string) => void;
  onCancel: () => void;
}

const BINDING_STEPS = [
  {
    title: "Sélection des appareils",
    description: "Choisis le drone et la radio à associer",
  },
  {
    title: "Binding Phrase ELRS",
    description: "Configure la même binding phrase sur les deux appareils",
  },
  {
    title: "Procédure de Bind",
    description: "Suis les étapes pour connecter les appareils",
  },
  {
    title: "Vérification",
    description: "Vérifie que tout fonctionne correctement",
  },
];

export default function BindingWizard({
  drones,
  radios,
  onComplete,
  onCancel,
}: BindingWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedDrone, setSelectedDrone] = useState<string>("");
  const [selectedRadio, setSelectedRadio] = useState<string>("");
  const [bindingPhrase, setBindingPhrase] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const currentStep = BINDING_STEPS[step];
  const drone = drones.find((d) => d.id === selectedDrone);
  const radio = radios.find((r) => r.id === selectedRadio);

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Assistant de Binding ELRS</h2>
            <button
              onClick={onCancel}
              className="text-foreground/30 hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-2">
            {BINDING_STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  i <= step ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-foreground/50 mt-3">
            Étape {step + 1}/{BINDING_STEPS.length} — {currentStep.title}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-foreground/60">{currentStep.description}</p>

              <div>
                <label className="text-sm font-medium text-foreground/60 mb-2 block">
                  🚁 Drone
                </label>
                {drones.length === 0 ? (
                  <p className="text-sm text-warning">
                    Aucun drone détecté. Branche ton drone en USB et scanne.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {drones.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDrone(d.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          selectedDrone === d.id
                            ? "border-drone bg-drone/10 text-drone"
                            : "border-border hover:border-foreground/20"
                        }`}
                      >
                        <span className="font-medium">{d.brand} {d.model}</span>
                        <span className="text-xs text-foreground/40 ml-2">{d.protocol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground/60 mb-2 block">
                  🎮 Radio
                </label>
                {radios.length === 0 ? (
                  <p className="text-sm text-warning">
                    Aucune radio détectée. Branche ta radio en USB et scanne.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {radios.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRadio(r.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          selectedRadio === r.id
                            ? "border-radio bg-radio/10 text-radio"
                            : "border-border hover:border-foreground/20"
                        }`}
                      >
                        <span className="font-medium">{r.brand} {r.model}</span>
                        <span className="text-xs text-foreground/40 ml-2">{r.protocol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-foreground/60">
                La binding phrase ELRS permet de lier ta radio et ton drone sans procédure
                de bind manuelle. Elle doit être identique sur les deux appareils.
              </p>
              <div>
                <label className="text-sm font-medium text-foreground/60 mb-2 block">
                  Binding Phrase
                </label>
                <input
                  type="text"
                  value={bindingPhrase}
                  onChange={(e) => setBindingPhrase(e.target.value)}
                  placeholder="ex: mon_phrase_secrete"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground font-mono focus:border-accent focus:outline-none"
                />
                <p className="text-xs text-foreground/30 mt-2">
                  Utilise la même phrase que celle configurée dans ExpressLRS Configurator.
                  Si tu n&apos;en as pas encore, choisis-en une maintenant.
                </p>
              </div>

              <div className="bg-background rounded-lg p-4 text-sm text-foreground/60 space-y-2">
                <p className="font-medium text-accent">Où configurer la binding phrase :</p>
                <p>
                  <strong>Radio ({radio?.model || "..."}):</strong> Via le Lua script ELRS
                  sur la radio, ou en flashant le TX module avec ExpressLRS Configurator.
                </p>
                <p>
                  <strong>Drone ({drone?.model || "..."}):</strong> En flashant le RX ELRS
                  embarqué via ExpressLRS Configurator (WiFi ou Betaflight Passthrough).
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-foreground/60">
                Suis ces étapes dans l&apos;ordre pour binder {drone?.model} avec {radio?.model} :
              </p>

              <div className="space-y-3">
                {[
                  {
                    key: "flash_tx",
                    label: `Flash le module TX ELRS de ta ${radio?.model || "radio"} avec la binding phrase`,
                    detail: "Via ExpressLRS Configurator → sélectionne ton module TX → entre la binding phrase → Flash",
                  },
                  {
                    key: "flash_rx",
                    label: `Flash le RX ELRS du ${drone?.model || "drone"} avec la même binding phrase`,
                    detail: "Via WiFi: mets le RX en mode WiFi (3 échecs de bind) puis connecte-toi au réseau ELRS",
                  },
                  {
                    key: "power_drone",
                    label: "Allume le drone (branche la batterie)",
                    detail: "Le RX va chercher le signal TX automatiquement",
                  },
                  {
                    key: "power_radio",
                    label: "Allume la radio et sélectionne le bon modèle",
                    detail: "Le modèle doit être configuré avec le module ELRS interne ou externe",
                  },
                  {
                    key: "check_bind",
                    label: "Vérifie la liaison — le RX LED doit être fixe (pas clignotant)",
                    detail: "LED clignotante = pas de liaison. LED fixe = bindé avec succès",
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => toggleCheck(item.key)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      checklist[item.key]
                        ? "border-success bg-success/10"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          checklist[item.key]
                            ? "border-success bg-success text-black"
                            : "border-foreground/30"
                        }`}
                      >
                        {checklist[item.key] && <span className="text-xs">✓</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-foreground/40 mt-1">{item.detail}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-foreground/60">
                Vérifications finales avant de voler :
              </p>

              <div className="space-y-3">
                {[
                  { key: "v_channels", label: "Les sticks répondent correctement dans Betaflight (onglet Receiver)" },
                  { key: "v_arm", label: "Le switch ARM fonctionne (configuré dans les Modes)" },
                  { key: "v_failsafe", label: "Le failsafe est configuré (coupure moteurs ou RTH)" },
                  { key: "v_motors", label: "Les moteurs tournent dans le bon sens" },
                  { key: "v_rssi", label: "Le RSSI/LQ s'affiche sur l'OSD ou la radio" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => toggleCheck(item.key)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      checklist[item.key]
                        ? "border-success bg-success/10"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          checklist[item.key]
                            ? "border-success bg-success text-black"
                            : "border-foreground/30"
                        }`}
                      >
                        {checklist[item.key] && <span className="text-xs">✓</span>}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-between">
          <button
            onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}
            className="px-4 py-2 rounded-lg text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            {step === 0 ? "Annuler" : "← Retour"}
          </button>

          {step < BINDING_STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 0 && (!selectedDrone || !selectedRadio)) ||
                (step === 1 && !bindingPhrase.trim())
              }
              className="px-6 py-2 rounded-lg bg-accent text-black text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent-dim transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={() => onComplete(selectedDrone, selectedRadio, bindingPhrase.trim())}
              className="px-6 py-2 rounded-lg bg-success text-black text-sm font-bold hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-success"
            >
              ✓ Terminé — Créer le profil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
