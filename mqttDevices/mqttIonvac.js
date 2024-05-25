const client = require("./mqttClient");
const TuyaIonvac = require("../tuyaDevices/tuyaIonvac");

class MqttIonvac extends TuyaIonvac {
    constructor(deviceId, deviceKey, deviceName = null, discover = false) {
        super(deviceId, deviceKey, deviceName);
        
        this.mqttIcon = "mdi:robot-vacuum";
        this.mqttBaseTopic = `homeassistant/vacuum/${this.deviceName.replace(/ /g, "_")}`;
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

    handleMqttSendCommand(payload) {
        // if it can be parsed as json, it has parameters
        let json;
        try {
            json = JSON.parse(payload);
        } catch {
            json = { "command": payload }; 
        }

        // [set_volume(volume=int), set_dnd(dnd=bool), set_carpet_boost(boost=bool)]
        switch(json.command) {
            case "set_volume":
                let volume = parseInt(json.volume);
                this.setVolume(volume);
                break;

            case "set_dnd":
            case "set_do_not_disturb":
                let dnd = Boolean(json.dnd) || Boolean(json.do_not_disturb);
                this.setDoNotDisturb(dnd);
                break;

            case "set_boost":
            case "set_carpet_boost":
                let boost = Boolean(json.boost) || Boolean(json.carpet_boost);
                this.setCarpetBoost(boost);
                break;

            case "clean_mode":
                this.setMode(json.mode);
                break;

            default:
                console.log(`${this.deviceName}: UNKNOWN SEND_COMMAND: ${json}`);
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

            case this.mqttSendCommandTopic:
                this.handleMqttSendCommand(msg);                
                break;
        }
    }

    publishMqttAvailability() {
        client.publish(this.mqttAvailabilityTopic, this.available ? "online" : "offline");
    }

    publishMqttAttributes() {
        let attr = {
            volume: this.volume,
            do_not_disturb: this.state.do_not_disturb,
            carpet_boost: this.state.carpet_boost,
            filter_health: this.state.filter_health,
            edge_brush_health: this.state.edge_brush_health,
            roll_brush_health: this.state.roll_brush_health,

            supported_custom_commands: ["set_volume", "set_dnd", "set_boost", "clean_mode"],
        };

        client.publish(this.mqttAttributesTopic, JSON.stringify(attr), { retain: true });
    }

    publishMqttState() {
        let state = {
            battery_level: this.battery,
            fan_speed: this.speedConvMap[this.suction],
            state: this.state.fault == 0 ? this.stateConvMap[this.status] : "error",
        };

        client.publish(this.mqttStateTopic, JSON.stringify(state));

        this.publishMqttAttributes();
    }

    publishMqttDiscovery() {
        const configTopic = this.mqttBaseTopic + "/config";

        const configData = {
            platform: "mqtt",
            schema: "state",
            name: null, //this.deviceName,
            unique_id: this.deviceId,
            icon: this.mqttIcon,
            
            state_topic: this.mqttStateTopic,
            command_topic: this.mqttCommandTopic,
            availability_topic: this.mqttAvailabilityTopic,
            send_command_topic: this.mqttSendCommandTopic,
            set_fan_speed_topic: this.mqttSetFanSpeedTopic,
            json_attributes_topic: this.mqttAttributesTopic,
            json_attributes_template: "{{ value_json | tojson }}",

            device: {
                name: this.deviceName,
                manufacturer: "Ionvac",
                model: "Smartclean v4",
                identifiers: this.deviceId,
            },

            fan_speed_list: ["min", "medium", "high", "maximum"],
            supported_features: ["start", "stop", "pause", "return_home", "battery", "status", "locate", "clean_spot", "fan_speed", "send_command"],
        };

        client.publish(configTopic, JSON.stringify(configData), { retain: true });
    }
}

module.exports = MqttIonvac;