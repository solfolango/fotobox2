// set the global base for all modules
global.__base = __dirname;

// include standard modules
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var machina = require('machina');
const EventEmitter = require('events');

var moment = require('moment');
var fs = require('fs');

// include custom modules
const config = require(__base + '/config');
const timeLog = require(__base + '/server/util/TimeLog').logTo(config.app.path.logs);
var logger = require(__base + '/server/util/Logger');
const fsm = require(__base + '/server/FSM');
var pictureMgr = require(__base + '/server/managers/PictureManager');
var designMgr = require(__base + '/server/managers/DesignManager');
var composeMgr = require(__base + '/server/managers/ComposeManager');


// include custom modules that have a mock on windows dev host, but the real deal on the rpi production
if (process.env.NODE_ENV === 'dev') {
    var buzzer = require(__base + '/server/mocks/buzzer');
    var gphoto = require(__base + '/server/mocks/gphoto');
} else {
    var buzzer = require(__base + '/utils/buzzer');
    var gphoto = require(__base + '/server/util/gphoto');
}

/**
 * Initialize the Web server
 */
// Point static path to client and the resulting pictures
app.use('/' + config.app.server.url.output, express.static(config.app.path.output));
app.use('/' + config.app.server.url.background, express.static(config.app.path.designs.background));
app.use('/' + config.app.server.url.overlay, express.static(config.app.path.designs.overlay));
app.use('/' + config.app.server.url.client, express.static(config.app.path.client));

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(config.app.path.client + '/index.html');
});

// Start the webserver on :config.app.server.port
http.listen(config.app.server.port, function(){
  logger.log('info', 'Webserver listening on *:' + config.app.server.port + '.');
});


fsm.on(config.event.client.showSlideshow, function() {
    timeLog.log("Showing Slideshow");
});

fsm.on(config.event.client.showInstructions, function() {
    timeLog.log("Showing Instructions");
});

fsm.on(config.event.camera.doCapture, function(meta) {
    var capture = gphoto.capture();

    // initialize the composemanager with the design
    if (meta.index === 0) {
        composeMgr.init(meta.design);
    }

    gphoto.capture()
        .then(function(filename) {
            
            console.log("Processing picture " + this.index + "/" + (this.design.areas.length-1));
            // add it to the processing queue
            var comp = composeMgr.add(filename, this.index);
            console.log("Composer.add:");
            console.log(comp);

            // handle the next capture, if necessary
            
            if (this.index < this.design.areas.length - 1) {
                // initiate next capture
                this.handle('initCapture', false);
            } else {
                // save the composition
                comp.then(function() {
                    composeMgr.save(function(fileinfo) {
                        logger.log('info', 'Output file information', fileinfo);

                        // Add the new picture to pictureManager
                        var fileinfo = pictureMgr.addNewPicture(fileinfo);

                        // Start slideshow with the new picture
                        console.log("Starting Slideshow with param fileinfo");
                        this.transition('ready', fileinfo);
                    }.bind(this));
                }.bind(this));
            }
        }.bind(fsm))
        .catch(function(reason) {
            logger.error('Capture failed', reason);
            fsm.handle('initCapture', true); // repeat the last capture
        });
});

// Buzzer is watched only in the "ready" state. 
fsm.on('transition', function(event) {
    console.log(event);
    if (event.toState === 'ready') {

        // send the client the buzzer-available signal
        buzzer.watch();
    } else {
        // send the client the no-buzzer-available signal
        buzzer.unwatch();
    }
});

io.on('connection', function(socket) {
    fsm.setSocket(socket);
    fsm.start();
});


buzzer.on(config.event.buzzer.stopPress, function(duration) {

    console.log("Received a buzzer event");

    // get a definition worthy of the press duration
    var design = designMgr.getDesign(1, 4);
    console.log(design);

    if (fsm.isReadyForCapture()) {
        console.log("FSM is ready for capture: " + duration);
        fsm.transition('capture', design);
    } else {
        console.log("FSM is not ready for capture");
    }
})