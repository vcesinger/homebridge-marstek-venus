const { AccessoryBase } = require('./accessory-base.js');

class PowerSensorAccessory extends AccessoryBase {
  constructor(platform, accessory, key) {
    super(platform, accessory);
    this.key = key;

    this.service = this.getOrAddService(
      () => this.accessory.getService(this.platform.Service.LightSensor) ?? undefined,
      () => this.accessory.addService(this.platform.Service.LightSensor),
    );

    this.service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
      .onGet(async () => {
        try {
          return toLightLevel((await this.getSnapshot())[this.key]);
        } catch (error) {
          throw this.toError(error);
        }
      });
  }

  async refresh(snapshot) {
    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentAmbientLightLevel,
      toLightLevel(snapshot[this.key]),
    );
  }
}

function toLightLevel(value) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(0.0001, numeric);
}

module.exports = {
  PowerSensorAccessory,
};

