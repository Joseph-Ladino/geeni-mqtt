const { readFileSync } = require("fs");
const mqttDevices = require("./mqttDevices");

// const TuyaDevice = require("./tuyaDevices");
const MqttDevice = require("./mqttDevices");
const myDevices = JSON.parse(readFileSync("./my_devices.conf"));

const Plug = MqttDevice.Plug;
const Switch = MqttDevice.Switch;
const Switch3 = MqttDevice.Switch3Way;

var mainLights = new Switch(myDevices.mainLights.id, myDevices.mainLights.key, "main lights", true);
var overheadLights = new Switch(myDevices.overheadLights.id, myDevices.overheadLights.key, "overhead lights", true);

var monitorPlug = new Plug(myDevices.monitor.id, myDevices.monitor.key, "monitor", true);
var fanPlug = new Plug(myDevices.fan.id, myDevices.fan.key, "fan", true);

var jamesLights = new Switch3(
    myDevices.jamesSwitch1.id,
    myDevices.jamesSwitch1.key,
    myDevices.jamesSwitch2.id, 
    myDevices.jamesSwitch2.key, 
    "james lights",
    true
);

async function test() {
    mainLights.connect();
    jamesLights.connect();
    monitorPlug.connect();
    overheadLights.connect();
    fanPlug.connect();
}

MqttDevice.client.on('connect', _ => test());