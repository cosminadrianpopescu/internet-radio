import { EventEmitter, Injectable } from "@angular/core";
import { CommonsService } from "./commons";
import { YoutubeRequestType , PlayerBackendInterface , StreamInfoType , StateType , StatusType , PlaylistItem , Backend , BrowserBackendInterface , FileItem, WebsocketBase, BackendsCollection } from "../shared/types";
import { Observable } from "rxjs/Rx";
import { ServiceInjector } from "../app.module";
import { PlayerService } from "./player";
import { CONFIG } from "../shared/config";
import { VlcBackend } from "./vlc";

// Type definitions for YouTube
// Project: https://developers.google.com/youtube/
// Definitions by: Daz Wilkin <https://github.com/DazWilkin/>, Ian Obermiller <http://ianobermiller.com>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare namespace YT {
    interface EventArgs {
        target: Player;
        data: any;
    }

    interface EventHandler {
        (event: EventArgs): void;
    }

    export interface Events {
        onReady?: EventHandler;
        onPlayback?: EventHandler;
        onStateChange?: EventHandler;
        onError?: EventHandler;
    }

	export enum ListType {
		search,
		user_uploads,
		playlist,
	}

    export interface PlayerVars {
        autohide?: number;
        autoplay?: number;
        cc_load_policy?: any;
        color?: string;
		controls?: number;
		disablekb?: number;
		enablejsapi?: number;
		end?: number;
		fs?: number;
		iv_load_policy?: number;
		list?: string;
		listType?: ListType;
		loop?: number;
		modestbranding?: number;
		origin?: string;
        playerpiid?: string;
		playlist?: string[];
        playsinline?: number;
		rel?: number;
        showinfo?: number;
		start?: number;
        theme?: string;
    }

    export interface PlayerOptions {
        width?: string | number;
        height?: string | number;
        videoId?: string;
        playerVars?: PlayerVars;
        events?: Events;
    }

    interface VideoByIdParams {
        videoId: string;
        startSeconds?: number;
        endSeconds?: number;
        suggestedQuality?: string;
    }

    interface VideoByUrlParams {
        mediaContentUrl: string;
        startSeconds?: number;
        endSeconds?: number;
        suggestedQuality?: string;
    }

    export interface VideoData
    {
        video_id: string;
        author: string;
        title: string;
    }

    export class Player {
        // Constructor
        constructor(id: string, playerOptions: PlayerOptions);
        constructor(element: HTMLElement, playerOptions: PlayerOptions);

        // Queueing functions
        loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
        loadVideoById(VideoByIdParams: Object): void;
        cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
        cueVideoById(VideoByIdParams: Object): void;

        loadVideoByUrl(mediaContentUrl: string, startSeconds?: number, suggestedQuality?: string): void;
        loadVideoByUrl(VideoByUrlParams: Object): void;
        cueVideoByUrl(mediaContentUrl: string, startSeconds?: number, suggestedQuality?: string): void;
        cueVideoByUrl(VideoByUrlParams: Object): void;

        // Properties
        size: any;

        // Playing
        playVideo(): void;
        pauseVideo(): void;
        stopVideo(): void;
        seekTo(seconds:number, allowSeekAhead:boolean): void;
        clearVideo(): void;

        // Playlist
        nextVideo(): void;
        previousVideo(): void;
        playVideoAt(index: number): void;

        // Volume
        mute(): void;
        unMute(): void;
        isMuted(): boolean;
        setVolume(volume: number): void;
        getVolume(): number;

        // Sizing
        setSize(width: number, height: number): any;

        // Playback
        getPlaybackRate(): number;
        setPlaybackRate(suggestedRate:number): void;
        getAvailablePlaybackRates(): number[];

        // Behavior
        setLoop(loopPlaylists: boolean): void;
        setShuffle(shufflePlaylist: boolean): void;

        // Status
        getVideoLoadedFraction(): number;
        getPlayerState(): number;
        getCurrentTime(): number;
        getVideoStartBytes(): number;
        getVideoBytesLoaded(): number;
        getVideoBytesTotal(): number;

        // Information
        getDuration(): number;
        getVideoUrl(): string;
        getVideoEmbedCode(): string;
        getVideoData(): VideoData;

        // Playlist
        getPlaylist(): any[];
        getPlaylistIndex(): number;

        // Event Listener
        addEventListener(event: string, handler: EventHandler): void;

        // DOM
        destroy(): void;
    }

    export enum PlayerState {
        UNSTARTED,
        BUFFERING,
        CUED,
        ENDED,
        PAUSED,
        PLAYING
    }
}

@Injectable()
export class YoutubeInfoService{
    private commons: CommonsService;
    constructor(){
        this.commons = ServiceInjector.injector.get(CommonsService);
    }

    private getItemInfo(type: YoutubeRequestType, q: string, resultIdPath: string): Promise<Object>{
        let callback: Function;
        let result: Promise<Object> = new Promise<Object>((resolve, reject) => callback = resolve);
        this.commons.makeYoutubeRequest(type, q)
            .then((obj: Array<Object>) => {
                callback(obj.map((obj, idx) => {
                    let result: Object = {};
                    Object.assign(result, {id: this.commons.get(obj, resultIdPath, ''),
                        uri: this.commons.get(obj, resultIdPath, ''),
                        position: idx, name: this.commons.get(obj, 'snippet.title', '')}, obj['snippet']);
                    return result;
                }));
            });

        return result;
    }

    public getVideoInfo(ids: Array<string>): Promise<Object> {
        let sId = '';
        for (let id of ids){
            sId += (sId == '' ? '' : ',') + id;
        }

        return this.getItemInfo('videos', 'id=' + sId, 'id');
    }

    public getPlaylistInfo(id: string): Promise<Object> {
        return this.getItemInfo('playlistItems', 'playlistId=' + id, 'snippet.resourceId.videoId');
    }
}

@Backend('player')
export class YoutubePlayerBackend implements PlayerBackendInterface {
    id: string = 'youtube';

    streamInfoChanged: EventEmitter<StreamInfoType> = new EventEmitter<StreamInfoType>();
    positionChanged: EventEmitter<number> = new EventEmitter<number>();
    stateChanged: EventEmitter<StateType> = new EventEmitter<StateType>();

    private isPlaying: boolean = false;
    private player: YT.Player;
    private info: YoutubeInfoService;
    private ready: boolean = false;

    public error: EventEmitter<string> = new EventEmitter<string>();

    private doGetStatus(): StatusType {
        let streamInfo: StreamInfoType = <StreamInfoType>{
            artist: '',
            description: '', 
            filename: '',
            genre: '',
            now_playing: '',
            title: '',
            url: '',
        }
        if (!this.ready){
            return <StatusType> {
                length: 0, 
                position: 0,
                state: 'stopped',
                streamInfo: streamInfo,
            }
        }
        let duration: number = this.player.getDuration();
        if (typeof(duration) == 'undefined'){
            duration = 0;
        }
        let position: number = this.player.getCurrentTime();
        if (typeof(position) == 'undefined'){
            position = 0;
        }
        let _state: number = this.player.getPlayerState();
        let state: StateType;
        if (typeof(_state) == 'undefined'){
            state = 'stopped';
        }
        else if (_state == 1){
            state = 'playing';
        }
        else if (_state == 2){
            state = 'paused';
        }
        else {
            state = 'stopped';
        }
        let data: YT.VideoData = this.player.getVideoData();
        let url: string = this.player.getVideoUrl();
        if (typeof(url) == 'undefined'){
            url = '';
        }
        streamInfo.url = url;
        if (typeof(data) != 'undefined'){
            streamInfo.artist = data.author;
            streamInfo.title = data.title;
            if (state == 'playing'){
                streamInfo.now_playing = data.title;
            }
        }

        return <StatusType> {
            length: Math.round(duration), 
            position: position / duration,
            state: state,
            streamInfo: streamInfo,
        }
    }

    constructor(){
        this.info = ServiceInjector.injector.get(YoutubeInfoService);

        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        let div = document.createElement('div');
        // div.setAttribute("style", "visibility: hidden");
        div.innerHTML = '<div id="youtubePlayer"></div>';
        document.body.appendChild(div);

        Object.assign(window, {
            onYouTubeIframeAPIReady: () => {
                this.ready = true;
                this.player = new YT.Player('youtubePlayer', {
                    height: '4',
                    width: '6',
                    events: {
                        onStateChange: (ev) => {
                            let status: StatusType = this.doGetStatus();
                            this.streamInfoChanged.emit(status.streamInfo);
                            if (ev.data == YT.PlayerState.PLAYING){
                                this.stateChanged.emit('playing');
                                this.isPlaying = true;
                                Observable.interval(1000).takeWhile(() => this.isPlaying)
                                    .subscribe(() => {
                                        this.positionChanged.emit(this.player.getCurrentTime());
                                    });
                            }
                            else if (ev.data == YT.PlayerState.ENDED){
                                this.isPlaying = false;
                                this.stateChanged.emit('ended');
                            }
                            else if (ev.data == YT.PlayerState.PAUSED){
                                this.isPlaying = false;
                                this.stateChanged.emit('paused');
                            }
                            else if (this.isPlaying){
                                this.isPlaying = false;
                                this.stateChanged.emit('stopped');
                            }
                        },
                        onError: (ev) => {
                            console.log('we got youtube error', ev);
                            this.error.emit(ev.data);
                        },
                    },
                });
            }
        });
    }

    getStatus(): Promise<StatusType>{
        let callback: Function;
        let result: Promise<StatusType> = new Promise<StatusType>((resolve, reject) => callback = resolve);
        callback(this.doGetStatus());
        return result;
    }

    play(id: string){
        // document.getElementById("youtubePlayer").setAttribute("style", "position: absolute; left: 0; top: 0");
        if (!this.ready){
            return ;
        }
        this.player.loadVideoById({videoId: id});
    }

    seek(where: number){
        if (!this.ready){
            return ;
        }
        let pos: number = this.player.getCurrentTime();
        
        this.player.seekTo(pos + where, true);
    }

    pause(){
        if (!this.ready){
            return ;
        }
        this.isPlaying = false;
        this.player.pauseVideo();
    }

    resume(){
        if (!this.ready){
            return ;
        }
        this.isPlaying = true;
        this.player.playVideo();
    }

    stop(){
        if (!this.ready){
            return ;
        }
        this.isPlaying = false;
        this.player.stopVideo();
    }

    getMetadata(url: string): Promise<Array<PlaylistItem>>{
        let callback: Function;
        let result: Promise<Array<PlaylistItem>> = new Promise<Array<PlaylistItem>>((resolve, reject) => callback = resolve);
        if (!this.ready){
            callback([]);
            return result;
        }
        let videoId: string = url.replace(/^.*v=([^&]+).*$/, '$1');
        let listId: string = url.replace(/^.*list=([^&]+).*$/, '$1');
        if (listId != url){
            this.info.getPlaylistInfo(listId)
                .then(result => callback(result));
        }
        else if (videoId != url){
            this.info.getVideoInfo([videoId])
                .then(result => callback(result));
        }
        else {
            this.info.getVideoInfo([url])
                .then(result => callback(result));
        }

        return result;
    }
}

@Backend('player')
export class VlcYoutube extends WebsocketBase implements PlayerBackendInterface {
    id: string = 'vlc-youtube';

    streamInfoChanged: EventEmitter<StreamInfoType> = new EventEmitter<StreamInfoType>();
    positionChanged: EventEmitter<number> = new EventEmitter<number>();
    stateChanged: EventEmitter<StateType> = new EventEmitter<StateType>();
    error: EventEmitter<string> = new EventEmitter<string>();

    private youtubeService: YoutubePlayerBackend;
    private vlcService: VlcBackend;
    private items: Array<any> = [];

    constructor(){
        super();
        this.youtubeService = BackendsCollection.get(YoutubePlayerBackend);
        this.vlcService = BackendsCollection.get(VlcBackend);
        this.vlcService.streamInfoChanged.subscribe((info: StreamInfoType) => this.streamInfoChanged.emit(this.setStreamInfo(info)));
    }

    protected onMessage(result: string){}

    private setStreamInfo(info: StreamInfoType): StreamInfoType {
        let item = this.items.find(item => item.uri == 'vlc-youtube::' + info.title || item.uri == 'youtube-wrapper::' + info.title);
        if (item){
            info.url = info.title;
            info.artist = item.title;
            info.title = item.title;
            info.now_playing = item.title;
            info.filename = null;
        }
        return info;
    }

    getStatus(): Promise<StatusType> {
        let callback: Function;
        let result: Promise<StatusType> = new Promise<StatusType>((resolve, reject) => callback = resolve);
        this.vlcService.getStatus().then(status => {
            status.streamInfo = this.setStreamInfo(status.streamInfo);
            callback(status);
        });
        return result;
    }

    play(url: string){
        this.ws.send({command: 'get_youtube_url', args: {url: url}, callback_id: this.uuid + "",});
    }

    seek(where: number){
        this.vlcService.seek(where);
    }

    pause(){
        this.vlcService.pause();
    }

    resume(){
        this.vlcService.resume();
    }

    stop(){
        this.vlcService.stop();
    }

    getMetadata(url: string): Promise<Array<PlaylistItem>>{
        let callback: Function;
        let result: Promise<Array<PlaylistItem>> = new Promise<Array<PlaylistItem>>((resolve, reject) => callback = resolve);
        this.youtubeService.getMetadata(url).then(arr => {
            this.items = this.items.concat(arr);
            callback(arr);
        })
        return result;
    }
}

@Backend('player')
export class YoutubeWrapper extends WebsocketBase implements PlayerBackendInterface {
    id: string = 'youtube-wrapper';

    streamInfoChanged: EventEmitter<StreamInfoType> = new EventEmitter<StreamInfoType>();
    positionChanged: EventEmitter<number> = new EventEmitter<number>();
    stateChanged: EventEmitter<StateType> = new EventEmitter<StateType>();
    error: EventEmitter<string> = new EventEmitter<string>();

    private youtubeService: YoutubePlayerBackend;
    private vlcYoutube: VlcYoutube;
    private currentBackend: PlayerBackendInterface;
    private backends: Array<PlayerBackendInterface> = [];

    constructor(){
        super();
        this.youtubeService = BackendsCollection.get(YoutubePlayerBackend);
        this.vlcYoutube = BackendsCollection.get(VlcYoutube);
        this.backends.push(this.youtubeService);
        this.backends.push(this.vlcYoutube);

        this.currentBackend = this.backends[0];
    }

    protected onMessage(result: Object){
        this.currentBackend = result["answer"] == "yes" ? this.vlcYoutube : this.youtubeService;
        this.currentBackend.play(result["url"]);
        if (result['answer'] == "no"){
            this.ws.send({command: 'cache', args: {url: result["url"]}});
        }
    }

    getStatus(): Promise<StatusType> {
        return this.currentBackend.getStatus();
    }

    play(url: string){
        this.ws.send({command: 'is_cached', args: {url: url}, callback_id: this.uuid + "",});
    }

    seek(where: number){
        this.currentBackend.seek(where);
    }

    pause(){
        this.currentBackend.pause();
    }

    resume(){
        this.currentBackend.resume();
    }

    stop(){
        this.currentBackend.stop();
    }

    getMetadata(url: string): Promise<Array<PlaylistItem>>{
        return this.vlcYoutube.getMetadata(url);
    }
}

@Backend('browser')
export class YoutubeBrowserBackend implements BrowserBackendInterface {
    id: string = 'youtube';
    public sortDefault: boolean = true;
    private callback: Function;
    private commons: CommonsService;
    private config: CONFIG;
    private player: string = 'youtube';

    public error: EventEmitter<string> = new EventEmitter<string>();

    constructor() {
        this.commons = ServiceInjector.injector.get(CommonsService);
        this.config = ServiceInjector.injector.get(CONFIG)
        this.player = this.config.youtube.useIframeAPI ? 'youtube-wrapper' : 'vlc-youtube';
    }
    
    navigate(path: string): Promise<Array<FileItem>>{
        let callback: Function;
        let result: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => callback = resolve);

        if (path == null){
            this.commons.makeYoutubeRequest('playlists', "channelId=" + this.config.youtube.channelId)
                .then((items: Array<any>) => {
                    let result: Array<FileItem> = [<FileItem>{
                        type: 'dir', 
                        path: 'search::playlist::', 
                        name: 'Search playlists',
                    }];
                    result.push(<FileItem>{
                        type: 'dir', 
                        path: 'search::video::', 
                        name: 'Search files',
                    });
                    callback([].concat(result, items.map(item => {
                        return new FileItem(item.snippet.title, 
                            this.player + '::' + this.config.youtube.playlistBaseUrl + item.id,
                            ['addToFavourites', 'enque'], 'file', 'youtube')
                    })));
                });
        }
        else {
            let r: RegExp = /^search::(playlist|video)(.*)$/gi;
            if (path.match(r)){
                let q = path.replace(r, '$2');
                let type = path.replace(r, '$1');
                this.commons.makeYoutubeRequest('search', 'q=' + q + '&type=' + type)
                    .then((items: Array<any>) => {
                        let result: Array<FileItem> = [<FileItem>{
                            name: '..',
                            path: null,
                            type: 'dir',
                        }];
                        callback([].concat(result, items.map(item => {
                            let id: string;
                            let url: string = this.config.youtube.defaultVideoUri + '?';
                            if (item.id.kind == this.config.youtube.videoKind){
                                id = item.id.videoId;
                                url += 'v=' + id;
                            }
                            else if (item.id.kind == this.config.youtube.playlistKind){
                                id = item.id.playlistId;
                                url += 'list=' + id;
                            }
                            return new FileItem(item.snippet.title, this.player + '::' + url, ['addToFavourites', 'enque'], 'file', this.player);
                        })));
                    });
            }
        }


        return result;
    }
}
