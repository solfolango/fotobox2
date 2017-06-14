var sharp = require('sharp');
var moment = require('moment');

var logger = require(__base + '/server/util/Logger');
var config = require(__base + '/config');


class ComposeManager {

    constructor() {
        this.buffer = null;
        this.design = null;
    }



    init(design) {
        this.design = design;

        // clear an existing buffer
        this.buffer = null;

        /* EXAMPLE DESIGN
            var design = {
                name: basename,
                document: {
                    width: viewBox[2],
                    height: viewBox[3]
                },
                background: {
                    path: config.app.path.designs.background + basename + '.png',
                    url: urlHelper.generate(config.app.server.url.background + '/' + basename + '.png')
                },
                areas: [],
                overlay: {
                    path: config.app.path.designs.overlay + basename + '.png',
                    url: urlHelper.generate(config.app.server.url.overlay + '/' + basename + '.png')
                },
            };
        */

        // load the background buffer
        this.buffer = sharp(this.design.background.path).raw().toBuffer()
            .catch(function(reason) {
                logger.log('warn', "No or erranous background for " + this.design.name + " (" + this.design.background.path + ') found, using transparent background instead.', reason);
                // using a transparent background instead
                this.buffer = Buffer.alloc(this.design.document.width * this.design.document.height * 4, config.app.composer.default.background);
            }.bind(this));

    }

    add(file, index) {
        try {

            console.log("Adding " + file + " to area " + index);
            console.log("+++++++++++");

            // load the image and resize/rotate/cutout according to the design.areas[index]
            var pictureBuffer = sharp(config.app.path.input + file)
                .rotate(180)
                .resize(this.design.areas[index].width, this.design.areas[index].height)            // change size to viewport
                                                                                            // rotate (was rotate(180))
                .overlayWith(new Buffer(this.design.areas[index].cutout), { cutout: true })         // apply the cutout
                .raw()
                .toBuffer()
                .catch(function(reason) {
                    logger.error(reason);
                });

            // temporary: show picturebuffer
            pictureBuffer.then(function(data) {
                var fname = __base + '/server/_ressources/pictures/part' + index + '.png';
                console.log("Writing part to " + fname);
                sharp(data, {raw: { width: this.design.areas[index].width, height: this.design.areas[index].height, channels: 4}}).toFile(fname);
            }.bind(this));

            return Promise.all([this.buffer, pictureBuffer])
                .then(function(buffers) {
                    // The options for the base image
                    var baseRawOptions = {
                        raw: {
                            width: this.design.document.width, 
                            height: this.design.document.height, 
                            channels: 4
                        }
                    };

                    // The options for the processed capture, including the top/left translation
                    var overlayRawOptions = {
                        raw: {
                            width: this.design.areas[index].width, 
                            height: this.design.areas[index].height, 
                            channels: 4
                        },
                        top: this.design.areas[index].y,
                        left: this.design.areas[index].x
                    };

                    // Compose both
                    // return a promise 
                    console.log("Applying picture to this.buffer");
                    return this.buffer = sharp(buffers[0], baseRawOptions ) //, {raw:{ width: this.definition.document.width, height: this.definition.document.height, channels: 4}})
                        .overlayWith(buffers[1], overlayRawOptions )
                        .raw()
                        .toBuffer();
                    

                }.bind(this))
                .catch(function(result) {
                    logger.log('error', result);
                });
        } catch(error) {
            throw error;
        }
        
    }

    save(callback) {
        var filename = config.app.path.output + moment().format("YYYYMMDD-hhmmss") + '.' + config.app.composer.default.format;

        // Apply the overlay, if it exists
        var overlay = sharp(this.design.overlay.path).raw().toBuffer()
            .catch(function(reason) {
                logger.log('warn', "No or erranous overlay for " + this.design.name + " (" + this.design.overlay.path + ')', reason);
                
                var baseRawOptions = {
                    raw: {
                            width: this.design.document.width, 
                            height: this.design.document.height, 
                            channels: 3 /* 4 */
                        }
                    };

                sharp(this.buffer, baseRawOptions ) //, {raw:{ width: this.definition.document.width, height: this.definition.document.height, channels: 4}})
                    .toFile(filename, function(error, info) {
                        if (error) throw error;
                        
                        logger.log('info', 'Output file information', info);
                        
                        // call the callback with some meta information
                        callback({filename: filename, width: info.width, height: info.height});
                    });
            }.bind(this));

        if (overlay !== null) {
            Promise.all([this.buffer, overlay])
                .then(function(buffers) {
                    // The options for the base image
                    var baseRawOptions = {
                        raw: {
                            width: this.design.document.width, 
                            height: this.design.document.height, 
                            channels: 4
                        }
                    };

                    // The options for the processed capture, including the top/left translation
                    var overlayRawOptions = {
                        raw: {
                            width: this.design.document.width, 
                            height: this.design.document.height,  
                            channels: 4
                        }
                    };

                    // Compose both
                    sharp(buffers[0], baseRawOptions ) //, {raw:{ width: this.definition.document.width, height: this.definition.document.height, channels: 4}})
                        .overlayWith(buffers[1], overlayRawOptions )
                        .toFile(filename, function(error, info) {
                            if (error) throw error;
                            
                            logger.log('info', 'Output file information', info);
                            
                            // cleaning up
                            this.buffer = null;

                            // call the callback with some meta information
                            callback({filename: filename, width: info.width, height: info.height});
                        }.bind(this));
                }.bind(this))
                .catch(function(result) {
                    logger.log('error', result);
                });
        } else {
            // no overlay, just save
            // Compose both
            

        }
    }
}

module.exports = new ComposeManager();