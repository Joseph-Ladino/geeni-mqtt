const client = require("./mqttClient");
const TuyaRGBLight = require("../tuyaDevices/tuyaRGBLight");

class MqttRGBLight extends TuyaRGBLight {
    constructor(deviceId, deviceKey, deviceName = null, useV2 = false, discovery = false) {
        super(deviceId, deviceKey, deviceName, useV2);

        this.mqttBaseTopic = `homeassistant/light/${this.deviceName.replace(/ /g, "_")}`;
        this.mqttStateTopic = this.mqttBaseTopic + "/state";
        this.mqttCommandTopic = this.mqttStateTopic + "/set";
        this.mqttAvailabilityTopic = this.mqttStateTopic + "/available";

        client.subscribe(this.mqttCommandTopic);
        client.on("message", (topic, msg) => this.onMqttMessage(topic, msg));
        client.on("dp-refresh", (data, commandByte, packetN) => this.onRefresh(data, commandByte, packetN));

        if(discovery) this.publishMqttDiscovery();
    }

    _onDisconnected() {
        super._onDisconnected();
        
        this.publishMqttAvailability();
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
            
            const { power, mode, brightness, color } = this.dpsMap;

            var data = {};
            
            // state is always sent
            data[power] = payload.state == "ON";

            // map HA brightness to Tuya brightness 
            // note HA brightness will always be on a 0-255 scale
            const adjustedBrightness = ('brightness' in payload) 
            ? TuyaRGBLight.clamp(
                Math.round(
                    (payload.brightness) * (this.maxBrightness - this.minBrightness) / 255 + this.minBrightness),
                    this.minBrightness,
                    this.maxBrightness
                )
            : this.brightness;
            
            // map HA saturation to Tuya saturation
            const adjustedColor = ('color' in payload) ? { h: Math.floor(payload.color.h), s: Math.floor(payload.color.s * 2.55) } : this.color;

            // allow for white mode when low saturation
            const adjustedMode = (adjustedColor.s <= 25) ? 'white' : 'colour';
            
            if(adjustedMode != this.mode) data[mode] = adjustedMode;

            // set stored color to white if color mode is changed to white
            if(adjustedMode == 'white') { data[brightness] = adjustedBrightness; this.state.color = { h: 0, s: 0 }; }
            else data[color] = this.functions.toTuyaHex(adjustedColor, adjustedBrightness);

            // ignoring light brightness info from tuya in colour mode means setting the state yourself is necessary
            this.state.brightness = adjustedBrightness;

            // if(this.useV2) console.log(`SETTING DEVICE WITH BRIGHTNESS ${adjustedBrightness}, USING RANGE(${this.minBrightness}, ${this.maxBrightness})`);

            this.device.set({
                multiple: true,
                data: data
            });
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
        const stateData = {
            state: this.on ? "ON" : "OFF",
            brightness: Math.round((this.brightness - this.minBrightness) * 255 / (this.maxBrightness - this.minBrightness)), // scale to HA brightness from Tuya brightness
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
            name: null, //this.deviceName,
            unique_id: this.deviceId,
            platform: "mqtt",
            schema: "json",

            device: {
                name: this.deviceName,
                manufacturer: "Tuya",
                model: "RGB Light",
                identifiers: this.deviceId,
            },

            state_topic: this.mqttStateTopic,
            command_topic: this.mqttCommandTopic,
            availability_topic: this.mqttAvailabilityTopic,

            brightness: true,            
            color_mode: true,
            supported_color_modes: ["hs"],
        };

        client.publish(configTopic, JSON.stringify(configData), { retain: true });
    }
}

module.exports = MqttRGBLight;