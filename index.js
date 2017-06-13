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
const fsm = require(__base + '/server/FSM');
var pictureManager = require(__base + '/server/util/PictureManager');
var designMgr = require(__base + '/server/util/DesignManager');


fsm.on(config.event.client.showSlideshow, function() {
    timeLog.log("Showing Slideshow");
});

fsm.on(config.event.client.showInstructions, function() {
    timeLog.log("Showing Instructions");
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

fsm.start();

buzzer.on(config.event.buzzer.stopPress, function(duration) {

    // get a definition worthy of the press duration
    var design = designMgr.getDesign(1, 1);
    console.log(design);

    if (fsm.isReadyForCapture()) {
        console.log("FSM is ready for capture: " + duration);
        fsm.transition('capture');
    } else {
        console.log("FSM is not ready for capture");
    }
})