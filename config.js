var config = {
    app: {
        path: {
            logs: __base + '/logs/',
            output: __base + '/server/_ressources/pictures/output/',
            input: __base + '/server/_ressources/pictures/input/',
            designs: { 
                background: __base + '/server/_ressources/designs/backgrounds/',
                layout: __base + '/server/_ressources/designs/layouts/',
                overlay: __base + '/server/_ressources/designs/overlays/',
            }
        },
        server: {
            protocol: 'http',
            hostname: 'localhost',
            port: 3000,
            url: {
                output: 'pictures',
                overlay: 'overlay',
                background: 'background'
            }
        }
    },
    event: {
        server: {

        },
        client: {
            showSlideshow: 'SHOW_SLIDESHOW',
            showInstructions: 'SHOW_INSTRUCTIONS',
        },
        buzzer: {
            ready: 'BUZZER_READY',
            stopPress: 'BUZZER_STOP_PRESS',
            unready: 'BUZZER_NOT_READY',
        },
        camera: {
            startSession: 'CAPTURE_SESSION_START',
            startCapture: 'CAPTURE_START',
            doCapture: 'CAPTURE',
            captureDone: 'CAPTURE_DONE',
            sessionDone: 'CAPTURE_SESSION_DONE',
        }
    },
    client: {
        slideshow: {
            showDuration: 10
        },
        instructions: {
            showDuration: 5
        }
    }
}

module.exports = config;