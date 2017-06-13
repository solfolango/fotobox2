const config = require(__base + '/config');

class URLHelper {
    constructor() {

    }

    generate(fileName) {
        return config.app.server.protocol + '://' + config.app.server.hostname + ':' + config.app.server.port + '/' + fileName
    }
}

module.exports = new URLHelper();