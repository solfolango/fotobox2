var machina = require('machina');

const config = require(__base + '/config');

var fsm = new machina.Fsm( {
    initialize: function ( options ) {
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

            _onEnter: function() {
                console.log("capture:onEnter()");
                this.handle('startSession');
            },

            startSession: function() {
                this.emit(config.event.camera.startSession);
            },

            capture: function() {
                this.emit(config.event.camera.initCapture);
                this.deferUntilTransition();
            },

            endSession: function() {
                this.emit(config.event.camera.sessionDone);
            },

            _onExit: function() {
                clearTimeout(this.timer);
            }
        }
    },
    start: function() {
        this.transition('ready');
    }
});

module.exports = fsm;