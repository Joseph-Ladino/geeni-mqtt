const TuyaDevice = require("tuyapi");

class TuyaGeneric {
    constructor(deviceId, deviceKey, deviceName = null) {
        this.deviceId = deviceId;
        this.deviceKey = deviceKey;
        this.deviceName = deviceName || deviceId;

        this.device = new TuyaDevice({
            id: deviceId,
            key: deviceKey
        });
        
        this.device.on('disconnected', _ => this.onDisconnected())
        this.device.on('connected', _ => this.onConnected());
        this.device.on('error', err => this.onError(err));
        this.device.on('data', data => this.onData(data));

        this.state = { available: false };
    }

    get available() {
        return this.state.available;
    }

    async connect() {
        return this.device.find().then(_ => this.device.connect());
    }

    onDisconnected() {
        console.log(`${this.deviceName}: DISCONNECTED FROM DEVICE`);

        this.state.available = false;
    }

    onConnected() {
        console.log(`${this.deviceName}: CONNECTED TO DEVICE`);

        this.state.available = true;
    }
    
    onData(data) {
        console.log(`${this.deviceName}: RECEIVED DATA: ${data}`);
    }
    
    onError(err) {
        console.log(`${this.deviceName}: ERROR WHILE CONNECTING: ${err}`);
        console.log(`${this.deviceName}: ATTEMPTING RECONNECT...`);

        this.device.connect();
    }
}

module.exports = TuyaGeneric;