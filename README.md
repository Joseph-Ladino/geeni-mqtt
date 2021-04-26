# Geeni Mqtt
This library(?) uses [TuyAPI](https://github.com/codetheweb/tuyapi) and [mntt](https://github.com/mqttjs/MQTT.js) to control certain Geeni/Merkury devices (and probably other Tuya products but I only own walmart smart products)
I currently only support these [Smart Plugs](https://www.walmart.com/ip/Merkury-Innovations-Smart-Plug-2-Pack/758274409), [Smart Light Switches](https://www.walmart.com/ip/Merkury-Innovations-Smart-Light-Switch-Requires-2-4Ghz-Wifi/685624859), [Smart 3 Way Light Switches](https://www.walmart.com/ip/Merkury-Innovations-3-Way-Light-Switch-Kit-Requires-2-4Ghz-Wifi/761211583), and [Smart Bulbs](https://www.walmart.com/ip/Merkury-Innovations-A21-Smart-Multicolor-LED-Bulb-75W-Dimmable-2-Pack/669037420)

### Why'd you make this, surely there are other libraries?
Well, in my very brief research I didn't find one that I liked, and I had a week off of school and also just felt like making something so here we are

### So why should I use it?
You probably shouldn't, but if you just want questionable boilerplate code that can be somewhat easily extended, this might be the least wrong repo for you

### Alright but how do I use it?
(An example of setting up different devices can be found in index.js)

1. Follow [TuyAPI setup](https://github.com/codetheweb/tuyapi/blob/master/docs/SETUP.md) to get the ID and Localkey of a device
2. (if using mqtt) rename mqtt_broker.conf.template to mqtt_broker.conf and fill in the info
3. Import a class from one of the folders (mqttDevices for controlling through scripts and mqtt, or tuyaDevices for just controlling through scripts)
4. Create an instance, passing the ID and Key in as arguments
5. Call the connect method

Note: When using mqtt, call connect after the mqtt client has connected to the broker, see index.js
