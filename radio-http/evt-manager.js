const MPlayer = require('./mplayer');

class EvtManager {
    /**
     * @param {Connection} conn
     */
    constructor(conn){
        this._conn = conn;
        this._mplayer = global.MPLAYER;
        this._mplayer.state = 'stopped';
        this._mplayer._last_status = {
            title: null,
            filename: null,
        };

        this._time = 0;

        this._mplayer.on('ready', () => this._mplayer.volume(100));

        this._mplayer.on('time', (t) => {
            this._time++;
            if (this._time % 4 == 0){
                if (t > 0 && this._mplayer.state == 'startPlaying'){
                    this._mplayer.state = 'playing';
                    this._process_event('state');
                }
                this._process_event('position');
            }
        });

        this._mplayer.on('status', (status) => {
            if (status.filename != this._mplayer._last_status.filename || status.title != this._mplayer._last_status.title){
                this._mplayer._last_status = {
                    title: status.title,
                    filename: status.filename,
                }
                this._process_event('state');
            }
        });

        this._mplayer.on('start', () => {
            this._mplayer.state = 'startPlaying';
            this._process_event('state');
        })

        this._mplayer.on('play', () => {
            this._mplayer.state = 'playing';
            this._process_event('state');
        });

        this._mplayer.on('pause', () => {
            if (this._mplayer.state == 'playing'){
                this._mplayer.state = 'paused';
                this._process_event('state');
            }
        });

        this._mplayer.player.on('ended', () => {
            this._mplayer.state = 'ended';
            this._process_event('state');
            this._mplayer.state = 'stopped';
        })

        this._mplayer.on('stop', () => {
            this._mplayer.state = 'stopped';
            this._process_event('state');
        });

        let onData = function(data){
            data = data.toString().replace(/[\r\n]/gi, '');
            if(data.indexOf('EOF code:') > -1) {
                let code = data.replace(/^.*EOF code: ([0-9]).*$/gi, '$1');
                console.log('we have eof', code);
                this.emit(code == 1 ? 'ended' : 'playstop');
                this.setStatus();
            }

            if(data.indexOf('A:') === 0 && this.status.duration == 0) {
                let r = /^A:[ \s]+([0-9\.]+) \([^\)]*\) of ([0-9\.]+).*$/gi;
                this.setStatus({
                    duration: parseFloat(data.replace(r, '$2')),
                    fullscreen: 0,
                    subtitles: 0,
                });

                this.emit('timechange', parseFloat(data.replace(r, '$1')));
            }
        }

        let onError = function(data){
            data = data.toString();
            if(data.indexOf('A:') === 0) {
                var timeStart, timeEnd, t;

                if(data.indexOf(' V:') !== -1) {
                    timeStart = data.indexOf(' V:') + 3;
                    timeEnd = data.indexOf(' A-V:');
                } else {
                    timeStart = data.indexOf('A:') + 2;
                    timeEnd = data.indexOf(' (');
                }

                t = data.substring(timeStart, timeEnd).trim();

                this.emit('timechange', t)
            }
        }

        this._mplayer.player.instance.stdout.on('data', onData.bind(this._mplayer.player));
        this._mplayer.player.instance.stderr.on('data', onError.bind(this._mplayer.player));
        this._mplayer.player.instance.stderr.on('data', onData.bind(this._mplayer.player));
        this._mplayer.player.removeAllListeners('timechange');
        var pauseTimeout, paused = false;
        this._mplayer.player.on('timechange', function(time) {
            clearTimeout(pauseTimeout);
            pauseTimeout = setTimeout(function() {
                paused = true;
                this.status.playing = false;
                this.emit('pause');
            }.bind(this), 300);
            if(paused) {
                paused = false;
                this.status.playing = true;
                this.emit('play');
            }
            this.status.position = time;
            this.emit('time', time);
        }.bind(this._mplayer));
    }

    /**
     * @param {string} name
     */
    _process_event(name){
        this._conn.send(JSON.stringify({
            event: name,
            status: MPlayer.do_get_status(),
        }));
    }

}

module.exports = EvtManager;
