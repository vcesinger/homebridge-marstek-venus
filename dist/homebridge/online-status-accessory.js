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
      .onGet(async () => {
        try {
          return (await this.getSnapshot()).online
            ? this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED
            : this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
        } catch (error) {
          throw this.toError(error);
        }
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
