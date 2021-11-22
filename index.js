const { readFileSync } = require("fs");

const TuyaDevice = require("./tuyaDevices");
const MqttDevices = require("./mqttDevices");
const MqttClient = MqttDevices.client;
const myDevices = JSON.parse(readFileSync("./my_devices.conf"));
const {Plug, Switch, Switch3Way, RGBLight} = MqttDevices;


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

var lamp = new RGBLight(myDevices.lamp.id, myDevices.lamp.key, "lamp", true);
var dadLamp = new RGBLight(myDevices.deskLamp.id, myDevices.deskLamp.key, "dad lamp", true);
var jamesLamp = new RGBLight(myDevices.jamesLamp.id, myDevices.jamesLamp.key, "night light", true);

var robovac = new TuyaDevice.Ionvac(myDevices.robovac.id, myDevices.robovac.key, "robovac");

var devices = [
    // jamesLights,
    // mainLights,
    // overheadLights,
    // jamesLamp,
    // dadLamp,
    // lamp,
    // monitorPlug,
    // fanPlug
    robovac
]

function main() {
    for(var d of devices) {
        d.connect();
    }
}

MqttClient.on('connect', _ => main());