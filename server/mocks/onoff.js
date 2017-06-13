class Gpio {
    constructor (id, direction, edge) {
        this.id = id;
        this.direction = direction;
        this.edge = edge;
        this.value = 1;
        this.callback = null;

        this.cooldown = 5 * 1000;
        this.maxDuration = 1200;
    }

    toggle() {
        if (this.value === 0) {
            this.value = 1;
            setTimeout(this.toggle.bind(this), Math.random() * this.cooldown);
        } else {
            this.value = 0;
            setTimeout(this.toggle.bind(this), Math.random() * this.maxDuration);
        }
        // call all callbacks
        if (this.callback != null) this.callback(null, this.value);
    }
    
    watch(callback) {
        setTimeout(this.toggle.bind(this), 50000);
        this.callback = callback;
    }

    unwatch(callback) {
        this.callback = null;
    }
}

module.exports = Gpio;

// this.buzzer = new GPIO(24, 'in', 'both');
//this.buzzer.watch(function(err, value) {