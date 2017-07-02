import { EventEmitter, Injectable } from "@angular/core";
import { PlaylistItem , StreamInfoType , StateType , StatusType , SeekType , GoType , PlayerBackendInterface , BackendsCollection , BackendConsumerInterface, WebsocketBase, Backend } from "../shared/types";
import { CONFIG } from "../shared/config";
import { ServiceInjector } from "../app.module";
import { CommonsService } from "./commons";
import { PersistentLogger } from "./persistent-logger";

@Backend('player')
export class PlaylistPlayer extends WebsocketBase implements PlayerBackendInterface{
    id: string = 'playlists';

    streamInfoChanged: EventEmitter<StreamInfoType> = new EventEmitter<StreamInfoType>();
    positionChanged: EventEmitter<number> = new EventEmitter<number>();
    stateChanged: EventEmitter<StateType> = new EventEmitter<StateType>();
    private callback: Function;
    private url: string;

    error: EventEmitter<string> = new EventEmitter<string>();

    getStatus(): Promise<StatusType>{
        return null;
    }

    play(url: string){}
    
    seek(where: number){}

    pause(){}

    stop(){}

    resume(){}

    protected onMessage(result: any){
        try {
            this.callback(JSON.parse(result));
        }
        catch (err){
            this.error.emit(`There was a problem with the playlist ${this.url}`);
            this.callback([]);
        }
    }

    getMetadata(url: string): Promise<Array<PlaylistItem>>{
        this.url = url;
        let result: Promise<Array<PlaylistItem>> = new Promise<Array<PlaylistItem>>((resolve, reject) => this.callback = resolve);
        this.ws.send({command: 'read_file', args: {file: url}, callback_id: this.uuid + "",});

        return result;
    }
}

@Injectable()
export class PlayerService extends WebsocketBase implements BackendConsumerInterface {
    streamInfoChanged: EventEmitter<StreamInfoType> = new EventEmitter<StreamInfoType>();
    positionChanged: EventEmitter<number> = new EventEmitter<number>();
    stateChanged: EventEmitter<StateType> = new EventEmitter<StateType>();
    error: EventEmitter<string> = new EventEmitter<string>();

    private currentState: StateType = 'stopped';
    private playlist: Array<PlaylistItem> = [];
    private backends: Array<PlayerBackendInterface> = [];
    private currentBackend: PlayerBackendInterface = null;
    private logger: PersistentLogger;
    private isLoop: boolean = true;
    private isRepeat: boolean = false;
    private config: CONFIG;
    private commons: CommonsService;
    private saveCallback:  Function;

    public findItemById(id: string): PlaylistItem{
        return this.playlist.find(i => i.id == id);
    }

    private changeBackend(id: string){
        this.currentBackend = this.backends.find(backend => backend.id == id);
        if (this.currentBackend == null){
            this.signalError(`Could not change the backend to ${id}`);
        }
    }

    private backendFromUrl(_url: string): string{
        let pattern = /^(playlists::)?([^:]+)::(.*)$/gi;
        let id = _url.replace(pattern, '$2');
        let url = _url.replace(pattern, '$3');

        if (id == _url || url == _url){
            this.signalError(`The url ${url} is not in the correct format`);
        }
        else {
            this.changeBackend(id);
        }

        return url;
    }

    protected onMessage(result: any){
        this.saveCallback(true);
        this.saveCallback = null;
    }

    constructor(){
        super();
        this.config = ServiceInjector.injector.get(CONFIG);
        this.commons = ServiceInjector.injector.get(CommonsService);
        this.logger = ServiceInjector.injector.get(PersistentLogger);
        BackendsCollection.consumeBackends('player', this);
    }

    public addBackend(backend: PlayerBackendInterface){
        backend.positionChanged.subscribe(position => this.positionChanged.emit(position));
        backend.streamInfoChanged.subscribe((info: StreamInfoType) => {
            if (this.currentBackend && this.currentBackend.id == backend.id){
                let item: PlaylistItem = this.playlist.find(item => item.playing);
                if (item && (info.title || info.now_playing || info.filename)){
                    item.name = this.commons.formatNowPlaying(info);
                }
            }
            info.backend = backend.id;
            this.streamInfoChanged.emit(info);
        });
        backend.stateChanged.subscribe(state => {
            this.currentState = state;
            if (state == 'playing'){
                if ((this.currentBackend.id != 'vlc-youtube' && this.currentBackend.id != 'youtube-wrapper') || backend.id != 'vlc'){
                    this.changeBackend(backend.id);
                }
            }
            if (state == 'ended'){
                this.go('next');
            }
            this.stateChanged.emit(state);
        });
        backend.error.subscribe(err => {
            console.log('err is', err, backend);
            if (err == 150 || backend.id == 'vlc-youtube' || backend.id == 'vlc'){
                let item: PlaylistItem = this.playlist.find((it, idx) => (idx < this.playlist.length - 1 || this.isLoop) && it.playing && this.playlist.length >= 2);
                let msg: string = "There was an error trying to play an youtube video";
                if (item){
                    msg = `There was an error trying to play ${item.name}: ${err}`;
                    this.go('next');
                }
                this.signalError(msg);
            }
            else {
                this.signalError(err);
            }
        });
        this.backends.push(backend);
    }

    private signalError(msg: string){
        this.error.emit(msg);
        this.logger.log('Player service error');
        this.logger.log(msg);
    }

    private enque(items: Array<PlaylistItem>){
        this.playlist = this.playlist.concat(items.map((item, idx) => {
            item.position = idx + this.playlist.length;
            item.id = item.position + ':' + item.id;
            item.uri = this.currentBackend.id + '::' + item.uri;
            item.playing = false;

            return item;
        }));
    }

    add(_url: string, play: boolean): Promise<Array<PlaylistItem>>{
        let callback: Function;
        let result: Promise<Array<PlaylistItem>> = new Promise<Array<PlaylistItem>>((resolve, reject) => callback = resolve);
        if (play && this.currentBackend != null){
            this.stop();
        }
        let url = this.backendFromUrl(_url);
        this.currentBackend.getMetadata(url)
            .then((items) => {
                let length: number = this.playlist.length;
                this.enque(items);
                callback(items);
                if (play){
                    this.playItem(this.playlist[length].id);
                }
            }
        );

        return result;
    }

    seek(where: SeekType | number){
        this.currentBackend.getStatus().then((status) => {
            if (status.state != 'playing'){
                return ;
            }
            let proc: number = status.position;
            let duration = status.length;

            if (typeof(where) == 'string'){
                let _time: number = (where == 'forward' ? 1 : -1) * this.config.seek;
                proc = status.position + _time * 1.0 / 100.0;
            }
            else {
                proc = (where * 1.0 / 100.0) - status.position;
            }

            this.currentBackend.seek(proc * duration);
        });
    }

    go(where: GoType){
        let start: number, step: number, cont: Function;
        let next: PlaylistItem = null;
        let item: PlaylistItem;
        if (where == 'next'){
            start = 0;
            cont = (i) => i < this.playlist.length;
            step = 1;
        }
        else {
            start = this.playlist.length - 1;
            step = -1;
            cont = (i) => i >= 0
        }

        for (let i = start; cont(i); i += step){
            item = this.playlist[i];
            if (item.playing){
                if (cont(i + step)){
                    next = this.playlist[i + step];
                }
                else if (this.isLoop){
                    next = this.playlist[where == 'next' ? 0 : this.playlist.length - 1];
                }

                break;
            }
        }

        if (next != null){
            this.playItem(next.id);
        }
    }

    loop(){
        this.isLoop = !this.isLoop;
    }

    shuffle(){
        let new_list: Array<PlaylistItem> = [];
        let idx: number = 0;

        for (let item of this.playlist){
            if (item.playing){
                new_list.push(item);
                this.playlist.splice(idx, 1);
                break;
            }

            idx++;
        }

        while (this.playlist.length > 0){
            idx = Math.floor((Math.random() * this.playlist.length) + 1) - 1;
            new_list.push(this.playlist.splice(idx, 1)[0]);
        }

        this.playlist = new_list;
    }

    clearAll(){
        this.playlist = [];
        this.stop();
    }
    
    play(_url: string){
        this.currentState = 'startPlaying';
        this.stateChanged.emit(this.currentState);
        let url = this.backendFromUrl(_url);
        console.log('playing with', url, this.currentBackend);
        this.currentBackend.play(url);
    }

    stop() {
        this.backends.forEach(backend => backend.stop());
    }

    playItem(id: string){
        this.playlist.map(item => item.playing = false);
        this.stop();
        let item: PlaylistItem = this.findItemById(id);
        if (item != null){
            item.playing = true;
            this.backendFromUrl(item.uri);
            this.play(item.uri);
        }
    }

    remove(id: string){
        this.playlist.forEach((item, idx) => {
            if (item.id == id){
                this.playlist.splice(idx, 1);
            }
        });
    }

    private defaultStatus(): StatusType{
        let result: StatusType = new StatusType();
        result.length = 0;
        result.loop = this.isLoop;
        result.position = 0;
        result.repeat = this.isRepeat;
        result.shuffle = false;
        result.streamInfo = new StreamInfoType();
        result.streamInfo.artist = '';
        result.streamInfo.description = '';
        result.streamInfo.filename = '';
        result.streamInfo.genre = '';
        result.streamInfo.now_playing = '';
        result.streamInfo.title = '';
        result.streamInfo.url = '';
        return result;
    }

    getStatus(): Promise<StatusType>{
        let callback: Function;
        let result: Promise<StatusType> = new Promise<StatusType>((resolve, reject) => callback = resolve);
        if (this.currentBackend){
            let status: Promise<StatusType> = this.currentBackend.getStatus();
            if (status == null){
                callback(this.defaultStatus());
                return result;
            }
            status.then((status) => {
                status.loop = this.isLoop;
                status.repeat = this.isRepeat;
                callback(status);
            });
        }
        else {
            callback(this.defaultStatus());
        }
        return result;
    }

    getPlaylist(): Array<PlaylistItem>{
        return this.playlist;
    }

    saveAsPlaylist(name: string, path: string): Promise<boolean>{
        let result: Promise<boolean> = new Promise<boolean>((resolve, reject) => this.saveCallback = resolve);
        this.ws.send({command: 'save_file', args: {name: name + '.playlist', path: path, content: JSON.stringify(this.playlist)}, callback_id: this.uuid + "",});
        return result;
    }

    public pause(){
        this.currentBackend.pause();
    }

    public resume(){
        if (this.playlist.length > 0){
            this.currentBackend.resume();
        }
    }
}
