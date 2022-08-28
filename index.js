const { readFileSync } = require("fs");
const { client } = require("./mqttDevices");

// const TuyaDevice = require("./tuyaDevices");
const MqttDevices = require("./mqttDevices");
const MqttClient = MqttDevices.client;
// const myDevices = JSON.parse(readFileSync("./my_devices.conf"));
const myDevices = JSON.parse(readFileSync("./my_devices_r2.conf"));
const { Plug, Switch, Switch3Way, RGBLight, Ionvac } = MqttDevices;

client.setMaxListeners(25);

var devices = {};
var discover = false;
// constructs objects for devices with generic constructor
function loadDevicesJSONGeneric(data, type) {
    let DeviceClass;
    switch (type) {
        case "switches":
            DeviceClass = Switch;
            break;

        case "plugs":
            DeviceClass = Plug;
            break;

        case "ionvac":
            DeviceClass = Ionvac;
            break;

        // exit for all other types
        default:
            return;
    }

    for (let d in data[type]) {
        let dv = data[type][d];

        devices[d] = new DeviceClass(dv.id, dv.key, d, true);
    }
}

// construct objects from data.[type].[device name]
function loadDevicesFromJSON2(data) {

    loadDevicesJSONGeneric(data, "plugs");
    loadDevicesJSONGeneric(data, "switches");
    loadDevicesJSONGeneric(data, "ionvac");

    for (let s3 in data.switches3) {
        let sw3 = data.switches3[s3];
        devices[s3] = new Switch3Way(sw3[0].id, sw3[0].key, sw3[1].id, sw3[1].key, s3, discover);
    }

    for (let l in data.lights) {
        let lt = data.lights[l];
        
        // creates v2 light if "v2" prop is in config and it's set to true
        devices[l] = new RGBLight(lt.id, lt.key, l, ("v2" in lt && lt.v2 === true), discover);
    }
}

loadDevicesFromJSON2(myDevices);

function main() {
    for (let d in devices) devices[d].connect();
}

MqttClient.on('connect', _ => main());