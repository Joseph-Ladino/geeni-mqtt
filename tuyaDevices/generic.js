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
        
        this.device.on('disconnected', _ =>  this.onDisconnected());  // class specific handler that is CALLED FIRST for logging/extras
        this.device.on('disconnected', _ => this._onDisconnected());  // background handler to adjust availability state and handle reconnecting
        
        this.device.on('connected', _ =>  this.onConnected());  // class specific handler that is CALLED FIRST for logging/extras
        this.device.on('connected', _ => this._onConnected());  // background handler to adjust availability state
        
        this.device.on('error', err => this.onError(err));
        this.device.on('data', (data, commandByte, packetN) => this.onData(data, commandByte, packetN));

        this.state = { available: false };
    }

    get available() {
        return this.state.available;
    }

    async connect() {
        if(this.available) return Promise.resolve();

        return this.device.find()
            .then(_ => this.device.connect())
            .catch(reason => {
                console.log("CONNECTION TO DEVICE FAILED :(");
                this.onError(reason);
            });
    }

    async reconnect() {
        console.log(`${this.deviceName}: ATTEMPTING RECONNECT IN 10 SECONDS`);
        setTimeout(_ => { if(!this.device.isConnected()) this.connect(); }, 10000);
    }

    onDisconnected() {
        console.log(`${this.deviceName}: DISCONNECTED FROM DEVICE, ATTEMPTING RECONNECT...`);
    }

    onConnected() {
        console.log(`${this.deviceName}: CONNECTED TO DEVICE`);
    }

    _onDisconnected() {      
        this.state.available = false;
        this.reconnect();
    }

    _onConnected() {
        this.state.available = true;
    }

    onData(data) {
        console.log(`${this.deviceName}: RECEIVED DATA: ${data}`);
    }
    
    onError(err) {
        console.log(`${this.deviceName}: ERROR WHILE CONNECTING: ${err}`);

        if(this.device.isConnected()) this.device.disconnect();
        this.reconnect();
    }
}

module.exports = TuyaGeneric;