const { readFileSync } = require("fs");
const { client } = require("./mqttDevices");

const TuyaDevices = require("./tuyaDevices");
const MqttDevices = require("./mqttDevices");
const MqttClient = MqttDevices.client;
const myDevices = JSON.parse(readFileSync("./my_devices.conf"));
const {Plug, Switch, Switch3Way, RGBLight, Ionvac} = MqttDevices;
client.setMaxListeners(25);

var devicesO = {
    // mainLights: new Switch(myDevices.mainLights.id, myDevices.mainLights.key, "main lights", true),
    // jamesLights: new Switch3Way(
    //     myDevices.jamesSwitch1.id,
    //     myDevices.jamesSwitch1.key,
    //     myDevices.jamesSwitch2.id, 
    //     myDevices.jamesSwitch2.key, 
    //     "james lights",
    //     true
    // ),
    // overheadLights: new Switch(myDevices.overheadLights.id, myDevices.overheadLights.key, "overhead lights", true),
    // jamesLamp: new RGBLight(myDevices.jamesLamp.id, myDevices.jamesLamp.key, "night light", false,  true),
    // dadLamp: new RGBLight(myDevices.deskLamp.id, myDevices.deskLamp.key, "dad lamp", false, true),
    // lamp: new RGBLight(myDevices.lamp.id, myDevices.lamp.key, "lamp", false, true),
    // monitorPlug: new Plug(myDevices.monitor.id, myDevices.monitor.key, "monitor", true),
    // fanPlug: new Plug(myDevices.fan.id, myDevices.fan.key, "fan", true),
    // robovac: new Ionvac(myDevices.robovac.id, myDevices.robovac.key, "robovac", true),
    // tempPlug1: new Plug(myDevices['tempPlug1'].id, myDevices['tempPlug1'].key, "temp plug 1", true),
    // chargingStation: new Plug(myDevices.chargingStation.id, myDevices.chargingStation.key, "charging station", true),
    downstairsLamp: new RGBLight(myDevices.downstairsLamp.id, myDevices.downstairsLamp.key, "downstairs lamp", true, true),
    // jamesBed: new RGBLight(myDevices.jamesBed.id, myDevices.jamesBed.key, "james bed", true, true),
}

async function main() {
    for(let d in devicesO) await devicesO[d].connect();
}

MqttClient.on('connect', _ => main());