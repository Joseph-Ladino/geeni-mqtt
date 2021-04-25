const TuyaGeneric = require("./generic");

// INCOMPLETE, TODO: FINISH

class RGBLight extends TuyaGeneric {
    constructor(deviceId, deviceKey) {
        super(deviceId, deviceKey);
    }

    onConnected() {
        console.log(`CONNECTED TO LIGHT WITH ID ${this.deviceId}`);
    }
}


module.exports = RGBLight;