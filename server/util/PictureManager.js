var fs = require('fs');
var probe = require('probe-image-size');
var _ = require('lodash');

var config = require(__base + '/config');
var logger = require(__base + '/server/util/Logger');

class PictureManager {

    constructor() {
        this.pictures = [];
        
        // read all images from the input directory
        var files = fs.readdirSync(config.app.path.output);
        for (var i = 0; i < files.length; i++) {
            if (files[i].toLowerCase().endsWith('.jpg') || files[i].toLowerCase().endsWith('.jpeg') || files[i].toLowerCase().endsWith('.png'))
            this.addPictureFromFS(files[i]);
        }

    }

    addPictureFromFS(filename) {
        probe(fs.createReadStream(config.app.path.output + filename))
        .then(function(result) {
            console.log(result);
            var fileInfo = {
                    path: path.dirname(filePath), 
                    name: path.posix.basename(filePath),
                    extension: path.extension(filePath),
                    width: result.width, 
                    height: result.height, 
                    url: config.app.server.protocol + '://' + config.app.server.hostname + ':' + config.app.server.port + '/' + config.app.server.url.output + '/' + path.posix.basename(filePath)  
                };
            this.addImage(fileInfo);
            // terminate input, depends on stream type,
            // this example is for fs streams only.
            input.destroy();
        }.bind(this));
    }

    addNewPicture(fileInfo) {
        if (fileInfo === null || fileInfo.filename === undefined || fileInfo.width === undefined || fileInfo.height === undefined) {
            logger.log('error', 'ImageStore.addImage: Cannot read fileInfo: ' + fileInfo);
            return undefined;
        }

        // if the last ones are missing, it's okay, we will generate them
        if (fileInfo.path === undefined) { fileInfo.path = config.app.path.output }
        if (fileInfo.url === undefined) { fileInfo.url = config.app.server.protocol + '://' + config.app.server.hostname + ':' + config.app.server.port + '/' + config.app.server.url.output + '/' + fileInfo.filename }

        this.pictures.push(fileInfo);
        
        return fileInfo;
    }

    getRandomPicture(currentPicture = '') {
        // cut the path
        var urlPath = config.app.server.protocol + '://' + config.app.server.hostname + ':' + config.app.server.port + '/' + config.app.server.url.output + '/';

        if (currentImage.indexOf(urlPath) !== -1) {
            currentPicture = currentPicture.substring(urlPath.length);
        }

        // returning undefined if no pictures are taken yet
        if (this.pictures.length === 0) {
            return undefined;
        }

        if (this.pictures.length === 1) {
            // return the first and only picture again
            return this.pictures[0];
        } else {
            // return a random picture
            return _(this.pictures)
                .filter(function(fileInfo) {
                    return fileInfo.filename !== currentPicture
                })
                .sample();
        }
    }
}

module.exports = new PictureManager();