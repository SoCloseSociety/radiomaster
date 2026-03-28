/**
 * Config templates for RadioMaster TX16S & Pocket × Darwin Hulk 2 & iFlight Nazgul
 *
 * Generates ready-to-inject EdgeTX model files (.yml) and Betaflight CLI dumps
 * tailored for each radio/drone combination with ELRS protocol.
 */

// ============================================================
// TYPES
// ============================================================

export interface RadioSpec {
  id: string;
  name: string;
  fullName: string;
  hasInternalELRS: boolean;
  moduleType: "CRSF" | "ACCESS";
  gimbals: "hall" | "potentiometer";
  switches: string[];
  /** which aux channel is recommended for ARM */
  armSwitch: string;
  /** recommended aux for flight modes */
  modeSwitch: string;
  /** recommended aux for beeper */
  beeperSwitch: string;
  screenSize: "480x272" | "320x480" | "128x64";
  trimCount: number;
  notes: string[];
}

export interface DroneSpec {
  id: string;
  name: string;
  fullName: string;
  fc: string;
  frameSize: string;
  motorKV: number;
  propSize: string;
  weight: string;
  batterySpec: string;
  elrsRX: string;
  vtx: string;
  camera: string;
  uartRX: number;
  motorProtocol: string;
  notes: string[];
}

export interface EdgeTXModelTemplate {
  radioId: string;
  droneId: string;
  filename: string;
  content: string;
}

export interface BetaflightTemplate {
  droneId: string;
  radioId: string;
  name: string;
  cliDump: string;
  description: string;
}

export interface ELRSConfig {
  bindingPhrase: string;
  rate: number; // Hz
  tlmRatio: string;
  power: number; // mW
  switchMode: "Wide" | "Hybrid";
}

// ============================================================
// RADIO SPECS
// ============================================================

export const RADIOS: Record<string, RadioSpec> = {
  tx16s: {
    id: "tx16s",
    name: "TX16S",
    fullName: "RadioMaster TX16S MK2 ELRS",
    hasInternalELRS: true,
    moduleType: "CRSF",
    gimbals: "hall",
    switches: ["SA", "SB", "SC", "SD", "SE", "SF", "SG", "SH"],
    armSwitch: "SF",       // 2-pos switch, bon pour ARM (toggle simple)
    modeSwitch: "SC",      // 3-pos, parfait pour Angle/Horizon/Acro
    beeperSwitch: "SE",    // 2-pos pour le buzzer
    screenSize: "480x272",
    trimCount: 6,
    notes: [
      "Le bouton face gauche en bas est cassé — on n'utilisera PAS ce bouton dans les configs",
      "TX16S a 2 baies de module : interne ELRS + externe (libre)",
      "Module ELRS interne = pas besoin de module externe pour ELRS",
      "Gimbals hall effect = plus précis et plus durable",
    ],
  },
  pocket: {
    id: "pocket",
    name: "Pocket",
    fullName: "RadioMaster Pocket ELRS",
    hasInternalELRS: true,
    moduleType: "CRSF",
    gimbals: "hall",
    switches: ["SA", "SB", "SC", "SD"],
    armSwitch: "SA",       // la Pocket a moins de switches
    modeSwitch: "SB",      // 3-pos
    beeperSwitch: "SD",
    screenSize: "128x64",
    trimCount: 4,
    notes: [
      "Pocket = plus compacte, idéale pour transporter au terrain",
      "Moins de switches que la TX16S — les configs sont simplifiées",
      "Module ELRS intégré — pas besoin de module externe",
      "Format gamepad, très confortable pour les débutants",
    ],
  },
};

// ============================================================
// DRONE SPECS
// ============================================================

export const DRONES: Record<string, DroneSpec> = {
  hulk2: {
    id: "hulk2",
    name: "Hulk 2",
    fullName: "Darwin FPV Hulk 2 6S",
    fc: "F722 (ou F405)",
    frameSize: "5 pouces",
    motorKV: 1750,
    propSize: "5.1x3.6x3",
    weight: "~350g sans batterie",
    batterySpec: "6S 1100-1300mAh",
    elrsRX: "ELRS 2.4GHz intégré ou SPI",
    vtx: "DJI O3 ou Analogique (selon version)",
    camera: "DJI O3 Camera ou Caddx Ratel 2",
    uartRX: 1,      // UART utilisé pour le RX ELRS (varie selon FC)
    motorProtocol: "DSHOT600",
    notes: [
      "Hulk 2 = drone freestyle robuste, encaisse bien les crashs",
      "Parfait pour apprendre le freestyle sans avoir peur de casser",
      "Frame très solide, bras en carbon 5mm",
      "Vérifie la version de ton FC (F722 ou F405) dans Betaflight",
    ],
  },
  nazgul: {
    id: "nazgul",
    name: "Nazgul",
    fullName: "iFlight Nazgul ECO V3 / Nazgul5 V3",
    fc: "SucceX-E F7 (ou F4)",
    frameSize: "5 pouces",
    motorKV: 1950,
    propSize: "5.1x3.6x3",
    weight: "~320g sans batterie",
    batterySpec: "6S 1100-1500mAh",
    elrsRX: "ELRS 2.4GHz (Happymodel EP ou intégré)",
    vtx: "DJI O3 ou Caddx Vista",
    camera: "DJI O3 Camera ou Caddx Ratel 2",
    uartRX: 2,      // UART 2 typique sur les SucceX FC
    motorProtocol: "DSHOT600",
    notes: [
      "Nazgul = drone performant et bien tunné en sortie de boite",
      "Les PIDs d'usine sont déjà très corrects",
      "FC iFlight SucceX avec gyro ICM42688P",
      "Freestyle + cinématique, très polyvalent",
    ],
  },
};

// ============================================================
// ELRS RECOMMENDED CONFIG
// ============================================================

export const ELRS_BEGINNER_CONFIG: ELRSConfig = {
  bindingPhrase: "",
  rate: 250,          // 250Hz = bon compromis latence/portée pour débutant
  tlmRatio: "1:8",    // 1:8 = bon compromis latence/télémétrie sur 250Hz
  power: 100,         // 100mW largement suffisant pour du freestyle
  switchMode: "Wide", // Wide = plus de switches dispo
};

export const ELRS_ADVANCED_CONFIG: ELRSConfig = {
  bindingPhrase: "",
  rate: 500,          // 500Hz pour la compétition/race
  tlmRatio: "1:8",
  power: 250,
  switchMode: "Wide",
};

// ============================================================
// EDGETX MODEL TEMPLATE GENERATOR
// ============================================================

export function generateEdgeTXModel(
  radio: RadioSpec,
  drone: DroneSpec,
  elrs: ELRSConfig
): EdgeTXModelTemplate {
  const modelName = `${drone.name}`;
  const filename = `${drone.id}_${radio.id}.yml`;

  // Generate mixers in real EdgeTX format
  // srcRaw: I0=Rud, I1=Ele, I2=Thr, I3=Ail for standard inputs
  // For switches: SA, SB, SC, SD, SE, SF, SG, SH
  const armSwitch = radio.armSwitch;
  const modeSwitch = radio.modeSwitch;
  const beeperSwitch = radio.beeperSwitch;

  // Build mixer entries — real EdgeTX format uses destCh (0-indexed) and srcRaw
  let mixerEntries = `mixData:
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
   name: "MODE"
 -
   weight: 100
   destCh: 6
   srcRaw: ${beeperSwitch}
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
   name: "BEEP"`;

  if (radio.id === "tx16s") {
    mixerEntries += `
 -
   weight: 100
   destCh: 7
   srcRaw: SG
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
   name: "TURTL"`;
  }

  const content = `# FPV Dashboard — ${drone.fullName} + ${radio.fullName}
# ELRS config: Rate ${elrs.rate}Hz | Power ${elrs.power}mW | BP: ${elrs.bindingPhrase || "(à définir)"}
semver: 2.7.1
header:
   name: "${modelName}"
   bitmap: ""
timers:
   0:
      start: 0
      swtch: "THs"
      value: 0
      mode: ON
      countdownBeep: 0
      minuteBeep: 1
      persistent: 1
      countdownStart: 0
      name: "Vol"
   1:
      start: 210
      swtch: "THs"
      value: 0
      mode: ON
      countdownBeep: 2
      minuteBeep: 0
      persistent: 0
      countdownStart: 0
      name: "Batt"
telemetryProtocol: 0
thrTrim: 0
noGlobalFunctions: 0
displayTrims: 0
ignoreSensorIds: 0
trimInc: 0
disableThrottleWarning: 0
displayChecklist: 0
extendedLimits: 0
extendedTrims: 0
throttleReversed: 0
enableCustomThrottleWarning: 0
customThrottleWarningPosition: 0
beepANACenter: 0
${mixerEntries}
moduleData:
   0:
      type: TYPE_CROSSFIRE
      subType: 0
      channelsStart: 0
      channelsCount: 16
      failsafeMode: NOT_SET
      mod:
         crsf:
            telemetryBaudrate: 0
inputNames:
   0:
      val: "Rud"
   1:
      val: "Ele"
   2:
      val: "Thr"
   3:
      val: "Ail"
`;

  return {
    radioId: radio.id,
    droneId: drone.id,
    filename,
    content,
  };
}

// ============================================================
// BETAFLIGHT CLI TEMPLATE GENERATOR
// ============================================================

export function generateBetaflightCLI(
  drone: DroneSpec,
  radio: RadioSpec,
  elrs: ELRSConfig
): BetaflightTemplate {
  const name = `${drone.name} + ${radio.name}`;

  // Betaflight serial port index = UART number - 1 (UART1 = serial 0, UART2 = serial 1)
  // Function mask 64 = FUNCTION_RX_SERIAL (bit 6)
  const bfSerialIndex = drone.uartRX - 1;

  const cliDump = `# ================================================
# Betaflight CLI Config: ${drone.fullName}
# Radio: ${radio.fullName} (ELRS)
# Généré par FPV Dashboard
#
# COMMENT UTILISER:
# 1. Connecte ton drone en USB
# 2. Ouvre Betaflight Configurator
# 3. Va dans l'onglet CLI
# 4. Copie/colle ce texte
# 5. Tape "save" et appuie sur Entrée
# ================================================

# ------------------------------------------------
# PORTS SÉRIE
# Configure le bon UART pour le récepteur ELRS
# ------------------------------------------------
# UART${drone.uartRX} → serial index ${bfSerialIndex}, function 64 = SERIAL_RX
serial ${bfSerialIndex} 64 115200 57600 0 115200

# ------------------------------------------------
# RÉCEPTEUR
# ------------------------------------------------
# Protocole CRSF (Crossfire) — utilisé par ELRS
set serialrx_provider = CRSF
set serialrx_inverted = OFF
set serialrx_halfduplex = OFF

# Mapping des voies AETR1234 (standard ELRS)
# A=Aileron E=Elevator T=Throttle R=Rudder
map AETR1234

# ------------------------------------------------
# FAILSAFE — TRÈS IMPORTANT POUR LA SÉCURITÉ
# ------------------------------------------------
# Si tu perds le signal radio, le drone coupe les moteurs
# C'est le mode le plus sûr pour un débutant
set failsafe_procedure = DROP
set failsafe_throttle = 1000
set failsafe_delay = 4
set failsafe_recovery_delay = 20

# ------------------------------------------------
# MODES DE VOL (à configurer aussi dans l'onglet Modes)
# ------------------------------------------------
# AUX1 (CH5) = ARM         → ${radio.armSwitch} sur ta ${radio.name}
# AUX2 (CH6) = MODE        → ${radio.modeSwitch} sur ta ${radio.name}
# AUX3 (CH7) = BEEPER      → ${radio.beeperSwitch} sur ta ${radio.name}
${radio.id === "tx16s" ? `# AUX4 (CH8) = TURTLE MODE → SG sur ta ${radio.name}` : "# (pas assez de switches pour turtle mode sur la Pocket)"}

# ARM — AUX1 (CH5) range 1800-2100
aux 0 0 0 1800 2100 0 0

# ANGLE mode (stabilisé) — AUX2 position basse (débutant)
# COMMENCE ICI ! Le drone se stabilise tout seul
aux 1 1 1 900 1300 0 0

# HORIZON mode — AUX2 position milieu
# Comme Angle mais permet les flips, transition vers Acro
aux 2 2 1 1300 1700 0 0

# ACRO mode (freestyle) — AUX2 position haute
# Mode libre, aucune stabilisation — pour quand tu seras à l'aise
# (pas besoin de configurer: c'est le mode par défaut quand aucun autre n'est actif)

# BEEPER — AUX3 (CH7) range 1800-2100
aux 3 13 2 1800 2100 0 0
${radio.id === "tx16s" ? `
# TURTLE MODE (flip over after crash) — AUX4 range 1800-2100
aux 4 35 3 1800 2100 0 0
` : ""}
# ------------------------------------------------
# MOTEURS
# ------------------------------------------------
set motor_pwm_protocol = ${drone.motorProtocol}
set dshot_bidir = ON
set motor_poles = 14

# Direction des moteurs: "props in" est le standard
# Si tes moteurs tournent dans le mauvais sens,
# inverse-les dans l'onglet Motors de Betaflight (PAS physiquement)

# ------------------------------------------------
# RATES (vitesse de rotation) — CONFIG DÉBUTANT
# ------------------------------------------------
# Ces rates sont doux et pardonnent les erreurs
# Tu pourras les augmenter quand tu seras plus à l'aise
set rates_type = BETAFLIGHT

# Roll
set roll_rc_rate = 100
set roll_expo = 30
set roll_srate = 70

# Pitch
set pitch_rc_rate = 100
set pitch_expo = 30
set pitch_srate = 70

# Yaw
set yaw_rc_rate = 100
set yaw_expo = 30
set yaw_srate = 70

# ------------------------------------------------
# OSD (affichage dans les lunettes)
# ------------------------------------------------
# Affiche les infos essentielles
set osd_vbat_pos = 2433
set osd_rssi_pos = 2081
set osd_tim_1_pos = 2455
set osd_flymode_pos = 2457
set osd_craft_name_pos = 2506
set osd_warnings_pos = 2378

# Nom du drone affiché dans l'OSD
name ${drone.name}-${radio.id}

# ------------------------------------------------
# PIDs — GARDER LES VALEURS PAR DÉFAUT
# ------------------------------------------------
# CONSEIL: Ne touche PAS aux PIDs quand tu débutes !
# Les valeurs d'usine de Betaflight sont très correctes
# pour le ${drone.name}. Tu optimiseras plus tard.

# ------------------------------------------------
# FONCTIONNALITÉS
# ------------------------------------------------
feature -SOFTSERIAL
feature TELEMETRY
feature LED_STRIP
feature OSD
feature ANTI_GRAVITY
feature DYNAMIC_FILTER

# Anti-gravity: aide à garder le drone stable
# quand tu fais des mouvements brusques de gaz
set anti_gravity_gain = 80

# ------------------------------------------------
# BATTERIE
# ------------------------------------------------
# ${drone.batterySpec}
set vbat_min_cell_voltage = 340
set vbat_warning_cell_voltage = 350
set vbat_max_cell_voltage = 430

# SAUVEGARDE
save
`;

  const description = `Configuration Betaflight optimisée pour ${drone.fullName} avec ${radio.fullName} en ELRS.
Inclut: ports série, récepteur CRSF, failsafe, modes de vol (ARM/${radio.armSwitch}, MODE/${radio.modeSwitch}, BEEPER/${radio.beeperSwitch}), rates débutant, OSD.`;

  return {
    droneId: drone.id,
    radioId: radio.id,
    name,
    cliDump,
    description,
  };
}

// ============================================================
// GENERATE ALL COMBOS
// ============================================================

export function generateAllTemplates(elrs: ELRSConfig) {
  const edgetxModels: EdgeTXModelTemplate[] = [];
  const betaflightConfigs: BetaflightTemplate[] = [];

  for (const radio of Object.values(RADIOS)) {
    for (const drone of Object.values(DRONES)) {
      edgetxModels.push(generateEdgeTXModel(radio, drone, elrs));
      betaflightConfigs.push(generateBetaflightCLI(drone, radio, elrs));
    }
  }

  return { edgetxModels, betaflightConfigs };
}

// ============================================================
// BEGINNER RECOMMENDATIONS
// ============================================================

export interface BeginnerTip {
  id: string;
  category: "safety" | "config" | "flying" | "gear" | "elrs";
  title: string;
  content: string;
  priority: "critical" | "important" | "nice";
}

export const BEGINNER_TIPS: BeginnerTip[] = [
  // SÉCURITÉ
  {
    id: "safety-props-off",
    category: "safety",
    title: "Enlève les hélices quand tu configures",
    content: "TOUJOURS retirer les hélices quand tu branches ton drone en USB ou que tu fais des tests de config. Un armement accidentel avec les hélices = blessure garantie.",
    priority: "critical",
  },
  {
    id: "safety-arm",
    category: "safety",
    title: "Le switch ARM est ton meilleur ami",
    content: "Le switch ARM doit être accessible instantanément. En cas de problème, désarme IMMÉDIATEMENT. Muscle cette mémoire musculaire avant de voler.",
    priority: "critical",
  },
  {
    id: "safety-failsafe",
    category: "safety",
    title: "Configure le failsafe en DROP",
    content: "Si tu perds le signal, le drone doit couper les moteurs (DROP). C'est le mode le plus sûr. Un drone qui tombe est moins dangereux qu'un drone qui continue de voler sans contrôle.",
    priority: "critical",
  },
  {
    id: "safety-battery",
    category: "safety",
    title: "Ne descends JAMAIS en dessous de 3.5V par cellule",
    content: "Les LiPo en dessous de 3.5V/cellule sont endommagées de façon permanente. Le timer de 3:30 dans la config est là pour ça — atterris quand il sonne !",
    priority: "critical",
  },
  {
    id: "safety-lipo-storage",
    category: "safety",
    title: "Stocke tes LiPo à 3.8V/cellule",
    content: "Après le vol, utilise le mode 'Storage' de ton chargeur. Ne laisse JAMAIS une LiPo pleine (4.2V) ou vide (3.5V) pendant plus de 24h. Risque d'incendie.",
    priority: "critical",
  },

  // CONFIG
  {
    id: "config-angle-first",
    category: "config",
    title: "Commence en mode ANGLE",
    content: "Le mode ANGLE stabilise automatiquement le drone. Le drone revient à plat quand tu lâches les sticks. C'est LE mode pour apprendre à voler. Passe en ACRO seulement quand tu es à l'aise.",
    priority: "important",
  },
  {
    id: "config-rates-low",
    category: "config",
    title: "Rates bas au début",
    content: "Les rates dans la config sont volontairement bas (RC Rate 1.0, Super Rate 0.7). Le drone tournera moins vite mais sera beaucoup plus contrôlable. Monte progressivement.",
    priority: "important",
  },
  {
    id: "config-dont-touch-pids",
    category: "config",
    title: "Ne touche PAS aux PIDs",
    content: "Les PIDs par défaut de Betaflight sont très bons. 99% des débutants qui touchent aux PIDs rendent leur drone moins stable. Laisse-les par défaut pendant tes 50 premières batteries.",
    priority: "important",
  },
  {
    id: "config-verify-channels",
    category: "config",
    title: "Vérifie TOUJOURS les channels dans Betaflight",
    content: "Après avoir appliqué la config, va dans l'onglet Receiver de Betaflight. Bouge chaque stick et switch sur ta radio et vérifie que la bonne barre bouge. Roll droit = CH1 bouge, etc.",
    priority: "important",
  },

  // ELRS
  {
    id: "elrs-binding-phrase",
    category: "elrs",
    title: "Une seule binding phrase pour TOUT",
    content: "Utilise la MÊME binding phrase sur ta TX16S, ton Pocket, et tous tes drones. Comme ça, n'importe quelle radio se connecte à n'importe quel drone automatiquement.",
    priority: "important",
  },
  {
    id: "elrs-rate-250",
    category: "elrs",
    title: "250Hz suffit largement pour débuter",
    content: "250Hz offre un excellent compromis entre réactivité et portée. Tu ne sentiras pas la différence avec 500Hz en freestyle. Monte à 500Hz seulement pour la race.",
    priority: "nice",
  },
  {
    id: "elrs-update-firmware",
    category: "elrs",
    title: "Mets à jour ELRS sur tous tes appareils",
    content: "Assure-toi que ta radio (TX) et tes récepteurs (RX) ont la MÊME version d'ELRS. Des versions différentes peuvent causer des problèmes de connexion.",
    priority: "important",
  },

  // VOL
  {
    id: "fly-simulator",
    category: "flying",
    title: "Entraîne-toi sur simulateur d'abord",
    content: "Branche ta TX16S ou Pocket en USB sur ton PC et vole sur Liftoff, Velocidrone ou Uncrashed. 10h de simu avant le premier vrai vol = beaucoup moins de crashs.",
    priority: "important",
  },
  {
    id: "fly-open-field",
    category: "flying",
    title: "Premier vol dans un grand espace ouvert",
    content: "Pas d'arbres, pas de bâtiments, pas de gens. Un grand champ vide. Monte à 2-3m, stabilise, atterris. Répète. Quand c'est facile, commence à avancer doucement.",
    priority: "important",
  },
  {
    id: "fly-line-of-sight",
    category: "flying",
    title: "Vole en vue directe (LOS) avant le FPV",
    content: "Avant de mettre les lunettes, apprends à contrôler le drone en le regardant directement. C'est utile en cas de problème avec le flux vidéo.",
    priority: "nice",
  },

  // MATOS
  {
    id: "gear-tx16s-button",
    category: "gear",
    title: "Bouton cassé sur la TX16S — contourné",
    content: "Le bouton face gauche en bas est cassé. Les configs générées n'utilisent PAS ce bouton. Toutes les fonctions sont mappées sur les switches latéraux (SA-SH).",
    priority: "important",
  },
  {
    id: "gear-pocket-backup",
    category: "gear",
    title: "La Pocket comme radio de secours",
    content: "Avec la même binding phrase, ta Pocket peut piloter n'importe lequel de tes drones. Emporte-la toujours au terrain en backup de la TX16S.",
    priority: "nice",
  },
];
