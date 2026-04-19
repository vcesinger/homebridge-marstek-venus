const { AccessoryBase } = require('./accessory-base.js');

class BatteryAccessory extends AccessoryBase {
  constructor(platform, accessory) {
    super(platform, accessory);

    const batteryServiceType = this.requireService('BatteryService', 'Battery');
    const temperatureServiceType = this.requireService('TemperatureSensor');

    this.batteryService = this.getOrAddService(
      () => this.accessory.getService(batteryServiceType) ?? undefined,
      () => this.accessory.addService(batteryServiceType),
    );

    this.temperatureService = this.getOrAddService(
      () => this.accessory.getService(temperatureServiceType) ?? undefined,
      () => this.accessory.addService(temperatureServiceType),
    );

    this.batteryService.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(() => {
        return this.readCachedValue((snapshot) => snapshot.batterySoc, 0);
      });

    this.batteryService.getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(() => {
        return this.readCachedValue(
          (snapshot) => snapshot.chargingState === 'charging'
            ? this.platform.Characteristic.ChargingState.CHARGING
            : this.platform.Characteristic.ChargingState.NOT_CHARGING,
          this.platform.Characteristic.ChargingState.NOT_CHARGING,
        );
      });

    this.batteryService.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(() => {
        return this.readCachedValue(
          (snapshot) => snapshot.statusLowBattery
            ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
            : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
          this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
        );
      });

    this.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(() => {
        return this.readCachedValue((snapshot) => snapshot.batteryTemperatureC, 0);
      });
  }

  async refresh(snapshot) {
    this.batteryService.updateCharacteristic(this.platform.Characteristic.BatteryLevel, snapshot.batterySoc);
    this.batteryService.updateCharacteristic(
      this.platform.Characteristic.ChargingState,
      snapshot.chargingState === 'charging'
        ? this.platform.Characteristic.ChargingState.CHARGING
        : this.platform.Characteristic.ChargingState.NOT_CHARGING,
    );
    this.batteryService.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      snapshot.statusLowBattery
        ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
        : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
    );
    this.temperatureService.updateCharacteristic(
      this.platform.Characteristic.CurrentTemperature,
      snapshot.batteryTemperatureC,
    );
  }
}

module.exports = {
  BatteryAccessory,
};
