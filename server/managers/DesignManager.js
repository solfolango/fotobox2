var fs = require('fs');
var path = require('path');

var probe = require('probe-image-size');
var _ = require('lodash');

var parseString = require('xml2js').parseString;


var config = require(__base + '/config');
var logger = require(__base + '/server/util/Logger');
var urlHelper = require(__base + '/server/util/URLHelper');

class DesignManager {

    constructor() {
        console.log("DesignManager.constructor()");
        this.designs = [];
        
        // read all images from the input directory
        var files = fs.readdirSync(config.app.path.designs.layout);
        for (var i = 0; i < files.length; i++) {
            console.log(files[i]);
            if (files[i].toLowerCase().endsWith('.svg')) {
                this.addDesign(files[i]);
            }
        }
    }

    addDesign(filename) {
        try {
            var data = fs.readFileSync(config.app.path.designs.layout + filename).toString();
            parseString(data, function(err, doc) {

                if (err) {
                    logger.error('Error parsing design ' + filename);
                    return;
                }

                if (doc === undefined) {
                    logger.error('Error parsing design ' + filename);
                    return;
                }

                if (!doc.svg['$'].viewBox) {
                    logger.error('Error parsing design ' + filename + ', viewBox attribute not found');
                    return;
                }

                var viewBox = doc.svg['$'].viewBox.split(' ').map(function(value) { return Number(value) });
                if (viewBox.length !== 4) {
                    logger.log('error', 'DefinitionStore.load(' + filename + '): Skipping due to invalid SVG input.', 'ViewBox attribute malformed.', doc.svg['$'].viewBox, viewBox);
                    return undefined;
                }

                var basename = path.posix.basename(filename, '.svg');

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

                var convert = function(str) {
                    return Math.round(parseInt(str));
                }

                // get all areas
                doc.svg.rect.forEach(function(rect, index) {
                    design.areas.push(
                        {
                            shape: 'rect',
                            x: convert(rect['$'].x),
                            y: convert(rect['$'].y),
                            width: convert(rect['$'].width),
                            height: convert(rect['$'].height),
                            centerX: Math.round(convert(rect['$'].x) + 0.5 * convert(rect['$'].width)),
                            centerY: Math.round(convert(rect['$'].y) + 0.5 * convert(rect['$'].height)),
                            cutout: '<svg><rect x="0" y="0" width="' + convert(rect['$'].width) + '" height="' + convert(rect['$'].height) + '" /></svg>'
                        }
                    );
                });

                // sort the areas by y, then x coords
                design.areas = _.sortBy(design.areas, ['y', 'x']);

                this.designs.push(design);
            }.bind(this));
        } catch (exception) {
            logger.error(exception);
            if (exception.code === 'ENOENT') {
                throw "File does not exist: " + filename;
                // this should not happen, since .load is never called from the outside
            }
        }
    }

    // gets a random design with minAreaCount and maxAreaCount
    getDesign(minAreaCount = 1, maxAreaCount = 1000) {
        return _(this.designs)
            .filter(function(design) {
                return design.areas.length >= minAreaCount && design.areas.length <= maxAreaCount;
            })
            .sample();
    }
}

module.exports = new DesignManager();