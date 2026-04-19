class AccessoryBase {
  constructor(platform, accessory) {
    this.platform = platform;
    this.accessory = accessory;

    const infoServiceType = this.requireService('AccessoryInformation');
    const infoService = this.accessory.getService(infoServiceType)
      ?? this.accessory.addService(infoServiceType);

    infoService
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Marstek')
      .setCharacteristic(this.platform.Characteristic.Model, 'Venus')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, resolveSerialNumber(this.accessory));
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

  requireService(...names) {
    for (const name of names) {
      if (this.platform.Service && this.platform.Service[name]) {
        return this.platform.Service[name];
      }
    }

    throw new Error(`Missing Homebridge service type: ${names.join(' / ')}`);
  }
}

function resolveSerialNumber(accessory) {
  if (accessory && typeof accessory.UUID === 'string' && accessory.UUID.trim() !== '') {
    return accessory.UUID;
  }

  if (accessory && typeof accessory.displayName === 'string' && accessory.displayName.trim() !== '') {
    return accessory.displayName;
  }

  return 'marstek-venus';
}

module.exports = {
  AccessoryBase,
};
