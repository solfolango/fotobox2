var config = {
    app: {
        path: {
            logs: __base + '/logs/',
            input: __base + '/server/_ressources/pictures/input/',
            output: __base + '/server/_ressources/pictures/output/',
            client: __base + '/client',
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
                client: '',
                output: 'pictures',
                overlay: 'overlay',
                background: 'background'
            }
        },
        composer: {
            default: {
                background: 0xffffffff, //white
                format: 'png'
            }
        }
    },
    event: {
        server: {

        },
        client: {
            showSlideshow: 'SHOW_SLIDESHOW',
            showInstructions: 'SHOW_INSTRUCTIONS',

            // send to client...
            initCapture: 'INIT_CAPTURE',
            // ... wait to receive this signal
            doCapture: 'DO_CAPTURE',
        },
        buzzer: {
            ready: 'BUZZER_READY',
            stopPress: 'BUZZER_STOP_PRESS',
            unready: 'BUZZER_NOT_READY',
        },
        camera: {
            doCapture: 'CAMERA_CAPTURE',
            captureDone: 'CAMERA_CAPTURE_DONE',
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