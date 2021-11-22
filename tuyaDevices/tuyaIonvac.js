const TuyaGeneric = require("./generic");

const clamp = require("./tuyaRGBLight").clamp;

class TuyaIonvac extends TuyaGeneric {
    constructor(deviceId, deviceKey, deviceName = null) {
        super(deviceId, deviceKey, deviceName);

        this.device.on('dp-refresh', (data, commandByte, packetN) => this.onDataRefresh(data, commandByte, packetN));

        this.dpsMap = {
            '2': "on",
            '3': "mode",
            '4': "manual_direction",
            '5': "status", 
            '6': "battery",
            '7': "edge_brush_health",
            '8': "roll_brush_health",
            '9': "filter_health",
            '13': "seek",
            '14': "suction",
            '15': "clean_record",
            '16': "clean_area",
            '17': "clean_time",
            '18': "fault",
            '19': "tbd", // unknown dps
            '20': "mop_cistern",
            '101': "do_not_disturb",
            '119': "carpet_boost",
            '122': "volume"
        }

        this.modeMap = ["standby", "smart", "wall_follow", "spiral", "chargego", "random"];
        this.directionMap = ["forward", "backward", "turn_left", "turn_right", "stop"];
        this.statusMap = ["standby", "cleaning", "goto_charge", "charging", "charge_done", "smart_clean", "wall_clean", "spot_clean", "sleep"];
        this.suctionMap = ["gentle", "normal", "strong", "max"];
        this.cisternMap = ["low", "middle", "high"];

        this.state = { 
            available: false, 
            on: false,
            mode: "standby",
            manual_direction: "stop", // stop if not being manually controlled
            status: "charging",
            battery: 100,
            edge_brush_health: 100,
            roll_brush_health: 100,
            filter_health: 100,
            seek: false,
            suction: "normal",
            clean_record: "",
            clean_area: 0,
            clean_time: 0,
            fault: 0, // TODO: parse fault bitmap
            mop_cistern: "middle",
            do_not_disturb: false,
            carpet_boost: true,
            volume: 50,
            tbd: "", // idk what this is
        };
    }

    get on() { return this.state.on; }
    get mode() { return this.state.mode; }
    get manual_direction() { return this.state.manual_direction; }
    get status() { return this.state.status; }
    get battery() { return this.state.battery; }
    get suction() { return this.state.suction; }
    get clean_time() { return this.state.clean_time; }
    get volume() { return this.state.volume; }

    onData(data) {
        for(let d in data.dps) {
            this.state[this.dpsMap[d]] = data.dps[d];
        }
    }

    onDataRefresh(data) {
        this.onData(data);
    }

    validateValue(val, arr) {
        if(arr.indexOf(val) > -1) return true;

        console.error(`${val} not a valid value`);
        
        return false;
    }

    async set(dps, value) {
        return this.device.set({"dps": dps, "set": value});
    }

    // [true, false]
    async setPower(on) {
        return this.set('2', Boolean(on));
    }

    // ["standby", "smart", "wall_follow", "spiral", "chargego", "random"]
    async setMode(mode) {
        if(!this.validateValue(mode, this.modeMap)) return;

        return this.set('3', mode);
    }

    // ["forward", "backward", "turn_left", "turn_right", "stop"]
    async setManualDirection(direction) {
        if(!this.validateValue(direction, this.directionMap));

        this.set('4', cistern);
    }

    // [true, false]
    async setSeek(on) {
        return this.set('13', Boolean(on));
    }

    // ["gentle", "normal", "strong"]
    async setSuction(suction) {
        if(!this.validateValue(suction, this.suctionMap)) return;

        return this.set('14', suction);
    }

    // ["low", "middle", "high"]
    async setCistern(cistern) {
        if(!this.validateValue(cistern, this.cisternMap)) return;
        
        return this.set('20', cistern);
    }

    // [true, false]
    async setDoNotDisturb(on) {
        return this.set('101', Boolean(on));
    }

    // [true, false]
    async setCarpetBoost(on) {
        return this.set('119', Boolean(on));
    }

    // [0...100]
    async setVolume(volume) {
        volume = clamp(Math.floor(Number(volume)), 0, 100);

        return this.set('122', volume);
    }
}

module.exports = TuyaIonvac;