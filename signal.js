let events = require('events');
let util = require('util');

let terminate = function () {
    process.exit();
};

class Signal extends events.EventEmitter {
    constructor(...args) {
        super(...args);
        let self = this;

        process.on('exit', () => {
            // this doesn't necessarily write to the underlying file, no hurt to put it here
            console.log('Exited');
        });
        process.on('SIGHUP', () => {}); //don't stop when SIGHUP
        process.once('SIGHUP', () => {
            console.info('SIGTERM received, exiting...');
            self.exit();
            process.on('SIGTERM', () => {
                throw new Error('Program failed to exit before a second SIGTERM signaled');
            });
        });
        process.on('SIGUSR1', () => {
            console.info('SIGUSR1 received, GCing...');
        });
        process.on('uncaughtException', (err) => {
            console.warn(err, 'Unexpected exception detected');
            terminate();
        });
    }

    exit() {
        this.emit('exiting');
    }

    abort(err) {
        if (err) {
            console.warn(err, 'Program Aborted');
        } else {
            console.error('Program Aborted');
        }
        terminate();
    }
}

module.exports = new Signal();
