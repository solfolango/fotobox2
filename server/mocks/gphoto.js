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
        return new Promise(function (resolve, reject) {
            fs.readdir(this.virtualCamPath, function(err, files) {
                var filename = files[Math.floor(Math.random() * files.length)];

                var src = this.virtualCamPath + filename;
                var dest = config.app.path.input;

                var destFile = moment().format("YYYYMMDD-hhmmss") + '.jpg';
                var target =  dest + destFile;

                let readStream = fs.createReadStream(src);

                readStream.once('error', (err) => {
                    reject(err);
                });

                readStream.once('end', () => {
                    resolve(destFile);
                });


                readStream.pipe(fs.createWriteStream(target));
            }.bind(this));
        }.bind(this));
        
    }
}


module.exports = new GPhoto();