# Homebridge Marstek Venus

Homebridge plugin for Marstek Venus batteries using the local Open API over UDP.

This project is intentionally starting as a read-only MVP. The goal of the first version is stable local telemetry for Marstek Venus batteries without relying on the Marstek cloud.

## Scope

- battery state of charge
- charging state
- battery temperature
- battery charge and discharge power
- grid import and export power
- optional CT total power
- operating mode as a numeric automation sensor
- online / last successful poll status

## Why read-only first

Community experience shows that Marstek's local API is still evolving and firmware behavior varies between hardware and firmware revisions. Polling faster than 60 seconds is not recommended.

This plugin therefore starts with:

- manual IP-based setup
- no discovery dependency
- slow polling by default
- no control commands yet

## API assumptions

The MVP aligns with publicly documented / observed method names used in the Marstek local API ecosystem:

- `Marstek.GetDevice`
- `Bat.GetStatus`
- `ES.GetStatus`
- `EM.GetStatus`
- `ES.GetMode`

The commonly reported default port is `30000`.

## HomeKit mapping

Because HomeKit has no native battery-storage telemetry services, this plugin maps values pragmatically:

- Battery accessory: HomeKit Battery + Temperature Sensor
- Charge / discharge / grid / CT power: Light Sensors
- Operating mode: Humidity Sensor using a documented numeric mapping
- Online status: Occupancy Sensor

Operating mode mapping:

- `Auto` = `25`
- `AI` = `50`
- `Manual` = `75`
- `Passive` = `100`
- unknown / offline = `0`

## Example config

```json
{
  "platform": "HomebridgeMarstekVenus",
  "host": "192.168.1.50",
  "port": 30000,
  "refreshIntervalSeconds": 60,
  "requestTimeoutSeconds": 15,
  "activateCtPowerSensor": true
}
```

## Notes

- Enable Local API / Open API on the Marstek device first.
- Use the latest Marstek firmware available to you.
- If values look 1000x off on your firmware, a compatibility scaling layer may be needed in a later release.
- This version is designed to be a clean starting point for a future control-capable plugin.

