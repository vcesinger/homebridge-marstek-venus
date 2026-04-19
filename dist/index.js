const { PLATFORM_NAME } = require('./settings.js');
const { MarstekVenusPlatform } = require('./homebridge/platform.js');

module.exports = (api) => {
  api.registerPlatform(PLATFORM_NAME, MarstekVenusPlatform);
};

