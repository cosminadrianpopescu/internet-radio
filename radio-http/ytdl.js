const BaseHandler = require('./base-handler');
const spawn = require('child_process').spawn;
const mplayer = require('./mplayer');
const fs = require('fs');
const Q = require('q');

const BASE_PATH = "/home/pi/Music/youtube/";
const YTDL_PATH = "/home/pi/programs/youtube-dl";

let PID = null;

class YTdl extends BaseHandler {
    constructor(conn, args) {
        super(conn, args);
        this._name = BASE_PATH + this._args['url'];
        this._name_info = this._name + '-info';
    }

    is_cached(){
        this.respond({
            answer: fs.existsSync(this._name_info) ? "yes" : "no",
            url: this._args['url'],
        });
    }

    _spawn(args){
        return fs.existsSync(YTDL_PATH) ? spawn(YTDL_PATH, args) : false;
    }

    _get_metadata(){
        let proc = this._spawn(['-s', '-j', this._args['url']]);
        if (!proc){
            return ;
        }
        let result = '';
        proc.stdout.on('data', data => {
            data = data.toString();
            result += data;
        });

        proc.on('exit', (code) => {
            if (code === 0){
                let json = JSON.parse(result);
                fs.writeFileSync(this._name_info, JSON.stringify({
                    title: json.title,
                    url: json.webpage_url,
                }));
            }
            else {
                fs.unlinkSync(this._name);
            }
        })
    }

    kill_me(){
        console.log('proc is', PID);
        PID ? spawn('kill', ['-9', PID]) : true;
        PID = null;
    }

    cache(){
        this.kill_me();
        let proc = this._spawn([this._args['url'], '--newline', '-o', '-']);
        if (!proc){
            return ;
        }
        PID = proc.pid;
        let f = fs.openSync(this._name, 'w');
        let p = 0;
        let success = false;
        let result = Q.defer();
        let err = null;
        /**
         * @param {string} data
         */
        proc.stderr.on('data', data => {
            data = data.toString().replace(/[\r\n]/gi, '');
            console.log("data is", data);
            let r = /^[ \s]*\[download\][ \s]+([0-9\.]+)%.*$/gi;
            if (data.match(r)){
                let p = parseFloat(data.replace(r, '$1'));
                if (p == 100){
                    success = true;
                }
                if (p >= 5 && result.promise.inspect().state == "pending"){
                    result.resolve();
                }
            }

            r = /^ERROR: [^:]+: (.*)$/;
            if (data.match(r)){
                err = data.replace(r, '$1');
            }
        });
        
        proc.stdout.on('data', data => {
            fs.writeSync(f, data);
        });

        proc.on('exit', (code) => {
            fs.closeSync(f);
            if (success){
                this._get_metadata();
            }
            else {
                fs.unlinkSync(this._name);
                result.reject(err || 'unknown error')
                if (err){
                    global.EVT_MANAGER._process_event('error ' + err);
                }
            }
        });

        return result.promise;
    }

    get_youtube_url(){
        if (fs.existsSync(this._name) && fs.existsSync(this._name_info)){
            let p = new mplayer(this._conn, {
                command: 'openUrl',
                args: {url: this._name}
            });
            p.handle();
            return ;
        }

        if (!fs.existsSync(YTDL_PATH)){
            return ;
        }

        let timeout_id = setTimeout(() => {
            this.kill_me();
            global.EVT_MANAGER._process_event('error Timeout downloading');
            timeout_id = null;
        }, 15000);

        this.cache().then(() => {
            console.log('ready for stream');
            clearTimeout(timeout_id);
            timeout_id = null;
            global.MPLAYER.openFile(decodeURIComponent(this._name));
        })
        .catch((reason) => {
            clearTimeout(timeout_id);
            console.log('stream interrupted', reason);
        });
    }
}

module.exports = YTdl;
