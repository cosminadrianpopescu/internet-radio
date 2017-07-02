import { EventEmitter, Injectable } from "@angular/core";
import { WebsocketBase } from "../shared/types";
import { CONFIG } from "../shared/config";
import { ServiceInjector } from "../app.module";
import { UUID } from "./uuid";

@Injectable()
export class LocalStorage extends WebsocketBase {
    public ready: EventEmitter<boolean> = new EventEmitter<boolean>();
    constructor(){
        super();
        this.config = ServiceInjector.injector.get(CONFIG);
        this.opened.subscribe(result => this.loadFromDisk());
    }

    public data: Object = null;
    private config: CONFIG;
    private isReady: boolean = false;
    private storageName = 'radio-interface.data';

    protected onMessage(result: any){
        this.data = JSON.parse(result);
        this.isReady = true;
        this.ready.emit(true);
    }

    private loadFromDisk(){
        this.ws.send({command: 'read_file', args: {file: this.config.storageLocation + this.storageName}, callback_id: this.uuid + "",});
    }

    private saveToDisk(){
        if (!this.isReady){
            return ;
        }
        this.ws.send({command: 'save_file',
                     args: {name: this.storageName, path: this.config.storageLocation,
                     content: JSON.stringify(this.data)}});
    }

    public getItem(key: string) : string {
        return this.data[key];
    }

    public del(key: string){
        if (this.data[key]){
            delete this.data[key];
            this.saveToDisk();
        }
    }

    public setItem(key: string, value: string){
        this.data[key] = value;
        this.saveToDisk();
    }
}
