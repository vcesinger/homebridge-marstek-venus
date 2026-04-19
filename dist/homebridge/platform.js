const { PLATFORM_NAME, PLUGIN_NAME } = require('../settings.js');
const { MarstekVenusClient } = require('../protocol/client.js');
const { BatteryAccessory } = require('./battery-accessory.js');
const { PowerSensorAccessory } = require('./power-sensor-accessory.js');
const { ModeSensorAccessory } = require('./mode-sensor-accessory.js');
const { OnlineStatusAccessory } = require('./online-status-accessory.js');

class MarstekVenusPlatform {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;
    this.accessories = [];
    this.refreshables = [];

    this.parsedConfig = parseConfig(config);
    this.client = new MarstekVenusClient(log, this.parsedConfig);

    this.api.on('didFinishLaunching', () => {
      void this.bootstrap();
    });
  }

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }

  async bootstrap() {
    try {
      this.registerAccessories();
      await this.refreshAll();
      this.startPolling();
    } catch (error) {
      this.log.error(`Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  registerAccessories() {
    this.refreshables.push(new BatteryAccessory(this, this.ensureAccessory('Battery', 'battery')));
    this.refreshables.push(new PowerSensorAccessory(this, this.ensureAccessory('Battery charge power', 'charge-power'), 'chargePowerW'));
    this.refreshables.push(new PowerSensorAccessory(this, this.ensureAccessory('Battery discharge power', 'discharge-power'), 'dischargePowerW'));
    this.refreshables.push(new PowerSensorAccessory(this, this.ensureAccessory('Grid import power', 'grid-import'), 'gridImportPowerW'));
    this.refreshables.push(new PowerSensorAccessory(this, this.ensureAccessory('Grid export power', 'grid-export'), 'gridExportPowerW'));
    this.refreshables.push(new ModeSensorAccessory(this, this.ensureAccessory('Operating mode', 'mode')));
    this.refreshables.push(new OnlineStatusAccessory(this, this.ensureAccessory('Online status', 'online')));

    if (this.parsedConfig.activateCtPowerSensor) {
      this.refreshables.push(new PowerSensorAccessory(this, this.ensureAccessory('CT total power', 'ct-total-power'), 'ctTotalPowerW'));
    }
  }

  ensureAccessory(name, suffix) {
    const uuid = this.api.hap.uuid.generate(`marstek-venus-${suffix}`);
    const existing = this.accessories.find((entry) => entry.UUID === uuid);
    if (existing) {
      return existing;
    }

    const accessory = new this.api.platformAccessory(`Marstek ${name}`, uuid);
    this.accessories.push(accessory);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    return accessory;
  }

  startPolling() {
    setInterval(() => {
      void this.refreshAll();
    }, this.parsedConfig.refreshIntervalSeconds * 1000);
  }

  async refreshAll() {
    const snapshot = await this.client.getSnapshot(true);
    for (const refreshable of this.refreshables) {
      try {
        await refreshable.refresh(snapshot);
      } catch (error) {
        this.log.error(error instanceof Error ? error.message : String(error));
      }
    }
  }
}

function parseConfig(config) {
  const host = typeof config.host === 'string' ? config.host.trim() : '';
  if (!host) {
    throw new Error('host is required');
  }

  const port = integer(config.port, 30000);
  const refreshIntervalSeconds = Math.max(60, integer(config.refreshIntervalSeconds, 60));
  const requestTimeoutSeconds = Math.min(30, Math.max(3, integer(config.requestTimeoutSeconds, 15)));

  return {
    host,
    port,
    refreshIntervalSeconds,
    requestTimeoutSeconds,
    activateCtPowerSensor: config.activateCtPowerSensor ?? true,
  };
}

function integer(value, fallback) {
  return Number.isInteger(value) ? value : fallback;
}

module.exports = {
  MarstekVenusPlatform,
};

