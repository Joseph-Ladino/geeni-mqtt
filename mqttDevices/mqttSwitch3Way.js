const client = require("./mqttClient");
const TuyaSwitch3Way = require("../tuyaDevices/tuyaSwitch3Way");

class MqttSwitch3Way extends TuyaSwitch3Way {
    constructor(switch1Id, switch1Key, switch2Id, switch2Key, deviceName = null, discovery = false) {
        super(switch1Id, switch1Key, switch2Id, switch2Key, deviceName);
        
        this.mqttIcon = "mdi:light-switch";
        this.mqttBaseTopic = `homeassistant/switch/${this.deviceName.replace(' ', "_")}`;
        this.mqttStateTopic = this.mqttBaseTopic + "/state";
        this.mqttCommandTopic = this.mqttStateTopic + "/set";
        this.mqttAvailabilityTopic = this.mqttStateTopic + "/available";

        client.subscribe(this.mqttCommandTopic);
        client.on("message", (topic, msg) => this.onMqttMessage(topic, msg));

        if(discovery) this.publishMqttDiscovery();
    }

    onSwitchData() {
        // on = sw0 xnor sw1 
        this.state.on = !(this.switches[0].on ^ this.switches[1].on);
        this.publishMqttState();
    }

    onSwitchAvailabilityUpdate() {
        this.state.available = this.switches[0].available && this.switches[1].available;
        this.publishMqttAvailability();
    }

    onConnected() {
        console.log(`${this.deviceName}: BOTH SWITCHES CONNECTED`);

        // publishMqttAvailability will have already been called so it's unnecessary here

        this.publishMqttState();
    }

    async onMqttMessage(topic, msg) {
        if(topic == this.mqttCommandTopic) {
            this.set(msg == "ON"); // see comment in MqttSwitch#onMqttMessage (mqttSwitch.js)
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

module.exports = MqttSwitch3Way;