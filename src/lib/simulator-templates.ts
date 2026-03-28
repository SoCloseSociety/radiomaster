/**
 * Simulator training templates for RadioMaster TX16S & Pocket
 *
 * Covers all major FPV simulators available on macOS.
 * Generates EdgeTX model configs optimized for sim use
 * and provides per-simulator axis mapping guides.
 */

// ============================================================
// TYPES
// ============================================================

export interface SimulatorInfo {
  id: string;
  name: string;
  platform: ("mac" | "windows" | "linux")[];
  free: boolean;
  price?: string;
  downloadUrl: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  features: string[];
  macNotes: string;
}

export interface SimAxisMapping {
  simulatorId: string;
  radioId: string;
  axes: {
    name: string;
    channel: number;
    simAxis: string;
    notes?: string;
  }[];
  buttons: {
    name: string;
    channel: number;
    simButton: string;
  }[];
  setupSteps: string[];
}

export interface SimEdgeTXModel {
  radioId: string;
  filename: string;
  content: string;
}

export interface SimTip {
  id: string;
  category: "setup" | "training" | "progression" | "settings";
  title: string;
  content: string;
  priority: "critical" | "important" | "nice";
}

// ============================================================
// SIMULATORS DATABASE
// ============================================================

export const SIMULATORS: SimulatorInfo[] = [
  {
    id: "liftoff",
    name: "Liftoff: FPV Drone Racing",
    platform: ["mac", "windows", "linux"],
    free: false,
    price: "~20€ sur Steam",
    downloadUrl: "https://store.steampowered.com/app/410340/Liftoff_FPV_Drone_Racing/",
    description: "Le simulateur FPV le plus populaire. Physique réaliste, beaucoup de maps, multijoueur actif. Très bon pour débuter et progresser.",
    difficulty: "beginner",
    features: [
      "Physique drone très réaliste",
      "Mode freestyle + race",
      "Multijoueur en ligne",
      "Éditeur de maps",
      "Beaucoup de drones configurables",
      "Compatible macOS natif (Apple Silicon)",
    ],
    macNotes: "Disponible sur Steam pour macOS. Tourne bien sur M1/M2/M3. Lance Steam → Bibliothèque → Liftoff.",
  },
  {
    id: "velocidrone",
    name: "VelociDrone",
    platform: ["mac", "windows", "linux"],
    free: false,
    price: "~20€",
    downloadUrl: "https://www.velocidrone.com/",
    description: "Simulateur de référence pour la compétition. Physique ultra-précise, utilisé par les pilotes pro pour s'entraîner.",
    difficulty: "intermediate",
    features: [
      "Physique la plus précise du marché",
      "Scènes de compétition officielles",
      "Multijoueur racing",
      "Mode entraînement avec chronos",
      "Utilisé par les pilotes MultiGP/DCL",
    ],
    macNotes: "Version macOS disponible sur le site officiel. Nécessite un compte. Télécharge le .dmg depuis velocidrone.com.",
  },
  {
    id: "uncrashed",
    name: "Uncrashed: FPV Drone Simulator",
    platform: ["mac", "windows"],
    free: false,
    price: "~15€ sur Steam",
    downloadUrl: "https://store.steampowered.com/app/1682970/Uncrashed__FPV_Drone_Simulator/",
    description: "Simulateur avec des graphismes magnifiques. Très immersif, bon pour le freestyle cinématique.",
    difficulty: "beginner",
    features: [
      "Graphismes Unreal Engine 5",
      "Maps photoréalistes",
      "Mode freestyle cinématique",
      "Bonne physique de vol",
      "Idéal pour apprendre les mouvements de caméra",
    ],
    macNotes: "Disponible sur Steam. Peut nécessiter Rosetta 2 sur Apple Silicon. Vérifie la config requise.",
  },
  {
    id: "fpv-skydive",
    name: "FPV SkyDive",
    platform: ["mac", "windows", "linux"],
    free: true,
    downloadUrl: "https://store.steampowered.com/app/1278060/FPV_SkyDive/",
    description: "Simulateur gratuit et léger. Parfait pour tester si ta radio fonctionne en mode joystick avant d'acheter un simu payant.",
    difficulty: "beginner",
    features: [
      "100% gratuit",
      "Léger, tourne sur tout",
      "Bon pour tester la config radio",
      "Physique basique mais suffisante pour débuter",
    ],
    macNotes: "Gratuit sur Steam. Léger, tourne même sur les vieux Macs.",
  },
  {
    id: "tryp",
    name: "TRYP FPV",
    platform: ["windows"],
    free: false,
    price: "~20€ sur Steam",
    downloadUrl: "https://store.steampowered.com/app/1881200/TRYP_FPV/",
    description: "Nouveau simulateur avec physique avancée et beaux graphismes. Windows uniquement mais fonctionne via Parallels/CrossOver sur Mac.",
    difficulty: "intermediate",
    features: [
      "Physique très réaliste",
      "Graphismes modernes",
      "Maps freestyle variées",
      "Communauté active",
    ],
    macNotes: "Windows uniquement. Pour l'utiliser sur Mac: Parallels Desktop, CrossOver, ou Boot Camp (Intel Mac seulement).",
  },
  {
    id: "orqa",
    name: "ORQA FPV.SkyDive",
    platform: ["mac", "windows"],
    free: true,
    downloadUrl: "https://skydive.orqafpv.com/",
    description: "Simulateur gratuit par ORQA (fabricant de lunettes FPV). Simple et efficace pour s'entraîner.",
    difficulty: "beginner",
    features: [
      "Gratuit",
      "Simple à configurer",
      "Physique correcte",
      "Pas besoin de Steam",
    ],
    macNotes: "Téléchargeable directement depuis le site ORQA. Pas besoin de Steam.",
  },
];

// ============================================================
// EDGETX MODEL FOR SIMULATOR (USB JOYSTICK MODE)
// ============================================================

export function generateSimModel(radioId: "tx16s" | "pocket"): SimEdgeTXModel {
  const isTX16S = radioId === "tx16s";
  const radioName = isTX16S ? "TX16S" : "Pocket";
  const armSwitch = isTX16S ? "SF" : "SA";
  const modeSwitch = isTX16S ? "SC" : "SB";

  // Build sim model in real EdgeTX YAML format — NO RF module
  let simMixers = `mixData:
 -
   weight: 100
   destCh: 0
   srcRaw: I3
   carryTrim: 0
   mixWarn: 0
   mltpx: ADD
   offset: 0
   swtch: "NONE"
   flightModes: 000000000
   delayUp: 0
   delayDown: 0
   speedUp: 0
   speedDown: 0
   name: "Roll"
 -
   weight: 100
   destCh: 1
   srcRaw: I1
   carryTrim: 0
   mixWarn: 0
   mltpx: ADD
   offset: 0
   swtch: "NONE"
   flightModes: 000000000
   delayUp: 0
   delayDown: 0
   speedUp: 0
   speedDown: 0
   name: "Pitch"
 -
   weight: 100
   destCh: 2
   srcRaw: I2
   carryTrim: 0
   mixWarn: 0
   mltpx: ADD
   offset: 0
   swtch: "NONE"
   flightModes: 000000000
   delayUp: 0
   delayDown: 0
   speedUp: 0
   speedDown: 0
   name: "Thrtl"
 -
   weight: 100
   destCh: 3
   srcRaw: I0
   carryTrim: 0
   mixWarn: 0
   mltpx: ADD
   offset: 0
   swtch: "NONE"
   flightModes: 000000000
   delayUp: 0
   delayDown: 0
   speedUp: 0
   speedDown: 0
   name: "Yaw"
 -
   weight: 100
   destCh: 4
   srcRaw: ${armSwitch}
   carryTrim: 0
   mixWarn: 0
   mltpx: ADD
   offset: 0
   swtch: "NONE"
   flightModes: 000000000
   delayUp: 0
   delayDown: 0
   speedUp: 0
   speedDown: 0
   name: "ARM"
 -
   weight: 100
   destCh: 5
   srcRaw: ${modeSwitch}
   carryTrim: 0
   mixWarn: 0
   mltpx: ADD
   offset: 0
   swtch: "NONE"
   flightModes: 000000000
   delayUp: 0
   delayDown: 0
   speedUp: 0
   speedDown: 0
   name: "MODE"`;

  if (isTX16S) {
    simMixers += `
 -
   weight: 100
   destCh: 6
   srcRaw: S1
   carryTrim: 0
   mixWarn: 0
   mltpx: ADD
   offset: 0
   swtch: "NONE"
   flightModes: 000000000
   delayUp: 0
   delayDown: 0
   speedUp: 0
   speedDown: 0
   name: "POT1"
 -
   weight: 100
   destCh: 7
   srcRaw: S2
   carryTrim: 0
   mixWarn: 0
   mltpx: ADD
   offset: 0
   swtch: "NONE"
   flightModes: 000000000
   delayUp: 0
   delayDown: 0
   speedUp: 0
   speedDown: 0
   name: "POT2"`;
  }

  const content = `# FPV Dashboard — Simulateur — RadioMaster ${radioName}
# USB Joystick mode — Module RF désactivé
semver: 2.7.1
header:
   name: "SIMU"
   bitmap: ""
timers:
telemetryProtocol: 0
thrTrim: 0
noGlobalFunctions: 0
displayTrims: 0
ignoreSensorIds: 0
trimInc: 0
disableThrottleWarning: 1
displayChecklist: 0
extendedLimits: 0
extendedTrims: 0
throttleReversed: 0
enableCustomThrottleWarning: 0
customThrottleWarningPosition: 0
beepANACenter: 0
${simMixers}
moduleData:
inputNames:
   0:
      val: "Rud"
   1:
      val: "Ele"
   2:
      val: "Thr"
   3:
      val: "Ail"
trims:
`;

  return {
    radioId,
    filename: `simu_${radioId}.yml`,
    content,
  };
}

// ============================================================
// AXIS MAPPING PER SIMULATOR
// ============================================================

export function getAxisMapping(simulatorId: string, radioId: "tx16s" | "pocket"): SimAxisMapping {
  const isTX16S = radioId === "tx16s";

  // Base axes — same for all sims
  const baseAxes = [
    { name: "Roll (Aileron)", channel: 1, simAxis: "", notes: "Stick droit ← →" },
    { name: "Pitch (Elevator)", channel: 2, simAxis: "", notes: "Stick droit ↑ ↓" },
    { name: "Throttle", channel: 3, simAxis: "", notes: "Stick gauche ↑ ↓" },
    { name: "Yaw (Rudder)", channel: 4, simAxis: "", notes: "Stick gauche ← →" },
  ];

  const baseButtons = [
    { name: "ARM", channel: 5, simButton: "" },
    { name: "Mode", channel: 6, simButton: "" },
  ];

  const mapping: SimAxisMapping = {
    simulatorId,
    radioId,
    axes: baseAxes,
    buttons: baseButtons,
    setupSteps: [],
  };

  switch (simulatorId) {
    case "liftoff":
      mapping.axes = [
        { name: "Roll", channel: 1, simAxis: "Axis 0 (X)", notes: "Stick droit ← →" },
        { name: "Pitch", channel: 2, simAxis: "Axis 1 (Y)", notes: "Stick droit ↑ ↓" },
        { name: "Throttle", channel: 3, simAxis: "Axis 2 (Z)", notes: "Stick gauche ↑ ↓" },
        { name: "Yaw", channel: 4, simAxis: "Axis 3 (Rx)", notes: "Stick gauche ← →" },
      ];
      mapping.buttons = [
        { name: "ARM", channel: 5, simButton: "Button 5" },
        { name: "Mode", channel: 6, simButton: "Button 6" },
      ];
      mapping.setupSteps = [
        "Lance Liftoff sur Steam",
        "Va dans Settings → Controller",
        `Sélectionne "${isTX16S ? "RadioMaster TX16S" : "RadioMaster Pocket"}" dans la liste des controllers`,
        "Clique sur 'Configure' pour mapper les axes",
        "Bouge chaque stick un par un — Liftoff détecte l'axe automatiquement",
        "Roll = stick droit horizontal, Pitch = stick droit vertical",
        "Throttle = stick gauche vertical, Yaw = stick gauche horizontal",
        "IMPORTANT: Décoche 'Auto-detect center' pour le Throttle (les gaz n'ont pas de centre)",
        "Dans Channel Map, vérifie que Throttle va de 0% à 100% (pas -100% à 100%)",
        "Clique 'Save' et fais un vol test dans le menu Freefly",
      ];
      break;

    case "velocidrone":
      mapping.axes = [
        { name: "Roll", channel: 1, simAxis: "Axis 1", notes: "Stick droit ← →" },
        { name: "Pitch", channel: 2, simAxis: "Axis 2", notes: "Stick droit ↑ ↓" },
        { name: "Throttle", channel: 3, simAxis: "Axis 3", notes: "Stick gauche ↑ ↓" },
        { name: "Yaw", channel: 4, simAxis: "Axis 4", notes: "Stick gauche ← →" },
      ];
      mapping.setupSteps = [
        "Lance VelociDrone",
        "Va dans Settings (icône engrenage)",
        "Onglet 'Controller'",
        `Ta radio doit apparaître comme "${isTX16S ? "EdgeTX TX16S" : "EdgeTX Pocket"}" ou "OpenTX Joystick"`,
        "Clique sur chaque axe (Roll, Pitch, Throttle, Yaw) puis bouge le stick correspondant",
        "VelociDrone auto-détecte le mapping",
        "Vérifie dans la preview que les barres bougent dans la bonne direction",
        "Si un axe est inversé: coche 'Invert' à côté de cet axe",
        "Rates dans VelociDrone: laisse les rates du simu à 1.0, utilise les rates de ta radio",
        "Sauvegarde et teste dans une scène freestyle",
      ];
      break;

    case "uncrashed":
      mapping.axes = [
        { name: "Roll", channel: 1, simAxis: "Joystick Axis X", notes: "Stick droit ← →" },
        { name: "Pitch", channel: 2, simAxis: "Joystick Axis Y", notes: "Stick droit ↑ ↓" },
        { name: "Throttle", channel: 3, simAxis: "Joystick Axis Z", notes: "Stick gauche ↑ ↓" },
        { name: "Yaw", channel: 4, simAxis: "Joystick Axis Rx", notes: "Stick gauche ← →" },
      ];
      mapping.setupSteps = [
        "Lance Uncrashed sur Steam",
        "Va dans Options → Input",
        "Sélectionne 'Joystick/Gamepad' comme input device",
        "Clique 'Calibrate Controller'",
        "Bouge tous les sticks dans toutes les directions quand demandé",
        "Puis assigne chaque axe: Roll, Pitch, Throttle, Yaw",
        "Vérifie que le throttle est bien en mode 'Full range' (0-100%)",
        "Dans les rates Uncrashed: commence avec les presets 'Beginner'",
        "Teste dans le mode Freefly avant de passer au mode Race",
      ];
      break;

    default:
      mapping.setupSteps = [
        "Branche ta radio en USB et sélectionne 'USB Joystick (HID)'",
        "Lance le simulateur",
        "Va dans les paramètres de contrôleur/input",
        "Ta radio doit apparaître comme un gamepad/joystick",
        "Assigne chaque axe en bougeant les sticks un par un:",
        "  Roll = stick droit horizontal",
        "  Pitch = stick droit vertical",
        "  Throttle = stick gauche vertical",
        "  Yaw = stick gauche horizontal",
        "Vérifie que les axes ne sont pas inversés",
        "Le throttle doit aller de 0% (bas) à 100% (haut)",
      ];
      break;
  }

  return mapping;
}

// ============================================================
// MACOS JOYSTICK VERIFICATION
// ============================================================

export const MAC_JOYSTICK_SETUP = {
  title: "Vérifier que ta radio est détectée comme joystick sur macOS",
  steps: [
    {
      step: 1,
      title: "Sélectionne le modèle SIMU sur ta radio",
      detail: "Appuie longuement sur le nom du modèle en haut de l'écran de ta radio, puis sélectionne le modèle 'SIMU'.",
    },
    {
      step: 2,
      title: "Branche le câble USB-C",
      detail: "Connecte ta radio à ton Mac avec un câble USB-C (ou USB-C vers USB-A avec adaptateur).",
    },
    {
      step: 3,
      title: "Choisis 'USB Joystick (HID)'",
      detail: "Quand la radio affiche le menu USB, sélectionne 'USB Joystick (HID)'. PAS 'USB Storage' ni 'USB Serial'.",
    },
    {
      step: 4,
      title: "Vérifie dans macOS",
      detail: "Ouvre le menu Pomme → À propos de ce Mac → Rapport système → USB. Ta radio doit apparaître comme 'EdgeTX Joystick' ou similaire.",
    },
    {
      step: 5,
      title: "Teste les axes",
      detail: "Ouvre un testeur de gamepad en ligne (gamepad-tester.com) dans ton navigateur. Bouge les sticks — tu dois voir les axes bouger en temps réel.",
    },
  ],
  troubleshooting: [
    {
      problem: "La radio n'apparaît pas comme joystick",
      solutions: [
        "Vérifie que tu as bien choisi 'USB Joystick' et pas 'USB Storage'",
        "Essaie un autre câble USB — certains câbles ne transmettent pas les données",
        "Sur la radio: SYS → HARDWARE → USB Mode → mets 'Ask' ou 'Joystick'",
        "Débranche et rebranche le câble",
        "Redémarre la radio",
      ],
    },
    {
      problem: "Les axes sont inversés dans le simulateur",
      solutions: [
        "Dans le simu: utilise l'option 'Invert Axis' pour l'axe concerné",
        "OU dans EdgeTX: modifie le mixer du canal concerné avec Weight: -100 (inverse)",
        "Le Pitch est souvent inversé — c'est normal, inverse-le dans le simu",
      ],
    },
    {
      problem: "Le throttle va de -100% à 100% au lieu de 0% à 100%",
      solutions: [
        "Dans le simu: active l'option 'Full Range' ou 'No Center' pour le throttle",
        "OU dans EdgeTX: ajoute un Offset de +100 au mixer Throttle et Weight: 50",
        "La plupart des simus ont une option 'Throttle Type: Full Range'",
      ],
    },
    {
      problem: "Input lag / latence",
      solutions: [
        "Utilise un câble USB direct (pas un hub USB)",
        "Ferme les autres applications gourmandes",
        "Dans le simu: baisse les graphismes pour avoir plus de FPS",
        "La latence USB est ~1ms, si tu sens du lag c'est le simu pas la radio",
      ],
    },
    {
      problem: "Le simulateur ne détecte pas la radio",
      solutions: [
        "Certains simus ne supportent que les joysticks HID standard — ta radio en est un",
        "Essaie de lancer le simu APRÈS avoir branché la radio",
        "Sur Steam: clic droit sur le jeu → Propriétés → Contrôleur → Activer Steam Input",
        "Vérifie les permissions macOS: Préférences → Sécurité → Input Monitoring",
      ],
    },
  ],
};

// ============================================================
// SIMULATOR TRAINING TIPS
// ============================================================

export const SIMULATOR_TIPS: SimTip[] = [
  // SETUP
  {
    id: "sim-model-separate",
    category: "setup",
    title: "Crée un modèle EdgeTX séparé pour le simu",
    content: "Ne vole PAS sur ton modèle drone dans le simu. Utilise le modèle 'SIMU' dédié qui désactive le module ELRS. Ça évite d'envoyer du signal radio pendant que tu joues, et ça économise la batterie de la radio.",
    priority: "critical",
  },
  {
    id: "sim-usb-joystick",
    category: "setup",
    title: "Choisis 'USB Joystick' PAS 'USB Storage'",
    content: "Quand tu branches ta radio, elle propose plusieurs modes USB. Pour le simu c'est 'USB Joystick (HID)'. 'Storage' c'est pour accéder à la carte SD, 'Serial' c'est pour Betaflight.",
    priority: "critical",
  },
  {
    id: "sim-same-mapping",
    category: "setup",
    title: "Garde le même mapping que ton drone réel",
    content: "Le modèle SIMU utilise exactement le même mapping AETR que tes modèles drone. Comme ça, la mémoire musculaire que tu construis sur le simu se transfère directement en vol réel.",
    priority: "important",
  },
  {
    id: "sim-rates-match",
    category: "setup",
    title: "Configure les mêmes rates dans le simu que sur ton drone",
    content: "Pour que le simu soit réaliste, copie tes rates Betaflight dans le simu. RC Rate: 1.0, Super Rate: 0.7, Expo: 0.3 (les mêmes que dans ta config débutant).",
    priority: "important",
  },

  // TRAINING
  {
    id: "sim-hover-first",
    category: "training",
    title: "Étape 1: Hover stable pendant 30 secondes",
    content: "Ton premier objectif: faire du surplace (hover) à 2m de hauteur pendant 30 secondes sans bouger. C'est plus dur que ça en a l'air ! Commence en mode Angle/Stabilisé si le simu le propose.",
    priority: "important",
  },
  {
    id: "sim-figure-8",
    category: "training",
    title: "Étape 2: Figure en 8 propre",
    content: "Une fois le hover maîtrisé, fais des 8 autour de deux points. D'abord lents et hauts, puis de plus en plus bas et rapides. Cet exercice développe la coordination roll+yaw.",
    priority: "important",
  },
  {
    id: "sim-power-loops",
    category: "training",
    title: "Étape 3: Power loops et split-S",
    content: "Les tricks de base du freestyle. Power loop = monter en tirant le pitch vers l'arrière pour faire un looping. Split-S = rouler à 180° puis tirer le pitch. Entraîne-toi en altitude d'abord !",
    priority: "nice",
  },
  {
    id: "sim-crash-is-free",
    category: "training",
    title: "Crasher sur le simu est GRATUIT",
    content: "C'est le gros avantage du simu: chaque crash ne coûte rien. Pousse tes limites, essaie des tricks fous, crashe 100 fois. C'est comme ça qu'on progresse. En vrai, chaque crash = 50€ de pièces.",
    priority: "important",
  },

  // PROGRESSION
  {
    id: "sim-10h-before-real",
    category: "progression",
    title: "10 heures de simu avant le premier vrai vol",
    content: "Objectif recommandé: 10h de simu avant de sortir ton vrai drone. Ça semble beaucoup mais ça te fera économiser des centaines d'euros en réparations. Même 5h font une énorme différence.",
    priority: "critical",
  },
  {
    id: "sim-acro-on-sim",
    category: "progression",
    title: "Apprends le mode Acro sur le simu, pas en vrai",
    content: "Le mode Acro (pas de stabilisation) est indispensable pour le freestyle. C'est dur au début — le drone ne se stabilise pas tout seul. Apprends-le sur le simu où les crashs sont gratuits.",
    priority: "important",
  },
  {
    id: "sim-daily-routine",
    category: "progression",
    title: "20 minutes par jour > 3 heures le weekend",
    content: "La mémoire musculaire se développe mieux avec des sessions courtes et régulières. 20 min de simu chaque soir progressera plus vite que 3h le samedi.",
    priority: "nice",
  },
  {
    id: "sim-record-progress",
    category: "progression",
    title: "Enregistre tes sessions",
    content: "Utilise OBS ou l'enregistrement intégré du simu pour revoir tes vols. Tu verras tes erreurs et ta progression au fil des semaines.",
    priority: "nice",
  },

  // SETTINGS
  {
    id: "sim-low-graphics",
    category: "settings",
    title: "Baisse les graphismes pour + de FPS",
    content: "En simu FPV, les FPS comptent plus que la beauté. 60 FPS minimum, idéalement 120+. Baisse les ombres, reflets, herbe, anti-aliasing. Le gameplay sera beaucoup plus fluide.",
    priority: "important",
  },
  {
    id: "sim-camera-angle",
    category: "settings",
    title: "Camera tilt: 25-30° pour débuter",
    content: "L'angle de caméra dans le simu doit correspondre à ton drone réel. Pour un débutant, 25-30° c'est bien. Les pros montent à 35-45° pour aller plus vite.",
    priority: "nice",
  },
  {
    id: "sim-no-screen-goggles",
    category: "settings",
    title: "Écran Mac suffit, pas besoin de lunettes",
    content: "Pour le simu, ton écran Mac est parfait. Pas besoin de brancher tes DJI Goggles. L'important c'est la mémoire musculaire des sticks, pas l'immersion vidéo.",
    priority: "nice",
  },
];
