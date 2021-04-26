const TuyaSwitch = require("./tuyaSwitch");

// INCOMPLETE, TODO: FINISH

class RGBLight extends TuyaSwitch {
    constructor(deviceId, deviceKey) {
        super(deviceId, deviceKey);
    }

    onConnected() {
        console.log(`CONNECTED TO LIGHT WITH ID ${this.deviceId}`);
    }
}


module.exports = RGBLight;