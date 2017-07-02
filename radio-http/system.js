const BaseHandler = require('./base-handler');
const spawn = require('child_process').spawn;

class System extends BaseHandler{
    constructor(conn, args) {
        super(conn, args);
    }

    shutdown() {
        console.log('shutdown');
        require('child_process').exec('sudo /sbin/shutdown now', function (msg) { console.log(msg) });
    }

    reboot() {
        require('child_process').exec('sudo /sbin/reboot now', function (msg) { console.log(msg) });
    }

}

module.exports = System;
