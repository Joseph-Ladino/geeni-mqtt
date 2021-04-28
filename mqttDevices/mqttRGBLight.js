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
            
            // state is always sent
            var data = { '1': payload.state == "ON" };
            
            // map HA brightness to Tuya brightness 
            const adjustedBrightness = ('brightness' in payload) ? TuyaRGBLight.clamp(Math.floor((payload.brightness) * 230 / 255 + 25), 25, 255) : this.brightness;
            
            // map HA saturation to Tuya saturation
            const adjustedColor = ('color' in payload) ? { h: Math.floor(payload.color.h), s: Math.floor(payload.color.s * 2.55) } : this.color;
            
            // allow for white mode when low saturation
            const adjustedMode = (adjustedColor.s < 26) ? 'white' : 'colour';
            

            if(adjustedMode != this.mode) data['2'] = adjustedMode;

            // set stored color to white if color mode is changed to white
            if(adjustedMode == 'white') { data['3'] = adjustedBrightness; this.state.color = { h: 0, s: 0 }; }
            else data['5'] = TuyaRGBLight.toTuyaHex(adjustedColor, adjustedBrightness);

            // ignoring light brightness info from tuya in colour mode means setting the state yourself is necessary
            this.state.brightness = adjustedBrightness;

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
        client.publish(this.mqttAvailabilityTopic, this.available ? "online" : "offline");
    }

    publishMqttState() {
        const stateData = {
            state: this.on ? "ON" : "OFF",
            brightness: (this.brightness - 25) * 255 / 230, // scale to HA brightness from Tuya brightness
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