const TuyaGeneric = require("./generic");

class Switch extends TuyaGeneric {
    constructor(deviceId, deviceKey, deviceName = null) {
        super(deviceId, deviceKey, deviceName);

        this.state = { on: false };
    }

    get on() {
        return this.state.on;
    }

    get off() {
        return !this.state.on;
    }

    async turnOn() {
        if(this.off) {
            this.state.on = true;

            return this.device.set({set: true}); // set default dps to true (on)
        }
        
        return Promise.resolve(); // return resolved promise if switch is already on
    }

    async turnOff() {
        if(this.on) {
            this.state.on = false;

            return this.device.set({set: false}); // set default dps to false (off)
        }
        
        return Promise.resolve();  // return resolved promise if switch is already off
    }

    async set(on) {
        return (on ? this.turnOn() : this.turnOff());
    }
    
    onDisconnected() {
        console.log(`${this.deviceName}: DISCONNECTED FROM SWITCH, ATTEMPTING RECONNECT...`);
    }

    onConnected() {
        console.log(`${this.deviceName}: CONNECTED TO SWITCH`);
    }

    onData(data) {
        this.state.on = data.dps['1'];
    }
}


module.exports = Switch;