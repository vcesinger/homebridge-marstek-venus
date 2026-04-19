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

