"use client";

import { useState } from "react";

const BINDING_PHRASE = "my_binding_phrase";

interface Step {
  id: string;
  title: string;
  detail: string;
  warning?: string;
  image?: string;
}

const TX_FLASH_STEPS: Step[] = [
  {
    id: "tx-1",
    title: "Télécharge ExpressLRS Configurator",
    detail: "Va sur github.com/ExpressLRS/ExpressLRS-Configurator/releases — télécharge le .dmg pour macOS. Installe l'app.",
    warning: "C'est une app séparée du dashboard, elle gère le flashing du firmware ELRS.",
  },
  {
    id: "tx-2",
    title: "Lance ExpressLRS Configurator",
    detail: "Ouvre l'app. Elle va détecter les mises à jour disponibles. Laisse-la se mettre à jour si besoin.",
  },
  {
    id: "tx-3",
    title: "Configure le module TX",
    detail: "Dans l'app, configure :\n• Target: RadioMaster TX16S Internal (CRSF)\n• Device category: TX\n• Device: RadioMaster TX16S Internal 2.4GHz\n• Firmware version: choisis la dernière version stable",
  },
  {
    id: "tx-4",
    title: "Entre la Binding Phrase",
    detail: `Dans le champ "Binding Phrase", entre exactement : ${BINDING_PHRASE}\n\nATTENTION: la phrase doit être IDENTIQUE sur le TX et tous les RX. Une seule lettre de différence et ça ne marchera pas.`,
    warning: `Ta binding phrase : ${BINDING_PHRASE}`,
  },
  {
    id: "tx-5",
    title: "Configure les options",
    detail: "Coche les options recommandées :\n• Regulatory Domain: EU_CE_2400 (Europe)\n• Binding Phrase: my_binding_phrase\n• Performance Options: laisse par défaut\n• WIFI_ON_INTERVAL: 60 (secondes avant que le WiFi s'active)",
  },
  {
    id: "tx-6",
    title: "Branche ta TX16S en USB",
    detail: "Branche ta TX16S au Mac avec le câble USB-C. Sur l'écran de la radio, choisis 'USB Serial (VCP)' — PAS USB Storage cette fois !",
    warning: "Pour le flash, c'est USB Serial, pas USB Storage !",
  },
  {
    id: "tx-7",
    title: "Sélectionne le port série",
    detail: "Dans ExpressLRS Configurator, clique sur 'Detect' ou sélectionne le port série qui apparaît (quelque chose comme /dev/tty.usbmodemXXXX).",
  },
  {
    id: "tx-8",
    title: "Flash !",
    detail: "Clique sur 'Build & Flash'. Le processus prend 1-2 minutes. NE DÉBRANCHE PAS le câble pendant le flash !\n\nTu verras une barre de progression. Quand c'est fini, le message 'Success' apparaît.",
    warning: "NE DÉBRANCHE PAS pendant le flash ! Si tu débranches, le module peut être briqué.",
  },
  {
    id: "tx-9",
    title: "Vérifie sur la radio",
    detail: "Débranche le câble. Redémarre la radio. Va dans SYS → TOOLS → ExpressLRS. Tu devrais voir la nouvelle version et ta binding phrase est maintenant intégrée dans le firmware du module TX.",
  },
];

const RX_WIFI_STEPS: Step[] = [
  {
    id: "rx-wifi-1",
    title: "Prépare ExpressLRS Configurator",
    detail: "Ouvre ExpressLRS Configurator sur ton Mac. Configure :\n• Target: le récepteur ELRS de ton drone\n• Device category: RX\n• Pour le Hulk 2: cherche 'Darwin' ou 'Happymodel EP' dans la liste\n• Pour le Nazgul: cherche 'iFlight' ou 'Happymodel EP'\n• Firmware version: même version que le TX !",
    warning: "La version du RX DOIT être la même que celle du TX !",
  },
  {
    id: "rx-wifi-2",
    title: "Entre la même Binding Phrase",
    detail: `Dans le champ "Binding Phrase", entre exactement : ${BINDING_PHRASE}\n\nC'est la même phrase que sur le TX. C'est ça qui fait que la radio et le drone se reconnaissent.`,
    warning: `Binding phrase (identique au TX) : ${BINDING_PHRASE}`,
  },
  {
    id: "rx-wifi-3",
    title: "Mets le RX en mode WiFi",
    detail: "Allume ton drone (branche une batterie LiPo). SANS la radio allumée !\n\nLe RX ELRS va chercher le signal TX. Après environ 60 secondes sans trouver de TX, il passe automatiquement en mode WiFi.",
    warning: "ENLÈVE LES HÉLICES avant de brancher la batterie !",
  },
  {
    id: "rx-wifi-4",
    title: "Connecte-toi au réseau WiFi du RX",
    detail: "Sur ton Mac, ouvre les réglages WiFi. Tu devrais voir un réseau appelé 'ExpressLRS RX' (ou similaire). Connecte-toi.\n\nMot de passe par défaut: expresslrs",
  },
  {
    id: "rx-wifi-5",
    title: "Flash le RX via WiFi",
    detail: "Retour dans ExpressLRS Configurator. La méthode de flash devrait être 'WiFi'. Clique sur 'Build & Flash'.\n\nLe firmware va être envoyé au RX via WiFi. Ça prend 1-2 minutes.",
    warning: "Garde le drone allumé pendant tout le flash ! Ne débranche pas la batterie.",
  },
  {
    id: "rx-wifi-6",
    title: "Le RX redémarre automatiquement",
    detail: "Quand le flash est terminé, le RX redémarre tout seul. La LED du RX devrait clignoter (cherche le TX).",
  },
  {
    id: "rx-wifi-7",
    title: "Allume ta radio et vérifie le bind",
    detail: "Allume ta TX16S, sélectionne le modèle 'Hulk 2' (ou 'Nazgul'). La LED du RX doit devenir fixe (plus de clignotement) = le bind est réussi !\n\n• LED clignotante rapide = pas de bind, vérifie la binding phrase\n• LED fixe = bindé avec succès !",
  },
];

const RX_PASSTHROUGH_STEPS: Step[] = [
  {
    id: "rx-pt-1",
    title: "Branche le drone en USB",
    detail: "Connecte le flight controller du drone au Mac avec un câble USB. ENLÈVE LES HÉLICES !",
    warning: "HÉLICES ENLEVÉES !",
  },
  {
    id: "rx-pt-2",
    title: "Ouvre Betaflight Configurator",
    detail: "Lance Betaflight Configurator et connecte-toi au FC (bouton Connect en haut à droite).",
  },
  {
    id: "rx-pt-3",
    title: "Active le Passthrough dans le CLI",
    detail: "Va dans l'onglet CLI de Betaflight. Tape la commande :\n\nserialpassthrough 0 420000\n\n(remplace 0 par le numéro du port série de ton RX si différent)\n\nLe FC redirige maintenant la connexion USB vers le RX ELRS.",
    warning: "Le numéro du port dépend de ton FC. Pour le Hulk 2: port 0, pour le Nazgul: port 1.",
  },
  {
    id: "rx-pt-4",
    title: "Flash via ExpressLRS Configurator",
    detail: "Dans ExpressLRS Configurator, sélectionne la méthode 'Betaflight Passthrough'. Sélectionne le port série et clique 'Build & Flash'.",
  },
  {
    id: "rx-pt-5",
    title: "Vérifie le bind",
    detail: "Débranche le drone du USB. Branche une batterie. Allume ta radio. La LED du RX doit passer de clignotante à fixe.",
  },
];

const TROUBLESHOOTING = [
  {
    problem: "Le bind ne fonctionne pas (LED clignote toujours)",
    solutions: [
      "Vérifie que la binding phrase est EXACTEMENT la même sur le TX et le RX (majuscules, espaces, tout compte)",
      "Vérifie que les versions ELRS sont les mêmes sur le TX et le RX",
      "Reflash les deux avec la même version et la même binding phrase",
      "Éteins et rallume le drone et la radio",
    ],
  },
  {
    problem: "ExpressLRS Configurator ne détecte pas le port série",
    solutions: [
      "Essaie un autre câble USB (certains ne transmettent que l'alimentation)",
      "Sur la radio: choisis 'USB Serial (VCP)' et non 'USB Storage'",
      "Installe les drivers: sur macOS les drivers STM32 VCP sont généralement inclus",
      "Redémarre le Mac si le port n'apparaît pas",
    ],
  },
  {
    problem: "Le WiFi du RX n'apparaît pas",
    solutions: [
      "Attends plus longtemps (jusqu'à 120 secondes)",
      "Assure-toi que ta radio est ÉTEINTE pendant que tu attends le WiFi",
      "Le RX doit être alimenté (batterie branchée sur le drone)",
      "Certains RX nécessitent 3 échecs de bind consécutifs avant le WiFi — éteins/rallume le drone 3 fois",
    ],
  },
  {
    problem: "Flash échoué / briqué",
    solutions: [
      "Ne panique pas ! Reflash via la méthode WiFi (le bootloader ELRS est rarement touché)",
      "Si le RX ne démarre plus en WiFi: essaie Betaflight Passthrough",
      "En dernier recours: flash avec un adaptateur FTDI directement sur les pads du RX",
    ],
  },
];

export default function ELRSFlashGuide() {
  const [activeSection, setActiveSection] = useState<"tx" | "rx-wifi" | "rx-passthrough" | "troubleshoot">("tx");
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
  const [expandedTrouble, setExpandedTrouble] = useState<number | null>(null);

  const toggleStep = (id: string) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderSteps = (steps: Step[]) => {
    const done = steps.filter((s) => checkedSteps.has(s.id)).length;
    const total = steps.length;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-full h-2 bg-background rounded-full overflow-hidden flex-1">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-foreground/40 flex-shrink-0">{done}/{total}</span>
        </div>

        {steps.map((step, i) => {
          const isDone = checkedSteps.has(step.id);
          return (
            <button
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                isDone
                  ? "border-success/20 bg-success/5"
                  : "border-border bg-surface hover:border-foreground/20"
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? "bg-success text-black"
                        : "bg-accent/20 text-accent"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm ${isDone ? "line-through text-foreground/40" : ""}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-foreground/50 mt-1 whitespace-pre-line leading-relaxed">
                    {step.detail}
                  </p>
                  {step.warning && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
                      {step.warning}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Guide Flash ELRS — Binding Phrase</h2>
        <p className="text-sm text-foreground/40">
          Configure la binding phrase <span className="font-mono text-accent">{BINDING_PHRASE}</span> sur
          ta radio et tes drones pour qu&apos;ils se connectent automatiquement
        </p>
      </div>

      {/* Binding phrase display */}
      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-foreground/50">Ta Binding Phrase (identique partout)</p>
          <p className="text-xl font-mono font-bold text-accent">{BINDING_PHRASE}</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(BINDING_PHRASE)}
          className="px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-colors"
        >
          Copier
        </button>
      </div>

      {/* Order explanation */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="font-bold text-sm mb-3">Ordre des opérations</h3>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-radio/10 text-radio">
            <span className="font-bold">1.</span> Flash le TX (radio)
          </div>
          <span className="text-foreground/30">→</span>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-drone/10 text-drone">
            <span className="font-bold">2.</span> Flash le RX (Hulk 2)
          </div>
          <span className="text-foreground/30">→</span>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-drone/10 text-drone">
            <span className="font-bold">3.</span> Flash le RX (Nazgul)
          </div>
        </div>
        <p className="text-xs text-foreground/40 mt-2">
          Flash d&apos;abord la radio, ensuite chaque drone un par un. La même binding phrase sur tout.
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 bg-surface rounded-xl p-1">
        {([
          { id: "tx" as const, label: "1. Flash TX (Radio)", icon: "🎮" },
          { id: "rx-wifi" as const, label: "2. Flash RX (WiFi)", icon: "📡" },
          { id: "rx-passthrough" as const, label: "2b. Flash RX (USB)", icon: "🔌" },
          { id: "troubleshoot" as const, label: "Dépannage", icon: "🔧" },
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

      {/* TX Flash */}
      {activeSection === "tx" && (
        <div>
          <h3 className="font-bold text-sm mb-1">Flash du module TX ELRS — RadioMaster TX16S</h3>
          <p className="text-xs text-foreground/40 mb-4">
            Cette étape inscrit la binding phrase dans le firmware du module ELRS interne de ta radio.
          </p>
          {renderSteps(TX_FLASH_STEPS)}
        </div>
      )}

      {/* RX Flash WiFi */}
      {activeSection === "rx-wifi" && (
        <div>
          <h3 className="font-bold text-sm mb-1">Flash du RX ELRS via WiFi — Méthode recommandée</h3>
          <p className="text-xs text-foreground/40 mb-4">
            Le RX du drone crée un réseau WiFi. Tu te connectes dessus et tu flash le firmware.
            Répète pour chaque drone (Hulk 2 puis Nazgul).
          </p>
          {renderSteps(RX_WIFI_STEPS)}
        </div>
      )}

      {/* RX Flash Passthrough */}
      {activeSection === "rx-passthrough" && (
        <div>
          <h3 className="font-bold text-sm mb-1">Flash du RX via Betaflight Passthrough — Méthode alternative</h3>
          <p className="text-xs text-foreground/40 mb-4">
            Si le WiFi ne marche pas, tu peux flasher le RX via le câble USB du flight controller.
          </p>
          {renderSteps(RX_PASSTHROUGH_STEPS)}
        </div>
      )}

      {/* Troubleshooting */}
      {activeSection === "troubleshoot" && (
        <div className="space-y-2">
          <h3 className="font-bold text-sm mb-4">Dépannage ELRS</h3>
          {TROUBLESHOOTING.map((item, i) => (
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
      )}
    </div>
  );
}
