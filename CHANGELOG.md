# Changelog

All notable changes to this project will be documented in this file.

## [0.1.4] - 2026-04-19

### Fixed
- ignore invalid cached Homebridge accessory entries safely
- improve bootstrap diagnostics with stack traces
- harden accessory creation and cached accessory handling during startup

## [0.1.3] - 2026-04-19

### Changed
- replaced the UDP port slider with a normal input field
- kept the default UDP port at `30000`

## [0.1.2] - 2026-04-19

### Fixed
- improved Homebridge 2 beta compatibility during plugin startup

## [0.1.1] - 2026-04-19

### Fixed
- widened Homebridge peer dependency range to support Homebridge `2.0.0-beta`

## [0.1.0] - 2026-04-19

### Added
- initial public release
- local UDP-based Marstek Open API integration
- read-only telemetry MVP
- live validation against a real Marstek Venus E 3.0 device
- battery telemetry, grid telemetry, CT telemetry, and operating mode support
