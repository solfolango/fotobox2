const EventEmitter = require('events');
var GPIO = require(__base + '/server/mocks/onoff');
const config = require(__base + '/config');

class Buzzer extends EventEmitter {
    constructor() {
        super();
        this.gpio = new GPIO(24, 'in', 'both');
        this.LONG_PRESS = 500;
        this.startTime = null;
        this.duration = null;
    }

    watchFunction(err, value) {
        if (value === 0) {
            this.startPress();
        } else {
            this.stopPress();
        }
    }

    watch() {
        console.log("Watching buzzer");
        this.gpio.watch(this.watchFunction.bind(this));
    }

    unwatch() {
        console.log("Unwatching buzzer");
        this.gpio.unwatch(this.watchFunction.bind(this));
    }

    startPress() {
        this.emit('START_PRESS');
        this.startTime = Date.now();
    }

    stopPress() {
        this.duration = Date.now() - this.startTime;
        this.emit(config.event.buzzer.stopPress, this.duration);
    }
}

module.exports = new Buzzer();