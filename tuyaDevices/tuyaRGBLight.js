const TuyaSwitch = require("./tuyaSwitch");

// INCOMPLETE, TODO: FINISH


// h(0 - 360), s(0 - 255), v(0 - 255)
// "borrowed" from https://github.com/TheAgentK/tuya-mqtt/blob/b7fc73de3c0d9a7d636df59047ba243cca6ce7f3/devices/tuya-device.js#L493
function hsvToRgb(h, s, v) {
    h /= 60;
    s /= 255;

    const
        i = Math.floor(h),
        f = h - i,
        p = v * (1 - s),
        q = v * (1 - s * f),
        t = v * (1 - s * (1 - f));

    switch (i % 6) {
        case 0:
            return [v, t, p];
        case 1:
            return [q, v, p];
        case 2:
            return [p, v, t];
        case 3:
            return [p, q, v];
        case 4:
            return [t, p, v];
        case 5:
            return [v, p, q];
    }
}

function toTuyaHex(color, brightness) {
    const rgb = hsvToRgb(color.h, color.s, brightness).map(c => Math.floor(c).toString(16).padStart(2, '0')).join('');
    const hsv = color.h.toString(16).padStart(4, '0') + color.s.toString(16).padStart(2, '0') + brightness.toString(16).padStart(2, '0');

    return rgb + hsv;
}

function extractHueSat(str) {
    return {
        h: parseInt(str.substr(6, 4), 16), // note to self: 360 > 255 meaning hue takes 2 bytes or 4 hex chars
        s: parseInt(str.substr(10, 2), 16),
    }
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

class RGBLight extends TuyaSwitch {
    constructor(deviceId, deviceKey, name = null) {
        super(deviceId, deviceKey, name);
        
        this.device.on('dp-refresh', data => this.onRefresh(data));

        this.state = { 
            available: false,
            on: false,
            brightness: 25, // min brightness 25
            mode: 'white',
            color: { h: 0, s: 0 }
        }
    }

    get brightness() {
        return this.state.brightness;
    }

    get mode() {
        return this.state.mode;
    }
    
    get color() {
        return this.state.color;
    }

    get hsv() {
        return { h: this.state.color.h, s: this.state.color.s, v: this.brightness };
    }

    async setBrightness(val) {
        val = clamp(Math.floor(val), 25, 255);

        if(val == this.brightness) return;

        return this.device.set({ dps: 3, set: val });
    }

    async setMode(mode) {
        mode = mode.toLowerCase();
        
        if(mode == this.mode) return;
        else if(mode != 'colour' && mode != 'white') return console.log(`${this.deviceName} INVALID COLOR MODE: ${mode}`);

        return this.device.set({ dps: 2, set: mode });
    }

    async setColor(col) {
        if('v' in col) await this.setBrightness(col.v);
        
        col.h = clamp(Math.floor(col.h), 0, 360);
        col.s = clamp(Math.floor(col.s), 0, 255);

        if(this.mode == 'colour' && col.h == this.state.color.h && col.s == this.state.color.s) return;

        return this.device.set({ dps: 5, set: toTuyaHex(col, this.brightness) });
    }

    // TODO: test the set functions

    onDisconnected() {
        console.log(`${this.deviceName}: DISCONNECTED FROM LIGHT`);
    }

    onConnected() {
        console.log(`${this.deviceName}: CONNECTED TO LIGHT`);
    }

    onRefresh(data) {
        const dps = data.dps;

        if('2' in dps) this.state.mode = dps['2'];
        if('3' in dps) this.state.brightness = dps['3'];

        // prevent sending color data on first get
        if('5' in dps && this.mode == 'colour') this.state.color = extractHueSat(dps['5']); 
    }

    onData(data, cmd) {
        this.state.on = data.dps['1'];

        // cmd == 10 is true on first call after connect
        if(cmd == 10) this.onRefresh(data);
    }
}


module.exports = RGBLight;
module.exports.toTuyaHex = toTuyaHex;