const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSnapshot, modeToPercent } = require('../dist/domain/normalize.js');

test('mode mapping is stable', () => {
  assert.equal(modeToPercent('Auto'), 25);
  assert.equal(modeToPercent('AI'), 50);
  assert.equal(modeToPercent('Manual'), 75);
  assert.equal(modeToPercent('Passive'), 100);
  assert.equal(modeToPercent('Unknown'), 0);
});

test('normalize snapshot computes signed power splits', () => {
  const snapshot = normalizeSnapshot({
    online: true,
    lastSuccessfulPoll: '2026-04-19T11:00:00.000Z',
    device: { result: { device: 'VenusE', ver: 154 } },
    battery: { result: { soc: 64, bat_temp: 23.4, bat_voltage: 51.7, bat_current: 8.2 } },
    es: { result: { bat_power: -820, ongrid_power: 430 } },
    em: { result: { a_power: 200, b_power: 150, c_power: 80 } },
    mode: { result: { mode: 'Auto' } }
  });

  assert.equal(snapshot.deviceModel, 'VenusE');
  assert.equal(snapshot.firmwareVersion, 154);
  assert.equal(snapshot.batterySoc, 64);
  assert.equal(snapshot.chargePowerW, 0);
  assert.equal(snapshot.dischargePowerW, 820);
  assert.equal(snapshot.gridImportPowerW, 430);
  assert.equal(snapshot.gridExportPowerW, 0);
  assert.equal(snapshot.ctTotalPowerW, 430);
  assert.equal(snapshot.operatingModePercent, 25);
});

test('normalize snapshot supports Venus E 3.0 field names', () => {
  const snapshot = normalizeSnapshot({
    online: true,
    lastSuccessfulPoll: '2026-04-19T11:00:00.000Z',
    device: {
      result: {
        device: 'VenusE 3.0',
        ver: 148,
        ble_mac: 'bc2a33ad1334',
        wifi_mac: '12ef151bb0d4',
      }
    },
    battery: {
      result: {
        soc: 11,
        bat_temp: 26.0,
        bat_capacity: 609.0,
        rated_capacity: 5120.0,
      }
    },
    es: {
      result: {
        bat_soc: 11,
        bat_cap: 5120,
        ongrid_power: 0,
        offgrid_power: 0,
        total_grid_output_energy: 32181,
        total_grid_input_energy: 42421,
      }
    },
    mode: {
      result: {
        mode: 'AI',
        ct_state: 1,
        a_power: 311,
        b_power: -194,
        c_power: 432,
        total_power: 549,
      }
    },
  });

  assert.equal(snapshot.deviceModel, 'VenusE 3.0');
  assert.equal(snapshot.firmwareVersion, 148);
  assert.equal(snapshot.batterySoc, 11);
  assert.equal(snapshot.batteryTemperatureC, 26);
  assert.equal(snapshot.ratedCapacityWh, 5120);
  assert.equal(snapshot.remainingCapacityWh, 609);
  assert.equal(snapshot.gridImportPowerW, 0);
  assert.equal(snapshot.gridExportPowerW, 0);
  assert.equal(snapshot.ctConnected, true);
  assert.equal(snapshot.ctPhaseAPowerW, 311);
  assert.equal(snapshot.ctPhaseBPowerW, -194);
  assert.equal(snapshot.ctPhaseCPowerW, 432);
  assert.equal(snapshot.ctTotalPowerW, 549);
  assert.equal(snapshot.operatingModePercent, 50);
});

test('normalize snapshot preserves old values on partial responses', () => {
  const previous = normalizeSnapshot({
    online: true,
    lastSuccessfulPoll: '2026-04-19T11:00:00.000Z',
    battery: { result: { soc: 80, bat_temp: 21 } },
    es: { result: { bat_power: 500, ongrid_power: -120 } },
    mode: { result: { mode: 'AI' } }
  });

  const next = normalizeSnapshot({
    online: false,
    lastSuccessfulPoll: '2026-04-19T11:01:00.000Z',
    battery: null,
    es: null,
    mode: null
  }, previous);

  assert.equal(next.batterySoc, 80);
  assert.equal(next.gridExportPowerW, 120);
  assert.equal(next.operatingModePercent, 50);
});

test('normalize snapshot prefers EM status when available', () => {
  const snapshot = normalizeSnapshot({
    online: true,
    lastSuccessfulPoll: '2026-04-19T11:02:00.000Z',
    em: {
      result: {
        ct_state: 1,
        a_power: 313,
        b_power: -214,
        c_power: 428,
        total_power: 527,
        input_energy: 0,
        output_energy: 0,
      }
    },
    mode: {
      result: {
        mode: 'AI',
        total_power: 549,
      }
    },
  });

  assert.equal(snapshot.ctConnected, true);
  assert.equal(snapshot.ctPhaseAPowerW, 313);
  assert.equal(snapshot.ctPhaseBPowerW, -214);
  assert.equal(snapshot.ctPhaseCPowerW, 428);
  assert.equal(snapshot.ctTotalPowerW, 527);
  assert.equal(snapshot.ctInputEnergyWh, 0);
  assert.equal(snapshot.ctOutputEnergyWh, 0);
});
