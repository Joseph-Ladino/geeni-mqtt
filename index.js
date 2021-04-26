const { readFileSync } = require("fs");

// const TuyaDevice = require("./tuyaDevices");
const MqttDevices = require("./mqttDevices");
const MqttClient = MqttDevices.client;
const myDevices = JSON.parse(readFileSync("./my_devices.conf"));
const {Plug, Switch, Switch3Way} = MqttDevices;
const {RGBLight} = require("./tuyaDevices");

var mainLights = new Switch(myDevices.mainLights.id, myDevices.mainLights.key, "main lights", true);
var overheadLights = new Switch(myDevices.overheadLights.id, myDevices.overheadLights.key, "overhead lights", true);

var monitorPlug = new Plug(myDevices.monitor.id, myDevices.monitor.key, "monitor", true);
var fanPlug = new Plug(myDevices.fan.id, myDevices.fan.key, "fan", true);

var jamesLights = new Switch3Way(
    myDevices.jamesSwitch1.id,
    myDevices.jamesSwitch1.key,
    myDevices.jamesSwitch2.id, 
    myDevices.jamesSwitch2.key, 
    "james lights",
    true
);

var lamp = new RGBLight(myDevices.lamp.id, myDevices.lamp.key);

function main() {
    // jamesLights.connect();
    // mainLights.connect();
    // fanPlug.connect();
    // monitorPlug.connect();
    // overheadLights.connect();

    async function wait(ms) {
        return new Promise(res => setTimeout(res, 2000));
    }

    lamp.connect()
        .then(_ => lamp.turnOn())
        .then(_ => lamp.setBrightness(255))
        .then(_ => lamp.setMode('white'))
        .then(_ => wait(200))
        .then(_ => lamp.setColor({ h: 256, s: 0.92 * 255, v: 125 }))
        .then(_ => lamp.setMode('colour'))
        .then(_ => wait(500))
        .then(_ => lamp.setMode('white'))
        .then(_ => wait(2000))
        .then(_ => lamp.turnOff());
}

MqttClient.on('connect', _ => main());