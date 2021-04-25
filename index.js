const { readFileSync } = require("fs");

// const TuyaDevice = require("./tuyaDevices");
const MqttDevice = require("./mqttDevices");
const myDevices = JSON.parse(readFileSync("./my_devices.conf"));

const Switch = MqttDevice.Switch;
const Switch3 = MqttDevice.Switch3Way;

var mainLights = new Switch(myDevices.mainLights.id, myDevices.mainLights.key, "main_lights", true);

var jamesLights = new Switch3(
    myDevices.jamesSwitch1.id,
    myDevices.jamesSwitch1.key,
    myDevices.jamesSwitch2.id, 
    myDevices.jamesSwitch2.key, 
    "james_lights",
    true
);

function test() {
    mainLights.connect();
    jamesLights.connect();
}

test();