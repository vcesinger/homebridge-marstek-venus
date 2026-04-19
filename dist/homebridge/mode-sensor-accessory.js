const { AccessoryBase } = require('./accessory-base.js');

class ModeSensorAccessory extends AccessoryBase {
  constructor(platform, accessory) {
    super(platform, accessory);
    const humiditySensorServiceType = this.requireService('HumiditySensor');

    this.service = this.getOrAddService(
      () => this.accessory.getService(humiditySensorServiceType) ?? undefined,
      () => this.accessory.addService(humiditySensorServiceType),
    );

    this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(() => {
        return this.readCachedValue((snapshot) => snapshot.operatingModePercent, 0);
      });
  }

  async refresh(snapshot) {
    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentRelativeHumidity,
      snapshot.operatingModePercent,
    );
  }
}

module.exports = {
  ModeSensorAccessory,
};
