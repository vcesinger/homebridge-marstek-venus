const { AccessoryBase } = require('./accessory-base.js');

class ModeSensorAccessory extends AccessoryBase {
  constructor(platform, accessory) {
    super(platform, accessory);

    this.service = this.getOrAddService(
      () => this.accessory.getService(this.platform.Service.HumiditySensor) ?? undefined,
      () => this.accessory.addService(this.platform.Service.HumiditySensor),
    );

    this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(async () => {
        try {
          return (await this.getSnapshot()).operatingModePercent;
        } catch (error) {
          throw this.toError(error);
        }
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

