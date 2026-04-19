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
      .onGet(async () => {
        try {
          return (await this.getSnapshot()).batterySoc;
        } catch (error) {
          throw this.toError(error);
        }
      });

    this.batteryService.getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(async () => {
        try {
          const snapshot = await this.getSnapshot();
          return snapshot.chargingState === 'charging'
            ? this.platform.Characteristic.ChargingState.CHARGING
            : this.platform.Characteristic.ChargingState.NOT_CHARGING;
        } catch (error) {
          throw this.toError(error);
        }
      });

    this.batteryService.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(async () => {
        try {
          return (await this.getSnapshot()).statusLowBattery
            ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
            : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
        } catch (error) {
          throw this.toError(error);
        }
      });

    this.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(async () => {
        try {
          return (await this.getSnapshot()).batteryTemperatureC;
        } catch (error) {
          throw this.toError(error);
        }
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
