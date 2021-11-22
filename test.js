const { readFileSync } = require("fs");

const TuyaDevices = require("./tuyaDevices");
const MqttDevices = require("./mqttDevices");
const MqttClient = MqttDevices.client;

const myDevices = JSON.parse(readFileSync("./my_devices.conf"));

var robovac = new MqttDevices.Ionvac(myDevices.robovac.id, myDevices.robovac.key, "robovac");

var devices = [
    robovac
]

async function main() {
    devices = devices.map(d => d.connect());

    await Promise.all(devices);
}

MqttClient.on("connect", _ => main());