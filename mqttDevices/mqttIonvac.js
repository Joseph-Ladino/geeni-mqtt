const client = require("./mqttClient");
const TuyaIonvac = require("../tuyaDevices/tuyaIonvac");

class MqttIonvac extends TuyaIonvac {
    constructor(deviceId, deviceKey, deviceName = null, discover = false) {
        super(deviceId, deviceKey, deviceName);
        
        this.mqttIcon = "mdi:robot-vacuum";
        this.mqttBaseTopic = `homeassistant/vacuum/${this.deviceName.replace(' ', "_")}`;
        this.mqttStateTopic = this.mqttBaseTopic + "/state";
        this.mqttCommandTopic = this.mqttStateTopic + "/set";
        this.mqttSendCommandTopic = this.mqttStateTopic + "/send";
        this.mqttAttributesTopic = this.mqttBaseTopic + "/available";
        this.mqttSetFanSpeedTopic = this.mqttCommandTopic + "/speed";
        this.mqttAvailabilityTopic = this.mqttStateTopic + "/available";

        this.speedConvMap = {
            gentle: "min",
            normal: "medium",
            strong: "high",
            max: "maximum"
        };

        this.stateConvMap = {
            standby: "paused",
            sleep: "idle",
            goto_charge: "returning",
            charging: "docked",
            charge_done: "docked",
            cleaning: "cleaning",
            smart_clean: "cleaning",
            wall_clean: "cleaning",
            spot_clean: "cleaning"
        }


        client.subscribe(this.mqttCommandTopic);
        client.subscribe(this.mqttSendCommandTopic);
        client.subscribe(this.mqttSetFanSpeedTopic);
        client.on("message", (topic, msg) => this.onMqttMessage(topic, msg));

        if(discover) this.publishMqttDiscovery();
    }

    onDisconnected() {
        console.log(`${this.deviceName}: DISCONNECTED FROM VACUUM`);
    }
    
    onConnected() {
        console.log(`${this.deviceName}: CONNECTED TO VACUUM`);
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
        super.onData(data);

        this.publishMqttState();
    }

    handleMqttCommand(payload) {
        switch(payload){
            case "clean_spot": 
                this.setMode("spiral");
            break;

            case "locate":
                this.setSeek(true);
                break;
            
            case "start":
                this.setMode("smart");
                break;

            case "stop": 
            case "return_to_base":
                this.setMode("chargego");
                break;

            case "pause":
                this.setMode("standby");
                break;
        }
    }

    async onMqttMessage(topic, msg) {
        msg = msg.toString();
        // console.log(topic, msg);

        switch(topic) {
            case this.mqttSetFanSpeedTopic:
                let suctionSpeed = Object.keys(this.speedConvMap)[Object.values(this.speedConvMap).indexOf(msg)];

                this.setSuction(suctionSpeed);
                break;
            
            case this.mqttCommandTopic:
                this.handleMqttCommand(msg);
                break;
        }
    }

    publishMqttAvailability() {
        client.publish(this.mqttAvailabilityTopic, this.available ? "online" : "offline", { retain: true });
    }

    publishMqttState() {
        let state = {
            battery_level: this.battery,
            fan_speed: this.speedConvMap[this.suction],
            state: this.state.fault == 0 ? this.stateConvMap[this.status] : "error",
        };

        client.publish(this.mqttStateTopic, JSON.stringify(state), { retain: true });
    }

    publishMqttDiscovery() {
        const configTopic = this.mqttBaseTopic + "/config";

        const configData = {
            platform: "mqtt",
            schema: "state",
            name: this.deviceName,
            unique_id: this.deviceId,
            icon: this.mqttIcon,
            
            state_topic: this.mqttStateTopic,
            command_topic: this.mqttCommandTopic,
            availability_topic: this.mqttAvailabilityTopic,
            // send_command_topic: this.mqttSendCommandTopic,
            set_fan_speed_topic: this.mqttSetFanSpeedTopic,
            // json_attributes_topic: this.mqttAttributesTopic,

            device: {
                name: this.deviceName,
                identifiers: this.deviceId,
            },

            fan_speed_list: ["min", "medium", "high", "maximum"],
            supported_features: ["start", "stop", "pause", "return_home", "battery", "status", "locate", "clean_spot", "fan_speed", 
            // "send_command"
            ],
        };

        client.publish(configTopic, JSON.stringify(configData), { retain: true });
    }
}

module.exports = MqttIonvac;