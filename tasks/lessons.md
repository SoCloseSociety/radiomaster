# FPV Dashboard -- Lessons Learned

## Hardware Configuration

### 1. Always identify the EXACT board target first
**What happened:** We assumed the Nazgul used SucceX-E F7 (IFLIGHT_SUCCEX_E_F7) based on MSP board ID "S7X2". The actual board is IFLIGHT_BLITZ_F722 with completely different motor and LED pins.
**Impact:** Wrong motor pins = Motor 4 disappeared. Wrong LED pin = LEDs stopped working.
**Rule:** Always ask user for exact drone model. Download unified target config from `betaflight/unified-targets` GitHub. Verify `board_name` in CLI.

### 2. Resource pin changes can reset other settings
**What happened:** Each `save` after a `resource` command reset serial config (UART2 Serial RX), aux modes (ARM/ANGLE), and other settings.
**Impact:** Drone lost radio connection and couldn't arm after pin changes.
**Rule:** Always send ALL settings (resources + serial + aux + features + rates + everything) in ONE batch before a single `save`.

### 3. CLI mode blocks drone operation
**What happened:** Our dashboard enters Betaflight CLI mode (sends `#`) for every command. While in CLI mode, the FC can't process RC signals or arm.
**Impact:** User couldn't arm the drone while USB was connected and we were communicating.
**Rule:** Always `exit` CLI when done. Better yet: tell user to disconnect USB before testing arming.

### 4. LED_STRIP mode matters
**What happened:** LED_STRIP in STATUS mode turns off LEDs when there's no RX signal. User saw LEDs flash at boot then go dark.
**Impact:** Hours spent debugging LED pin when the real issue was the profile mode.
**Rule:** Use `set ledstrip_profile = RACE` for always-on LEDs. STATUS requires active RX connection.

### 5. EdgeTX model format is strict
**What happened:** Our generated .yml files used custom field names (mixers, internalModule). EdgeTX uses specific format (mixData, moduleData, destCh, srcRaw).
**Impact:** Radio showed empty screen -- models loaded but had no working config.
**Rule:** Always base new models on a real model that the radio itself wrote. Copy the exact format, only change the name and specific fields.

### 6. EdgeTX needs models.yml index
**What happened:** We injected model files but forgot the `models.yml` index file that tells EdgeTX which models exist.
**Impact:** Radio showed no models after restart.
**Rule:** Always create `MODELS/models.yml` with the filename-to-name mapping.

### 7. EdgeTX model files must be named modelN.yml
**What happened:** We named files `hulk2_tx16s.yml`. EdgeTX only recognizes `model1.yml`, `model2.yml`, etc.
**Impact:** Radio showed no models.
**Rule:** Files must be `model1.yml`, `model2.yml`, etc. Custom names go in the `name:` field inside the YAML.

### 8. TX16S USB Storage timeout is ~30 seconds
**What happened:** The TX16S auto-disconnects USB after ~30 seconds, ejecting the SD card.
**Impact:** Scripts and operations timed out; had to work very fast.
**Rule:** Prepare everything before connecting. Use monitoring scripts that detect mount and act immediately.

### 9. Serial response truncation
**What happened:** Our CLI reader stops reading after 500ms timeout. Long responses (like `resource` listing all pins) get truncated.
**Impact:** Motor 4 appeared missing in our readings when it was actually configured.
**Rule:** Don't trust truncated responses. Read specific settings individually (`get <key>`) instead of bulk commands.

### 10. ELRS RX vs TX firmware are different
**What happened:** User accidentally ran the TX flash script on the RX, flashing wrong firmware.
**Impact:** RX had TX firmware, needed WiFi recovery.
**Rule:** Create clearly named, separate scripts. Include prominent warnings about which device the script targets.

---

## Code Patterns

### API Response Shape
All API routes return: `{ success: boolean, data?, error?, hint? }`

### Serial Communication
Two modes, never mix them:
- **MSP mode** (default): binary protocol for reading FC state
- **CLI mode** (enter with `#`): text commands for writing config
- Always `exit` CLI when done

### Config Injection Pattern
1. Read current state
2. Prepare all commands
3. Send in one batch
4. Single `save` at the end
5. Wait for reboot (6+ seconds)
6. Verify by reading back
