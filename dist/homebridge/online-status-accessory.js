const { AccessoryBase } = require('./accessory-base.js');

class OnlineStatusAccessory extends AccessoryBase {
  constructor(platform, accessory) {
    super(platform, accessory);
    const occupancySensorServiceType = this.requireService('OccupancySensor');

    this.service = this.getOrAddService(
      () => this.accessory.getService(occupancySensorServiceType) ?? undefined,
      () => this.accessory.addService(occupancySensorServiceType),
    );

    this.service.getCharacteristic(this.platform.Characteristic.OccupancyDetected)
      .onGet(() => {
        return this.readCachedValue(
          (snapshot) => snapshot.online
            ? this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED
            : this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED,
          this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED,
        );
      });
  }

  async refresh(snapshot) {
    this.service.updateCharacteristic(
      this.platform.Characteristic.OccupancyDetected,
      snapshot.online
        ? this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED
        : this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED,
    );
  }
}

module.exports = {
  OnlineStatusAccessory,
};
