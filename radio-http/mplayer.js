const BaseHandler = require('./base-handler');
const uuid = require('uuid/v4');
const spawn = require('child_process').spawn;
const fs = require('fs');

class MPlayer extends BaseHandler {
    constructor(conn, args) {
        super(conn, args);
        this._mplayer = global.MPLAYER;
        let id = uuid();
    }

    /**
     * @param {Array} lines
     * @param {RegExp} r
     */
    _extract_metadata(lines, r){
        let match = lines.find(line => line.match(r));
        if (match){
            return match.replace(r, '$1');
        }

        return null;
    }

    get_status(){
        this.respond(MPlayer.do_get_status());
    }

    get_metadata(){
        let args = this._args;
        let instance = spawn('mplayer', ['-identify', '-frames', '0', '-vo', 'null', '-ao', 'null', this._args.url]);
        let result = '';
        instance.stdout.on('data', data => {
            result += data;
        });

        instance.on('exit', () => {
            let lines = result.split("\n");
            let metadata = {
                name: '',
                id: uuid(),
                playing: false,
                duration: 0,
                uri: args['url'],
            }
            metadata.name = this._extract_metadata(lines, /^ICY Info: StreamTitle='(.*)';$/gi)
                || this._extract_metadata(lines, /^Name[ ]+: (.*)$/gi)
                || this._extract_metadata(lines, /ID_FILENAME=(.*)$/gi)
                || args['url'];
            metadata.duration = this._extract_metadata(lines, /^ID_LENGTH=(.*)$/gi);

            this.respond([metadata]);
        });
    }

    pause() {
        this._mplayer.pause();
    }

    stop() {
        this._mplayer.stop();
    }

    play() {
        if (this._mplayer.state == 'stopped' && this._mplayer.player._last_url){
            this.parse_params({args: {url: this._mplayer.player._last_url}});
            this.openUrl();
        }
        else {
            this._mplayer.play();
        }
    }

    openUrl() {
        if (this._args['url']){
            this._mplayer.player._last_url = this._args['url'];
        }
        this._mplayer.openFile(decodeURIComponent(this._args['url']));
    }

    static do_get_status(){
        let player = global.MPLAYER;
        let status = player.status || {};
        let title = status.title || status.filename || '';
        if (title.match(/^(\/|http|file)/gi)){
            title = title.replace(/^.*\/([^\/]+)$/gi, '$1');
        }
        let now_playing = title;
        let url = status.filename;
        let duration = status.duration || 0;
        let position = status.position || 0;
        if (duration != 0){
            position = parseFloat(position / duration);
        }
        if (status.filename && status.filename.match(/^\//gi) && fs.existsSync(status.filename + '-info')){
            let data = JSON.parse(fs.readFileSync(status.filename + '-info'));
            now_playing = data.title;
            title = data.title;
            url = data.url;
        }
        return {
            length: duration,
            loop: true,
            position: position,
            repeat: false,
            state: player.state,
            streamInfo: {
                now_playing: now_playing,
                artist: '',
                description: '',
                title: title,
                genre: '',
                url: url,
            }
        }
    }

    seek_forward() {
        if (this._args['time']){
            let status = MPlayer.do_get_status();
            let percent = parseFloat(this._args['time']) + status.position * 100;
            this._mplayer.seek(parseFloat(percent / 100) * status.length);
        }
    }
}

module.exports = MPlayer;

