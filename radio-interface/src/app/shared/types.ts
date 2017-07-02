import { EventEmitter } from "@angular/core";
import { SimpleNgWebSocket } from "simple-ng-websocket/index";
import { UUID } from "../services/uuid";
import { ServiceInjector } from "../app.module";

export class Item {
    constructor(public title: string, public url: string){}
}

export class Time {
    constructor(public hours: number, public minutes: number, public seconds: number){}
}

export class PlaylistItem {
    constructor(
        public duration: number,
        public id: string,
        public name: string,
        public playing: boolean,
        public position: number,
        public uri: string
    ){}

    public static toFileItem(item: PlaylistItem, type: FileItemType): FileItem{
        let result = new FileItem(item.name, item.id, ['addToFavourites', 'delete'], type, '');
        result.playing = item.playing;
        return result;
    }

    public static toFileItems(items: Array<PlaylistItem>, type: FileItemType): Array<FileItem>{
        let result: Array<FileItem> = [];
        items.forEach(item => result.push(PlaylistItem.toFileItem(item, type)));
        return result;
    }
}

export class StreamInfoType {
    artist: string;
    description: string;
    filename: string;
    genre: string;
    now_playing: string;
    title: string;
    url: string;
    backend: string;
}

export class InfoType {
    playing_now: string;
    playing_next: string;
    position_current: string;
    position_total: string;
    weather: Array<Object>;
    d: Date;
}

export class StatusType {
    streamInfo: StreamInfoType
    length: number;
    position: number;
    repeat: boolean;
    loop: boolean;
    state: StateType;
    shuffle: boolean;
}

export class WeatherData {
    constructor(public data: any, public iconIdx: number){}
}

export interface PlayerBackendInterface {
    id: string;

    streamInfoChanged: EventEmitter<StreamInfoType>;
    positionChanged: EventEmitter<number>;
    stateChanged: EventEmitter<StateType>;

    error: EventEmitter<string>;

    getStatus(): Promise<StatusType>;
    play(url: string);
    seek(where: number);
    resume();
    pause();
    stop();
    getMetadata(url: string): Promise<Array<PlaylistItem>>;
}

export type YoutubeRequestType = 'search' | 'playlists' | 'videos' | 'playlistItems';

export type CommandType = 'prev' | 'next' | 'play' | 'pause' | 'stop' | 'loop' | 'shuffle' | 'playItem' | 'removeItem' | 'openUrl' | 'clearAll' | 'enque' | 'log';

export type StateType = 'stopped' | 'playing' | 'paused' | 'ended' | 'startPlaying';

export type SeekType = 'backward' | 'forward';

export type GoType = 'next' | 'prev';

export type FileItemType = 'dir' | 'file';

export type RepeatType = 'none' | 'daily' | 'weekdays' | 'weekends';

export class FileItem {
    public playing: boolean = false;
    constructor(
        public name: string,
        public path: string,
        public options: Array<string>,
        public type: FileItemType,
        public backendId: string
    ){}
}

export class AlarmType {
    public id: string;
    public title: string;
    public date: Date;
    public command: CommandType;
    public item: FileItem;
    public enabled: boolean;
    public triggered: number;
    public repeat: RepeatType | number;
}

export interface BrowserBackendInterface {
    id: string;
    sortDefault: boolean;

    error: EventEmitter<string>;
    
    navigate(path: string): Promise<Array<FileItem>>;
    mkdir?: (where: string, name: string) => Promise<boolean>;
}

export function Backend(type: string){
    if (typeof(BackendsCollection.backends.get(type)) == 'undefined'){
        BackendsCollection.backends.set(type, new Array<Function>());
    }
    return (target: Function) => {
        BackendsCollection.backends.get(type).push(target);
    }
}

export interface BackendConsumerInterface {
    addBackend(backend: any);
}

export class BackendsCollection {
    public static backends: Map<string, Array<Function>> = new Map<string, Array<Function>>();
    private static instances: Map<string, PlayerBackendInterface> = new Map<string, PlayerBackendInterface>();

    public static consumeBackends(type: string, who: BackendConsumerInterface){
        for (let backendType of BackendsCollection.backends.get(type)){
            let v = BackendsCollection.get(backendType);
            who.addBackend(v);
        }
    }

    public static get(type: Function): any{
        let result: PlayerBackendInterface = BackendsCollection.instances.get(type.name);
        if (typeof(result) == 'undefined' || result == null){
            result = Reflect.construct(type, []);
            BackendsCollection.instances.set(type.name, result);
        }

        return result;
    }

    public static search(type: string): any{
        return BackendsCollection.instances.get(type);
    }
}

export abstract class WebsocketBase {
    protected ws: SimpleNgWebSocket;
    protected uuid: string;
    public error: EventEmitter<string> = new EventEmitter<string>();
    public opened: EventEmitter<boolean> = new EventEmitter<boolean>();

    protected abstract onMessage(result: Object);

    constructor(){
        this.ws = ServiceInjector.injector.get(SimpleNgWebSocket);
        this.uuid = UUID.UUID();
        this.ws.on('message', (evt: any) => {
            let result: any = evt.data == "" ? {} : JSON.parse(evt.data);
            if (result.callback_id && result.callback_id == this.uuid){
                this.onMessage(result.data);
            }
        });
        this.ws.on('open', (evt: any) => this.opened.emit(true));
        this.ws.on('error', (ev: ErrorEvent) => this.error.emit(ev.message));
    }
}

export type KeyboardType = 'text' | 'numerical';
