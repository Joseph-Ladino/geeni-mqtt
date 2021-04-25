const client = require("./mqttClient");
const TuyaSwitch = require("../tuyaDevices/tuyaSwitch");

class MqttSwitch extends TuyaSwitch {
    constructor(deviceId, deviceKey, deviceName = null, discovery = false) {
        super(deviceId, deviceKey, deviceName);

        this.mqttDiscovery = discovery;

        this.mqttBaseTopic = `homeassistant/switch/${this.deviceName}`;
        this.mqttStateTopic = this.mqttBaseTopic + "/state";
        this.mqttCommandTopic = this.mqttStateTopic + "/set";
        this.mqttAvailabilityTopic = this.mqttStateTopic + "/available";

        client.subscribe(this.mqttCommandTopic);
        client.on("message", (topic, msg) => this.onMqttMessage(topic, msg));
    }

    onConnected() {
        console.log(`${this.deviceName}: CONNECTED TO SWITCH`);

        this.state.available = true;
        this.publishMqttAvailability();
        this.publishMqttState();
    }

    onDisconnected() {
        console.log(`${this.deviceName}: DISCONNECTED FROM SWITCH`);

        this.state.available = false;
        this.publishMqttAvailability();
    }

    onData(data) {
        this.state.on = data.dps['1'];
        this.publishMqttState();
    }

    async onMqttMessage(topic, msg) {
        if(topic == this.mqttCommandTopic) {
            this.set(msg == "ON"); // tuya detects the change and calls onData which publishes state to MQTT
        }
    }

    publishMqttAvailability() {
        client.publish(this.mqttAvailabilityTopic, this.available ? "online" : "offline");
    }

    publishMqttState() {
        client.publish(this.mqttStateTopic, this.on ? "ON" : "OFF");
    }

    publishMqttDiscover() {
        const configTopic = this.mqttBaseTopic + "/config";

        const configData = {
            name: this.deviceName,
            unique_id: this.deviceId,
            
            state_topic: this.mqttStateTopic,
            command_topic: this.mqttCommandTopic,
            availability_topic: this.mqttAvailabilityTopic,

            payload_on: "ON",
            payload_off: "OFF",
            payload_available: "online",
            payload_not_available: "offline",
        };

        client.publish(configTopic, JSON.stringify(configData));
    }
}

module.exports = MqttSwitch;