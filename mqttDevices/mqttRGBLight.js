const client = require("./mqttClient");
const TuyaRGBLight = require("../tuyaDevices/tuyaRGBLight");

class MqttRGBLight extends TuyaRGBLight {
    constructor(deviceId, deviceKey, deviceName = null, discovery = false) {
        super(deviceId, deviceKey, deviceName);

        this.mqttBaseTopic = `homeassistant/light/${this.deviceName.replace(' ', "_")}`;
        this.mqttStateTopic = this.mqttBaseTopic + "/state";
        this.mqttCommandTopic = this.mqttStateTopic + "/set";
        this.mqttAvailabilityTopic = this.mqttStateTopic + "/available";

        client.subscribe(this.mqttCommandTopic);
        client.on("message", (topic, msg) => this.onMqttMessage(topic, msg));

        if(discovery) this.publishMqttDiscovery();
    }

    _onDisconnected() {
        super._onDisconnected();

        this.publishMqttAvailability();
        this.reconnect();
    }
    
    _onConnected() {
        super._onConnected();

        this.publishMqttAvailability();
        this.publishMqttState();
    }

    onRefresh(data) {
        super.onRefresh(data);

        this.publishMqttState();
    }

    onData(data, cmd) {
        super.onData(data, cmd);

        if(cmd != 10) this.publishMqttState();
    }

    async onMqttMessage(topic, msg) {
        if(topic == this.mqttCommandTopic) {
            const payload = JSON.parse(msg.toString());
            
            this.set(payload.state == "ON");

            // map HA brightness (5 - 255) to Tuya brightness (25 - 255)
            if('brightness' in payload) this.setBrightness((payload.brightness - 5) * 230 / 250 + 25);
            
            if('color' in payload) {
                const color = payload.color;
                if(color.s < 10) return this.setMode('white').then(_ => this.setColor({ h: 0, s: 0 }));
                
                // map HA saturationg (0 - 100) to Tuya saturation (0 - 255)
                this.setColor({ h: color.h, s: color.s * 2.55 }).then(_ => this.setMode('colour'));
            }

        } else if(topic == client.HAStatusTopic) {
            this.publishMqttAvailability();
        }
    }

    publishMqttAvailability() {
        client.publish(this.mqttAvailabilityTopic, this.available ? "online" : "offline");
    }

    publishMqttState() {
        const stateData = {
            state: this.on ? "ON" : "OFF",
            brightness: this.brightness,
            color_mode: "hs",
            
            color: {
                h: this.state.color.h,
                s: this.state.color.s / 2.55 // 0 - 100
            }
        };

        client.publish(this.mqttStateTopic, JSON.stringify(stateData));
    }

    publishMqttDiscovery() {
        const configTopic = this.mqttBaseTopic + "/config";

        const configData = {
            name: this.deviceName,
            unique_id: this.deviceId,
            platform: "mqtt",
            schema: "json",

            state_topic: this.mqttStateTopic,
            command_topic: this.mqttCommandTopic,
            availability_topic: this.mqttAvailabilityTopic,

            brightness: true,            
            color_mode: true,
            supported_color_modes: ["hs"],
        };

        client.publish(configTopic, JSON.stringify(configData));
    }
}

module.exports = MqttRGBLight;