const client = require("./mqttClient");
const TuyaSwitch = require("../tuyaDevices/tuyaSwitch");

class MqttSwitch extends TuyaSwitch {
    constructor(deviceId, deviceKey, deviceName = null, discovery = false) {
        super(deviceId, deviceKey, deviceName);

        this.mqttIcon = "mdi:light-switch";
        this.mqttBaseTopic = `homeassistant/switch/${this.deviceName.replace(' ', "_")}`;
        this.mqttStateTopic = this.mqttBaseTopic + "/state";
        this.mqttCommandTopic = this.mqttStateTopic + "/set";
        this.mqttAvailabilityTopic = this.mqttStateTopic + "/available";

        client.subscribe(this.mqttCommandTopic);
        client.on("message", (topic, msg) => this.onMqttMessage(topic, msg));

        if(discovery) this.publishMqttDiscovery();
    }
    
    
    onDisconnected() {
        console.log(`${this.deviceName}: DISCONNECTED FROM SWITCH`);
    }
    
    onConnected() {
        console.log(`${this.deviceName}: CONNECTED TO SWITCH`);
    }
    
    // override to ensure the state is set before publishing to mqtt
    _onDisconnected() {
        this.state.available = false;
        this.publishMqttAvailability();
        this.attemptReconnect();
    }
    
    _onConnected() {
        this.state.available = true;
        this.publishMqttAvailability();
        this.publishMqttState();
    }

    onData(data) {
        if('1' in data.dps) this.state.on = data.dps['1'];
        this.publishMqttState();
    }

    async onMqttMessage(topic, msg) {
        if(topic == this.mqttCommandTopic) {
            this.set(msg == "ON"); // tuya detects the change and calls onData which publishes state to MQTT
        } else if(topic == client.HAStatusTopic) {
            setTimeout(_ => {
                this.publishMqttDiscovery();
                this.publishMqttState();
            }, 1000);
        }
    }

    publishMqttAvailability() {
        client.publish(this.mqttAvailabilityTopic, this.available ? "online" : "offline", { retain: true });
    }

    publishMqttState() {
        client.publish(this.mqttStateTopic, this.on ? "ON" : "OFF");
    }

    publishMqttDiscovery() {
        const configTopic = this.mqttBaseTopic + "/config";

        const configData = {
            name: this.deviceName,
            unique_id: this.deviceId,
            
            state_topic: this.mqttStateTopic,
            command_topic: this.mqttCommandTopic,
            availability_topic: this.mqttAvailabilityTopic,

            icon: this.mqttIcon,

            payload_on: "ON",
            payload_off: "OFF",
            payload_available: "online",
            payload_not_available: "offline",
        };

        client.publish(configTopic, JSON.stringify(configData));
    }
}

module.exports = MqttSwitch;