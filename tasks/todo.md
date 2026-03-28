# FPV Dashboard -- Task Tracker

## Current Sprint

### Nazgul Evoque F5D V2
- [x] Detect FC via USB (MSP read)
- [x] Flash Betaflight config (CRSF, rates, failsafe, modes)
- [x] Flash ELRS TX firmware (binding phrase: my_binding_phrase)
- [x] Flash ELRS RX firmware (WiFi method)
- [x] Bind confirmed (LED RX fixe)
- [x] Motor test (4/4 CW, Props Out)
- [x] LED strip magenta (RACE mode, pin A08)
- [x] Disable all beeps (except RX_SET)
- [ ] Verify arming works on battery only (no USB)
- [ ] Full flight test

### Darwin Hulk 2
- [ ] Connect via USB, read FC config
- [ ] Flash Betaflight config
- [ ] Flash ELRS RX (binding phrase: my_binding_phrase)
- [ ] Bind test
- [ ] Motor test
- [ ] LED config (if available)

### RadioMaster TX16S
- [x] Clean SD card, inject 3 models (Hulk 2, Nazgul, SIMU)
- [x] EdgeTX models in correct format (modelN.yml + models.yml index)
- [x] Screen widgets (ModelBmp + Timer + Outputs)
- [x] Theme FPV Neo (dark + cyan accent)
- [x] Logo SoClose as model bitmap
- [x] ELRS TX module flashed (my_binding_phrase)

### RadioMaster Pocket
- [ ] Configure models (same as TX16S but with fewer switches)
- [ ] Flash ELRS if needed

### Dashboard Web App
- [x] USB detection
- [x] EdgeTX SD analysis
- [x] Betaflight MSP reader
- [x] Betaflight CLI sender
- [x] Config templates (4 combos)
- [x] Simulator tab
- [x] Beginner guide
- [x] ELRS flash guide
- [x] Drone control panel
- [x] Motor test UI
- [ ] Add unit tests for lib/ functions
- [ ] Add input validation (zod) on API routes
- [ ] Fix serial port response truncation (timeout too short)

---

## Review

_To be filled after each sprint completion._
