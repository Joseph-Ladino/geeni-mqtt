const { readFileSync } = require("fs");
const mqtt = require("mqtt");
const broker = JSON.parse(readFileSync("./mqtt_broker.conf"));
const client = mqtt.connect(broker.host, {
    username: broker.user,
    password: broker.pass,
    clientId: broker.clientId,
});

client.HAStatusTopic = "homeassistant/status";
client.subscribe(client.HAStatusTopic);

client.on("connect", _ => console.log("CONNECTED TO MQTT BROKER"));
client.on('error', console.log);

module.exports = client;