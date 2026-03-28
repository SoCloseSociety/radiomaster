# CLAUDE.md -- FPV Dashboard (RadioMaster)

## 1. Project Identity

- **Name:** FPV Dashboard
- **Role:** Full-stack web app for FPV drone configuration, auto-detection, and management
- **Stack:**
  - Next.js 15.3.0 (App Router, Server Components)
  - React 19.1.0 + TypeScript 5.8.3
  - Tailwind CSS 4.1.3 (PostCSS plugin)
  - SerialPort 13.x (Node native module for Betaflight MSP & CLI)
  - PlatformIO (external, for ELRS firmware builds)
- **Runtime:** Node.js on macOS (system_profiler, /dev/tty.*, /Volumes/)
- **Port:** localhost:3000

### Architecture Overview

```
React Client (page.tsx + 14 components)
    |
    v
11 API Routes (/api/*)
    |
    +-- USB Detection (system_profiler + /dev/tty.*)
    +-- Betaflight FC (MSP v2 over serial + CLI text commands)
    +-- EdgeTX SD Card (YAML parsing from /Volumes/*)
    +-- File Persistence (data/inventory.json, data/backups/)
```

### External Dependencies
- macOS `system_profiler SPUSBDataType` for USB device detection
- Physical serial ports `/dev/tty.usbmodem*` for Betaflight communication
- EdgeTX SD card mounted at `/Volumes/NO NAME` (or similar)
- ExpressLRS Configurator (installed at /Applications/) for ELRS firmware flashing
- PlatformIO (installed via pipx) for ELRS firmware compilation

### Critical Files -- Never Touch Without a Plan
- `src/lib/msp-protocol.ts` -- MSP v2 binary protocol, CRC8; one wrong byte = bricked FC
- `src/lib/betaflight-cli.ts` -- Sends raw CLI commands to FC; wrong command = broken config
- `src/lib/config-templates.ts` -- Board-specific resource pins; wrong pin = dead motors/LEDs
- `src/lib/radio-analyzer.ts` -- SD card write operations; wrong path = data loss
- `data/inventory.json` -- Runtime persistence; corruption = lost inventory

---

## 2. Workflow Orchestration

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately -- never keep pushing
- Write detailed specs upfront before touching code
- Use subagents for research, exploration, parallel analysis -- one task per subagent
- After any correction from user: update tasks/lessons.md with the pattern

### Hardware-Specific Rules
- **ALWAYS ask for exact drone/radio model** before changing any resource pins or board config
- **ALWAYS download the correct unified target** from betaflight/unified-targets GitHub before modifying pins
- **ALWAYS verify board_name** in Betaflight CLI matches the target you're using
- **NEVER change resource pins** without backing up current config first
- **NEVER send `defaults` (without nosave)** -- it wipes all user config
- Each `save` after `resource` changes can reset other settings -- send ALL config in one batch before save

---

## 3. Verification Before Done

- Never mark a task complete without proving it works
- Ask: "Would a senior engineer approve this?"
- Run `npx next build` after code changes -- must compile with 0 errors
- Test API routes with `curl` after changes
- For hardware changes: read back the setting via CLI to confirm it was applied
- Diff behavior between main and your changes when relevant

### Hardware Verification Checklist
- After Betaflight CLI flash: read back `get <setting>` to confirm
- After resource pin change: `resource` to list all pins
- After LED change: user must visually confirm (can't verify via software)
- After motor test: user must confirm direction (can't verify via software)
- Serial port communication: `exit` CLI mode when done -- CLI blocks normal FC operation

---

## 4. Autonomous Bug Fixing

- When given a bug report: fix it, no hand-holding
- Point at logs, errors, failing tests -- resolve them
- Zero context switching required from the user
- For hardware issues: diagnose via CLI, read current state, compare with expected, fix delta

---

## 5. Task Management

1. **Plan First:** write plan to tasks/todo.md with checkable items
2. **Verify Plan:** check in before starting implementation
3. **Track Progress:** mark items complete as you go
4. **Explain Changes:** high-level summary at each step
5. **Document Results:** add review section to tasks/todo.md
6. **Capture Lessons:** update tasks/lessons.md after corrections

---

## 6. Project-Specific Rules

### Naming Conventions
- Files: `kebab-case.ts` (e.g., `usb-detector.ts`, `device-card.tsx`)
- Variables/functions: `camelCase` (e.g., `detectedDevices`, `scanUSBDevices()`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `KNOWN_DEVICES`, `ELRS_BEGINNER_CONFIG`)
- Types/Interfaces: `PascalCase` (e.g., `FPVDevice`, `EdgeTXRadioConfig`)
- Components: `PascalCase` (e.g., `DeviceCard`, `RadioAnalyzer`)
- API routes: `kebab-case` URLs (e.g., `/api/usb/scan`, `/api/betaflight/flash`)

### Architectural Patterns
- **API Routes:** Next.js App Router with `force-dynamic`, JSON responses `{ success, data/error }`
- **State Management:** React useState + useRef (no Redux/Zustand)
- **Persistence:** JSON file at `data/inventory.json` (no database)
- **Serial Communication:** Two modes -- MSP (binary read) and CLI (text commands)
- **Config Generation:** Template functions that produce EdgeTX YAML or Betaflight CLI strings
- **Import alias:** `@/*` maps to `src/*`

### Known Hardware Configurations

**iFlight Nazgul Evoque F5D V2 O4 6S HD (ELRS 2.4GHz)**
- Board: IFLIGHT_BLITZ_F722 (MCU: STM32F722)
- Betaflight: 4.5.2
- Pins: MOTOR 1=B01, 2=B00, 3=C08, 4=C09 | LED_STRIP=A08 | LED=C15 | BEEPER=C13
- LED: mode RACE, color MAGENTA (STATUS mode turns off without RX signal)
- Motors: all CW (Props Out), yaw_motors_reversed=ON
- ELRS binding phrase: `my_binding_phrase`
- beeper_inversion=ON, beeper_od=OFF

**RadioMaster TX16S**
- EdgeTX 2.7.1, SD card version 2.11.3
- Internal module: TYPE_CROSSFIRE (ELRS)
- ELRS Lua script: elrsV3.lua (NOT ELRS.lua)
- Models must be named modelN.yml and listed in MODELS/models.yml index
- USB timeout ~30 seconds -- work fast when SD is mounted
- USB Serial mode for ELRS flash; USB Storage mode for SD access

### Tech Debt & Fragile Areas
- **Serial port listener cleanup** -- can leak on exceptions; always use try-finally
- **CLI mode blocks FC** -- must `exit` CLI before drone can arm/fly
- **No test suite** -- all testing is manual with curl + hardware
- **macOS-only** -- system_profiler, /dev/tty.*, /Volumes/ paths
- **YAML parsing** -- regex-based, not robust for complex EdgeTX structures
- **No input validation** -- API routes trust client data
- **File write race conditions** -- inventory.json has no locking

### Commands
```bash
npm run dev          # Dev server on localhost:3000
npm run build        # Production build (must pass with 0 errors)
npm run lint         # ESLint
npm start            # Production server

# ELRS firmware (external)
cd /tmp/ExpressLRS/src
pio run -e Unified_ESP32_2400_TX_via_UART    # Build TX firmware
pio run -e Unified_ESP8285_2400_RX_via_WIFI  # Build RX firmware

# Flash scripts
/tmp/flash_elrs_tx.sh    # Auto-flash TX via WiFi
/tmp/fix_elrs_rx.sh      # Auto-flash RX via WiFi
```

### No ENV Variables Required
All config is hardcoded in source or persisted to data/inventory.json.

---

## 7. Core Principles

- **Simplicity First:** make every change as simple as possible, minimal code impact
- **No Laziness:** find root causes, no temporary fixes, senior developer standards
- **Minimal Impact:** changes should only touch what's necessary, avoid introducing bugs
- **Never use em dashes** in any output (use -- instead)
- **Hardware Safety:** never spin motors or change resource pins without explicit user confirmation
- **One Save Rule:** batch all Betaflight CLI changes into one save to prevent partial config resets
- **Read Before Write:** always read current state before overwriting (especially resource pins, serial config)
- **Backup Before Destructive:** always backup SD card before clean/inject operations
