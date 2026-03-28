# FPV Dashboard

Full-stack web dashboard for FPV drone configuration. Auto-detect, configure, and manage your RadioMaster radios and FPV drones from your Mac.

## Features

- **USB Auto-Detection** -- Detects RadioMaster TX16S/Pocket, Betaflight flight controllers, DJI devices when plugged in
- **Betaflight Configuration** -- Read and write FC config via MSP protocol and CLI commands directly from the dashboard
- **EdgeTX SD Card Management** -- Analyze radio SD card, inject model templates, backup and restore
- **ELRS Binding Guide** -- Step-by-step guide for flashing ExpressLRS firmware and binding
- **Config Templates** -- Pre-built configs for RadioMaster TX16S/Pocket x iFlight Nazgul/Darwin Hulk 2
- **Motor Testing** -- Visual drone layout with individual motor spin test
- **Simulator Setup** -- Guides for Liftoff, VelociDrone, Uncrashed on macOS
- **Beginner Guide** -- 17 tips covering safety, configuration, ELRS, flying, and gear

## Stack

- **Next.js 15** (App Router)
- **React 19** + TypeScript 5.8
- **Tailwind CSS 4**
- **SerialPort** (Node native module for Betaflight MSP/CLI)
- **PlatformIO** (ELRS firmware builds)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Dashboard Tabs

| Tab | Purpose |
|-----|---------|
| Detection | USB scan, device inventory, flight profiles |
| Drone | Live FC status, motor test, Betaflight CLI flash |
| Radio SD | EdgeTX SD card analysis, backup, model injection |
| Flash ELRS | Step-by-step ELRS firmware flashing guide |
| Templates | EdgeTX + Betaflight config preview and export |
| Simulator | macOS simulator setup, USB joystick config |
| Guide | Beginner tips and recommendations |

## Supported Hardware

**Radios**
- RadioMaster TX16S (ELRS internal module)
- RadioMaster Pocket (ELRS)

**Drones**
- iFlight Nazgul Evoque F5D V2 (BLITZ F722)
- Darwin FPV Hulk 2

**Protocols**
- ExpressLRS (ELRS) 2.4GHz
- CRSF (Crossfire)
- DShot600

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/usb/scan` | GET | Detect USB devices, serial ports, EdgeTX mount |
| `/api/betaflight` | GET | Read FC config via MSP |
| `/api/betaflight/flash` | POST | Send CLI commands to FC |
| `/api/inventory` | GET/POST/DELETE | Device inventory CRUD |
| `/api/profiles` | GET/POST/DELETE | Flight profile management |
| `/api/templates` | GET | Config templates for radio/drone combos |
| `/api/edgetx` | GET | Read EdgeTX SD card config |
| `/api/inject` | GET/POST | Inject models onto EdgeTX SD card |
| `/api/analyze` | GET/POST | Full SD analysis, backup, clean-inject |
| `/api/simulator` | GET | Simulator info and axis mappings |

## Requirements

- macOS (uses `system_profiler` for USB detection)
- Node.js 18+
- USB cable for radio/drone connection

## License

MIT
