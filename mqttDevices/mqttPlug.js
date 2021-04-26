const MqttSwitch = require("./mqttSwitch");

class MqttPlug extends MqttSwitch {
    constructor(deviceId, deviceKey, deviceName = null, discovery = false) {
        super(deviceId, deviceKey, deviceName, false);
        
        this.mqttIcon = "mdi:power-socket-us";

        if(discovery) this.publishMqttDiscovery();
    }

    onDisconnected() {
        console.log(`${this.deviceName}: DISCONNECTED FROM PLUG`);
    }

    onConnected() {
        console.log(`${this.deviceName}: CONNECTED TO PLUG`);
    }
}

module.exports = MqttPlug;