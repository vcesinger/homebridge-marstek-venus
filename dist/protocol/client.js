const dgram = require('node:dgram');
const { normalizeSnapshot } = require('../domain/normalize.js');

const METHODS = {
  DEVICE: 'Marstek.GetDevice',
  BATTERY: 'Bat.GetStatus',
  ENERGY_SYSTEM: 'ES.GetStatus',
  ENERGY_METER: 'EM.GetStatus',
  MODE: 'ES.GetMode',
};

class MarstekVenusClient {
  constructor(log, config) {
    this.log = log;
    this.host = config.host;
    this.port = config.port;
    this.timeoutMs = config.requestTimeoutSeconds * 1000;
    this.msgId = 0;
    this.lastSnapshot = null;
    this.inFlight = null;
  }

  async getSnapshot(forceRefresh = false) {
    if (!forceRefresh && this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = this.pollOnce()
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  async pollOnce() {
    const lastSuccessfulPoll = new Date().toISOString();
    const results = await Promise.allSettled([
      this.sendCommand(METHODS.DEVICE),
      this.sendCommand(METHODS.BATTERY),
      this.sendCommand(METHODS.ENERGY_SYSTEM),
      this.sendCommand(METHODS.ENERGY_METER),
      this.sendCommand(METHODS.MODE),
    ]);

    const raw = {
      online: results.some((entry) => entry.status === 'fulfilled'),
      lastSuccessfulPoll,
      device: fulfilledValue(results[0]),
      battery: fulfilledValue(results[1]),
      es: fulfilledValue(results[2]),
      em: fulfilledValue(results[3]),
      mode: fulfilledValue(results[4]),
    };

    if (!raw.online && this.lastSnapshot) {
      return {
        ...this.lastSnapshot,
        online: false,
      };
    }

    if (!raw.online) {
      throw new Error(`Marstek Venus at ${this.host}:${this.port} did not respond to any telemetry request`);
    }

    this.lastSnapshot = normalizeSnapshot(raw, this.lastSnapshot);
    return this.lastSnapshot;
  }

  sendCommand(method, params = { id: 0 }) {
    const id = ++this.msgId;
    const payload = Buffer.from(JSON.stringify({ id, method, params }));

    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket('udp4');
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error(`Timeout waiting for ${method}`));
      }, this.timeoutMs);

      socket.on('error', (error) => {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      });

      socket.on('message', (message, remote) => {
        if (remote.address !== this.host) {
          return;
        }

        try {
          const decoded = JSON.parse(message.toString('utf8'));
          if (decoded.id !== id) {
            return;
          }

          clearTimeout(timeout);
          socket.close();

          if (decoded.error) {
            reject(new Error(`${method} failed: ${decoded.error.message ?? JSON.stringify(decoded.error)}`));
            return;
          }

          resolve(decoded.result ?? decoded);
        } catch (error) {
          clearTimeout(timeout);
          socket.close();
          reject(error);
        }
      });

      socket.bind(0, () => {
        socket.send(payload, this.port, this.host, (error) => {
          if (!error) {
            return;
          }

          clearTimeout(timeout);
          socket.close();
          reject(error);
        });
      });
    });
  }
}

function fulfilledValue(entry) {
  return entry.status === 'fulfilled' ? entry.value : null;
}

module.exports = {
  MarstekVenusClient,
};

