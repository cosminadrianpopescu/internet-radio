import { EventEmitter, Injectable } from "@angular/core";
import { Backend , PlayerBackendInterface , StreamInfoType , StateType , StatusType , PlaylistItem, WebsocketBase } from "../shared/types";
import { SimpleNgWebSocket } from "simple-ng-websocket/index";
import { ServiceInjector } from "../app.module";
import { UUID } from "./uuid";

class EventCallback {
    constructor(public callback: Function, public id: string){};
}

@Backend('player')
export class VlcBackend extends WebsocketBase implements PlayerBackendInterface {
    id: string = "vlc";

    private callbacks: Array<EventCallback> = [];

    streamInfoChanged: EventEmitter<StreamInfoType> = new EventEmitter<StreamInfoType>();
    positionChanged: EventEmitter<number> = new EventEmitter<number>();
    stateChanged: EventEmitter<StateType> = new EventEmitter<StateType>();

    private triggerEvents(key: string, status: any){
        let r: RegExp = /^error/gi;
        if (key.match(r)){
            this.error.emit(`There was an error with VLC: ${key.replace(r, '')}`);
        }
        else if (key == 'state'){
            this.stateChanged.emit(status.state);
        }
        else if (key == 'streamInfo'){
            let info: StreamInfoType = (<StatusType>status).streamInfo;
            this.streamInfoChanged.emit((<StatusType> status).streamInfo);
        }
        else if (key == 'position'){
            this.positionChanged.emit(status.position * status.length);
        }
    }

    private sendCommand(command: Object, callback?: Function){
        if (callback){
            let id: string = UUID.UUID();
            this.callbacks.push(new EventCallback(callback, id))
            command['callback_id'] = id;
        }
        this.ws.send(command, true);
    }

    protected onMessage(result: any){}

    constructor(){
        super();
        this.ws.on('message', (evt: any) => {
            let result: any = evt.data == "" ? {} : JSON.parse(evt.data);
            if (result.callback_id){
                for (let callback of this.callbacks){
                    if (callback.id == result.callback_id){
                        let data: Object = typeof(result.data) == 'string' ? JSON.parse(result.data) : result.data;
                        callback.callback(data);
                        this.callbacks = this.callbacks.filter((callback, idx) => callback.id != result.callback_id);
                        break;
                    }
                }
            }
            else if (result.event){
                this.triggerEvents(result.event, result.status);
            }
        });
    }

    getStatus(): Promise<StatusType>{
        let callback: Function;
        let result: Promise<StatusType> = new Promise<StatusType>((resolve, reject) => callback = resolve);
        this.sendCommand({command: 'get_status', args: null}, callback);

        return result;
    }

    play(url: string){
        this.sendCommand({command: 'openUrl', args: {url: url.replace(/^file:\/\//gi, '')}});
    }

    seek(where: number){
        this.getStatus().then((status) => {
            this.sendCommand({command: 'seek_forward', args: {time: Math.round((where / status.length) * 100)}});
        });
    }

    pause(){
        this.sendCommand({command: 'pause', args: null});
    }

    resume(){
        this.sendCommand({command: 'play', args: null});
    }

    stop(){
        this.sendCommand({command: 'stop', args: null});
    }

    getMetadata(url: string): Promise<Array<PlaylistItem>>{
        let callback: Function;
        let result: Promise<Array<PlaylistItem>> = new Promise<Array<PlaylistItem>>((resolve, reject) => callback = resolve);
        if (url.match(/\.playlist$/gi)){
            this.sendCommand({command: 'read_file', args: {file: url}}, (items) => callback(items));
        }
        else {
            this.sendCommand({command: 'get_metadata', args: {url: url}}, (items) => 
                callback(items.map(item => new PlaylistItem(Math.round(item.duration / 1000), UUID.UUID() + "", item.name, false, 0, item.uri))));
        }
        return result;
    }
}
