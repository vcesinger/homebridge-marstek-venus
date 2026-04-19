const { AccessoryBase } = require('./accessory-base.js');

class OnlineStatusAccessory extends AccessoryBase {
  constructor(platform, accessory) {
    super(platform, accessory);

    this.service = this.getOrAddService(
      () => this.accessory.getService(this.platform.Service.OccupancySensor) ?? undefined,
      () => this.accessory.addService(this.platform.Service.OccupancySensor),
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

