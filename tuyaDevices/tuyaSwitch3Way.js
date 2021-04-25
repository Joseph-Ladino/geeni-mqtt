const mqtt = require("mqtt");
const Switch = require("./tuyaSwitch");

class Switch3Way {
    constructor(switch1Id, switch1Key, switch2Id, switch2Key, deviceName = null) {
        this.deviceId = (switch1Id + switch2Id);
        this.deviceName = deviceName || this.deviceId;

        this.switches = [
            new Switch(switch1Id, switch1Key, this.deviceName + '-sw0'), 
            new Switch(switch2Id, switch2Key, this.deviceName + '-sw1')
        ];


        // NOTE: because functions are not overriden, the switch's original event listeners are still called
        // these are additional listeners that update states for this class
        this.switches[0].device.on('data', _ => this.onSwitchData());
        this.switches[1].device.on('data', _ => this.onSwitchData());

        this.switches[0].device.on('connected', _ => this.onSwitchAvailabilityUpdate());
        this.switches[1].device.on('connected', _ => this.onSwitchAvailabilityUpdate());
        
        this.switches[0].device.on('disconnected', _ => this.onSwitchAvailabilityUpdate());
        this.switches[1].device.on('disconnected', _ => this.onSwitchAvailabilityUpdate());
        

        this.state = { on: false, available: false };
    }

    get on() {
        return this.state.on;
    }

    get off() {
        return !this.state.on;
    }

    get available() {
        return this.state.available;
    }

    async turnOn() {
        if(this.off) {
            this.state.on = true;
            
            return Promise.all([this.switches[0].turnOn(), this.switches[1].turnOn()]);
        } 
        return Promise.resolve();
    }

    async turnOff() {
        if(this.on) {
            this.state.on = false;
            
            return Promise.all([this.switches[0].turnOn(), this.switches[1].turnOff()]);
        }
        
        return Promise.resolve();
    }

    async set(on) {
        return (on ? this.turnOn() : this.turnOff());
    }

    async connect() {
        // for whatever reason, connecting the 2nd switch before the first one fixes connection errors
        return this.switches[1].connect()
        .then(_ => this.switches[0].connect())
        .then(_ => this.onConnected());
    }

    onSwitchData() {
        // on = sw0 xnor sw1 
        this.state.on = !(this.switches[0].on ^ this.switches[1].on);
    }

    onSwitchAvailabilityUpdate() {
        this.state.available = this.switches[0].available && this.switches[1].available;
    }

    onConnected() {
        console.log(`${this.deviceName}: SWITCHES CONNECTED`);
    }
}

module.exports = Switch3Way;