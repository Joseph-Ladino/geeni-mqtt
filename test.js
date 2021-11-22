const { readFileSync } = require("fs");

const TuyaDevices = require("./tuyaDevices");
const MqttDevices = require("./mqttDevices");
const MqttClient = MqttDevices.client;

const myDevices = JSON.parse(readFileSync("./my_devices.conf"));

var robovac = new MqttDevices.Ionvac(myDevices.robovac.id, myDevices.robovac.key, "robovac");
var jamesBed = new TuyaDevices.RGBLight(myDevices.jamesBed.id, myDevices.jamesBed.key, "gamer bed", true);
var lamp = new MqttDevices.RGBLight(myDevices.lamp.id, myDevices.lamp.key, "lamp", false);

jamesBed.dpsMap.power = "20";
jamesBed.dpsMap.mode = "21";
jamesBed.dpsMap.brightness = "22";
jamesBed.dpsMap.color = "24";

jamesBed.minBrightness = 10;
jamesBed.maxBrightness = 1000;

var devices = [
    // robovac,
    jamesBed,
    lamp
]

async function main() {
    devices = devices.map(d => d.connect());

    await Promise.all(devices);

    // await jamesBed.turnOn();
    // await jamesBed.turnOff();
    // await jamesBed.turnOn();
}

MqttClient.on("connect", _ => main());