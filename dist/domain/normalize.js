const MODE_TO_PERCENT = {
  Auto: 25,
  AI: 50,
  Manual: 75,
  Passive: 100,
};

function unwrapResult(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.result && typeof payload.result === 'object') {
    return payload.result;
  }

  return payload;
}

function asNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function modeToPercent(mode) {
  return MODE_TO_PERCENT[mode] ?? 0;
}

function normalizeSnapshot(raw, previous = null) {
  const device = unwrapResult(raw.device) ?? {};
  const battery = unwrapResult(raw.battery) ?? {};
  const es = unwrapResult(raw.es) ?? {};
  const em = unwrapResult(raw.em) ?? {};
  const modeResponse = unwrapResult(raw.mode) ?? {};

  const batteryPower = asNumber(es.bat_power) ?? previous?.batteryPowerW ?? 0;
  const gridPower = asNumber(es.ongrid_power) ?? previous?.gridPowerW ?? 0;
  const phaseA = asNumber(em.a_power);
  const phaseB = asNumber(em.b_power);
  const phaseC = asNumber(em.c_power);
  const ctTotal = [phaseA, phaseB, phaseC].some((value) => value !== null)
    ? [phaseA, phaseB, phaseC].reduce((sum, value) => sum + (value ?? 0), 0)
    : previous?.ctTotalPowerW ?? null;

  const mode = extractMode(modeResponse) ?? previous?.operatingMode ?? 'Unknown';
  const soc = clamp(asNumber(battery.soc) ?? previous?.batterySoc ?? 0, 0, 100);
  const temperature = asNumber(battery.bat_temp) ?? previous?.batteryTemperatureC ?? 0;

  return {
    online: raw.online === true,
    lastSuccessfulPoll: raw.lastSuccessfulPoll ?? previous?.lastSuccessfulPoll ?? null,
    deviceModel: device.device ?? previous?.deviceModel ?? 'Marstek Venus',
    firmwareVersion: device.ver ?? previous?.firmwareVersion ?? null,
    bleMac: device.ble_mac ?? previous?.bleMac ?? null,
    wifiMac: device.wifi_mac ?? previous?.wifiMac ?? null,
    batterySoc: soc,
    batteryTemperatureC: temperature,
    batteryVoltageV: asNumber(battery.bat_voltage) ?? previous?.batteryVoltageV ?? null,
    batteryCurrentA: asNumber(battery.bat_current) ?? previous?.batteryCurrentA ?? null,
    batteryPowerW: batteryPower,
    chargePowerW: Math.max(0, batteryPower),
    dischargePowerW: Math.max(0, -batteryPower),
    gridPowerW: gridPower,
    gridImportPowerW: Math.max(0, gridPower),
    gridExportPowerW: Math.max(0, -gridPower),
    ctTotalPowerW: ctTotal,
    operatingMode: mode,
    operatingModePercent: modeToPercent(mode),
    statusLowBattery: soc <= 20,
    chargingState: batteryPower > 10 ? 'charging' : 'not_charging',
  };
}

function extractMode(payload) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidates = [
    payload.mode,
    payload.work_mode,
    payload.operating_mode,
    payload.current_mode,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate;
    }
  }

  return null;
}

module.exports = {
  MODE_TO_PERCENT,
  normalizeSnapshot,
  modeToPercent,
};

