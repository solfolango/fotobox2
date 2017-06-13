var fs = require('fs');
var moment = require('moment');
const EventEmitter = require('events');
const config = require(__base + '/config');


class GPhoto extends EventEmitter {

    constructor() {
      super();
      this.virtualCamPath = __dirname + '/virtualcam/';
    }

    capture() {
        fs.readdir(this.virtualCamPath, function(err, files) {
            var filename = files[Math.floor(Math.random() * files.length)];
            console.log('gphoto2: Captured: ' + filename);

            var src = this.virtualCamPath + filename;
            var dest = config.app.path.input;

            var destFile = moment().format("YYYYMMDD-hhmmss") + '.jpg';
            var target =  dest + destFile;

            console.log("Copy " + src + " => " + dest + " as " + destFile);

            let readStream = fs.createReadStream(src);

            readStream.once('error', (err) => {
                console.log(err);
            });

            readStream.once('end', () => {
                this.emit(config.event.camera.captureDone, destFile);
            });

            readStream.pipe(fs.createWriteStream( target));
        }.bind(this));
    }
}


module.exports = new GPhoto();