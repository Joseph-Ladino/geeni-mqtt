const MqttSwitch = require("./mqttSwitch");

class MqttPlug extends MqttSwitch {
    constructor(deviceId, deviceKey, deviceName = null, discovery = false) {
        super(deviceId, deviceKey, deviceName, false);
        
        this.mqttIcon = "mdi:power-plug";

        if(discovery) this.publishMqttDiscovery();
    }

    onConnected() {
        console.log(`${this.deviceName}: CONNECTED TO PLUG`);

        this.state.available = true;
        this.publishMqttAvailability();
        this.publishMqttState();
    }

    onDisconnected() {
        console.log(`${this.deviceName}: DISCONNECTED FROM PLUG`);

        this.state.available = false;
        this.publishMqttAvailability();
        
        this.connect();
    }
}

module.exports = MqttPlug;