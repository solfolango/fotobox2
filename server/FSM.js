var machina = require('machina');
var logger = require(__base + '/server/util/Logger');

const config = require(__base + '/config');

var fsm = new machina.Fsm( {
    initialize: function ( options ) {

        // initialize the socket
        this.socket = undefined;

        // Setting the socket on creation
        this.setSocket = function(socket) {
            this.socket = socket;

            // Is sent by the client when we can do the capture, i.e. the design was shown and the countdown was displayed
            socket.on(config.event.client.doCapture, function(data) {
                this.handle('capture', data);
            }.bind(this));
        }

        // communication with the client
        this.sendClient = function(message, args) {
            if (this.socket !== undefined) {
                this.socket.emit(message, args);
            }
        }

        this.isReadyForCapture = function() {
            return this.state === 'ready';
        };

    },
    namespace: "fotobox",
    initialState: "uninitialized",
    states: {
        
        /**
         * DEFAULT INIT STATE
         * Transition to "ready" must come from external source
         */

        uninitialized: {
            _onEnter: function() {
            },
            "*": function() {
                this.deferUntilTransition();
                this.interval = setInterval(function() {
                    console.log("a");
                }, 1000);
            },
            _onExit: function() {
                clearInterval(this.interval);
            }
        },

        /**
         * READY STATE
         * Cycles between "instructions" and "slideshow" until the buzzer is pressed
         */

        ready: {

            _onEnter: function() {
                this.handle('instructions');
            },

            instructions: function() {
                this.emit(config.event.client.showInstructions);

                // switch to slideshow after config.client.module.instructions.duration
                this.timer = setTimeout(function() {
                    this.handle('slideshow');
                }.bind(this), config.client.instructions.showDuration * 1000);
            },

            slideshow: function() {
                this.emit(config.event.client.showSlideshow);

                // switch to instructions after config.client.module.slideshow.duration
                this.timer = setTimeout(function() {
                    this.handle('instructions');
                }.bind(this), config.client.slideshow.showDuration * 1000);
            },

            buzzer: function() {
                this.transition('capture');
            },

            _onExit: function() {
                clearTimeout(this.timer);

            }
        },
        capture: {
            // we are getting the design from the server
            _onEnter: function(design) {
                console.log("capture:onEnter()");

                // save the design for later use
                this.design = design;
                
                // Initialize image index that we are capturing
                this.index = null;

                this.handle('initCapture');
            },

            initCapture: function() {

                if (this.index === null) {
                    this.index = 0;
                } else {
                    this.index++;
                }

                // we are done, send the signal to the server to compose everything
                if (this.index >= this.design.areas.length) {
                    
                }

                // build the args passed to the client
                this.sendClient(config.event.client.initCapture, {index: this.index, design: this.design});

                // waiting for the client signal, for prod this is done in socket.on within the initialize function of the FSM
                if (process.env.NODE_ENV === 'dev') {
                    this.timeout = setTimeout(function() {
                        this.handle('capture');
                    }.bind(this), 2000);
                }
            },

            capture: function() {
                // send the server the signal to trigger the camera
                this.emit(config.event.camera.doCapture);
                this.deferUntilTransition();
            },

            endSession: function() {
                this.emit(config.event.camera.sessionDone);
            },

            _onExit: function() {
                clearTimeout(this.timer);
                this.design = null;
            }
        }
    },
    start: function() {
        this.transition('ready');
    }
});

module.exports = fsm;