var moment = require('moment');
var fs = require('fs');

class TimeLog {

    constructor() {
        // initialize the log path with the current directory
        this.logPath = __dirname;
        this.PREFIX = "TimeLog";

        this.filename = null;
        this.startTime = null;
        this.lastLogTime = null;
    }

    logTo(path) {
        this.logPath = path;
        this.start();
        return this;
    }

    start() {
        // set the filename for this session
        this.filename = this.PREFIX + "-" + moment().format('HH-mm-ss') + ".log";

        // set the starting time of this session
        this.startTime = this.lastLogTime = new Date();

        // Header line
        this.append("-- " + moment(this.startTime).format("HH:mm:ss") + " -----------------------------------------\n");
    }

    reset() {
        this.start();
    }

    log(message) {
        this.append(this.createLogEntry(message));
    }

    append(message) {
        fs.appendFile(this.logPath + this.filename, message, function (err) {
            if (err) throw err;
        });
    }

    createLogEntry(message) {

        var formatTime = function(date) {
            return (date / 1000).toFixed(3);
        }

        var pad = function(str, length, char) {
            char = char || '0';
            str = str + '';
            return str.length >= length ? str : new Array(length - str.length + 1).join(char) + str;
        }

        // calculate time elapsed since start and since last logged action
        const now = new Date();
        var elapsedFromStart = pad(formatTime(now - this.startTime), 8, '0');
        var elapsedSinceLast = pad(formatTime(now - this.lastLogTime), 8, '0');

        // set the last logged action to the one logged right now
        this.lastLogTime = now;

        // return the formatted string for the logfile
        return moment(now).format("HH:mm:ss") + " (+" + elapsedFromStart + " | +" + elapsedSinceLast + "): " + message + "\n";
    }
}

module.exports = new TimeLog();