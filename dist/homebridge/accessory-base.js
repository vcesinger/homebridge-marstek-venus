class AccessoryBase {
  constructor(platform, accessory) {
    this.platform = platform;
    this.accessory = accessory;

    this.accessory.getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Marstek')
      .setCharacteristic(this.platform.Characteristic.Model, 'Venus')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.UUID);
  }

  async getSnapshot() {
    return this.platform.client.getSnapshot();
  }

  toError(error) {
    this.platform.log.error(error instanceof Error ? error.message : String(error));
    return new this.platform.api.hap.HapStatusError(-70402);
  }

  getOrAddService(getter, factory) {
    return getter() ?? factory();
  }
}

module.exports = {
  AccessoryBase,
};

