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

if (process.env.NODE_ENV === 'dev') {
    var buzzer = require(__base + '/server/mocks/buzzer');
    var gphoto = require(__base + '/server/mocks/gphoto');
} else {
    var buzzer = require(__base + '/utils/buzzer');
    var gphoto = require(__base + '/server/util/gphoto');
}

// include custom modules
const config = require(__base + '/config');
const timeLog = require(__base + '/server/util/TimeLog').logTo(config.app.path.logs);
var logger = require(__base + '/server/util/Logger');
const fsm = require(__base + '/server/FSM');
var pictureManager = require(__base + '/server/managers/PictureManager');
var designMgr = require(__base + '/server/managers/DesignManager');


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

fsm.on(config.event.camera.doCapture, function() {
    var capture = gphoto.capture();
    fsm.handle('')
});

// Buzzer is watched only in the "ready" state. 
fsm.on('transition', function(event) {
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

    // get a definition worthy of the press duration
    var design = designMgr.getDesign(1, 1);
    console.log(design);

    if (fsm.isReadyForCapture()) {
        console.log("FSM is ready for capture: " + duration);
        fsm.transition('capture', design);
    } else {
        console.log("FSM is not ready for capture");
    }
})