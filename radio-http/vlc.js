const BaseHandler = require('./base-handler');
const uuid = require('uuid/v4');

class Vlc extends BaseHandler {
    constructor(conn, args) {
        super(conn, args);
        this._vlc = global.VLC;

        // let media = vlc.mediaFromFile('/home/lixa/Music/youtube/92nj_dOQYOc');
        // media.parseSync();
        // let player = vlc.mediaplayer;
        // player.media = media;
        // player.play();
        // player.media.on('MetaChanged', args => {
        //     console.log('meta changed with', args);
        //     console.log('meta is', player.media.title)
        // });
    }

    clear_all(){
    }

    get_url(){
        return this._args.url.match(/^http|file:\/\//g) ? this._args.url : 'file://' + this._args.url;
    }

    get_metadata(){
        let media = this._vlc.mediaFromUrl(this.get_url());

        this.respond([{
            id: uuid(),
            playing: false,
            duration: media.duration,
            name: media.title,
            uri: media._path,
        }]);
    }

    stop() {
        this._vlc.mediaplayer.stop();
    }

    openUrl() {
        let media = this._vlc.mediaFromUrl(this.get_url());
        media.on('MetaChanged', args => {
            console.log("meta changed with ", args);
            console.log('value is', this._vlc.mediaplayer.media[args]);
        })
        this._vlc.mediaplayer.media = media;
        this._vlc.mediaplayer.play();
    }

    handle(){
        this[this._cmd]();
    }
}

module.exports = Vlc;
