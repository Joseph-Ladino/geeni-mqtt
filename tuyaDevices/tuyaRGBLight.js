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


// for rgb lights with v2 dps
function toTuyaHexv2(color, brightness) {
    const scaledSat = Math.floor(color.s * 1000 / 255);
    const hsv = color.h.toString(16).padStart(4, '0') + scaledSat.toString(16).padStart(4, '0') + brightness.toString(16).padStart(4, '0');

    return hsv;
}

function extractHueSatv2(str) {
    return {
        h: parseInt(str.substr(0, 4), 16), // note to self: 360 > 255 meaning hue takes 2 bytes or 4 hex chars
        s: Math.floor(parseInt(str.substr(4, 4), 16) * 255 / 1000),
    }
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

class RGBLight extends TuyaSwitch {
    constructor(deviceId, deviceKey, name = null, useV2 = false) {
        super(deviceId, deviceKey, name);
        
        this.useV2 = useV2;

        this.device.on('dp-refresh', data => this.onRefresh(data));
        
        this.dpsMap = {
                power: "1",
                mode: "2",
                brightness: "3",
                color: "5",
            };

        this.minBrightness = 25;
        this.maxBrightness = 255;

        this.functions = {
            toTuyaHex: toTuyaHex,
            extractHueSat: extractHueSat
        };

        if(useV2) {
            this.dpsMap = {
                power: "20",
                mode: "21",
                brightness: "22",
                color: "24",
            }
            
            this.functions.toTuyaHex = toTuyaHexv2;
            this.functions.extractHueSat = extractHueSatv2;

            this.v1MinBrightness = this.minBrightness;
            this.v1MaxBrightness = this.maxBrightness;

            this.minBrightness = 10;
            this.maxBrightness = 1000;
        }


        this.state = { 
            available: false,
            on: false,
            brightness: this.minBrightness,
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

    // NOTE: setting brightness on dps 3 will change color to white mode
    async setBrightness(val) {
        val = clamp(Math.floor(val), this.minBrightness, this.maxBrightness);

        if(val == this.brightness) return;

        // ignoring light brightness info from tuya in colour mode means setting the state yourself is necessary
        this.state.brightness = val;

        return this.device.set({ dps: this.dpsMap['brightness'], set: val });
    }

    async setMode(mode) {
        mode = mode.toLowerCase();
        
        if(mode == this.mode) return;
        else if(mode != 'colour' && mode != 'white') return console.log(`${this.deviceName} INVALID COLOR MODE: ${mode}`);

        return this.device.set({ dps: this.dpsMap['mode'], set: mode });
    }

    async setColor(col) {
        if('v' in col) await this.setBrightness(!this.useV2 ? col.v : (col.v * this.maxBrightness / this.v1MaxBrightness));
        
        col.h = clamp(Math.floor(col.h), 0, 360);
        col.s = clamp(Math.floor(col.s), 0, 255);

        if(this.mode == 'colour' && col.h == this.state.color.h && col.s == this.state.color.s) return;

        return this.device.set({ dps: this.dpsMap['color'], set: this.functions.toTuyaHex(col, this.brightness) });
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
        const { mode, brightness, color } = this.dpsMap;

        if(mode in dps) this.state.mode = dps[mode];

        // use stored brightness in colour mode
        if(brightness in dps && this.mode == 'white') this.state.brightness = dps[brightness];

        // prevent sending color data on first get
        if(color in dps && this.mode == 'colour') this.state.color = this.functions.extractHueSat(dps[color]);
    }

    onData(data, cmd) {
        const { power } = this.dpsMap;

        if(power in data.dps) this.state.on = data.dps[power];

        // cmd == 10 is true on first call after connect
        if(cmd == 10) this.onRefresh(data);
    }
}


module.exports = RGBLight;
module.exports.toTuyaHex = toTuyaHex;
module.exports.clamp = clamp;