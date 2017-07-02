import { EventEmitter, Injectable } from "@angular/core";
import { PlayerService } from "./player";
import { ServiceInjector } from "../app.module";
import { StreamInfoType , PlaylistItem, Backend, BrowserBackendInterface, FileItem } from "../shared/types";
import { CacheService } from "./cache";
import { CommonsService } from "./commons";

@Injectable()
export class HistoryService {
    private player: PlayerService;
    private cache: CacheService;

    constructor() {
        this.cache = ServiceInjector.injector.get(CacheService);
        this.player = ServiceInjector.injector.get(PlayerService);
        this.player.streamInfoChanged.subscribe((streamInfo: StreamInfoType) => {
            if ((streamInfo.url == '' || streamInfo.url == null) && 
                (streamInfo.filename == null || streamInfo.filename == '') ||
                (streamInfo.title == '' || streamInfo.title == null)){
                return ;
            }
            let r: RegExp = /^file:\/\/.*youtube\/([^\/]+)$/gi;
            if (streamInfo.filename != null && streamInfo.filename.match(r) && streamInfo.title == streamInfo.filename.replace(r, '$1')){
                return ;
            }
            let history: Array<StreamInfoType> = this.cache.get('history', []);
            let lastItem: StreamInfoType = null;
            if (history.length > 0){
                lastItem = history[history.length - 1];
            }
            if (lastItem == null || lastItem.title != streamInfo.title){
                history.push(streamInfo);
                while (history.length >= 100){
                    history.shift();
                }

                this.cache.set('history', history);
            }
        });
    }
}

@Injectable()
export class KeyboardHistoryService {
    private commons: CommonsService;
    private cache: CacheService;

    constructor() {
        this.cache = ServiceInjector.injector.get(CacheService);
        this.commons = ServiceInjector.injector.get(CommonsService);
    }

    public all(): Map<string, Array<string>> {
        return <Map<string, Array<string>>>this.cache.get('keyboardHistory', new Map<string, Array<string>>());
    }

    public get(categ: string): Array<string> {
        let history: Map<string, Array<string>> = this.all();
        if (typeof(history[categ]) == 'undefined'){
            return [];
        }
        return history[categ];
    }

    public add(type: string, input: string){
        let history: Map<string, Array<string>> = this.all();
        let collection: Array<string> = this.commons.get(history, type, []);
        collection.push(input);
        if (collection.length >= 100){
            collection.shift();
        }
        history[type] = collection;
        this.cache.set('keyboardHistory', history);
    }

    public del(categ: string){
        let history: Map<string, Array<string>> = this.all();
        if (typeof(history.get(categ)) != 'undefined'){
            delete history[categ];
            this.cache.set('keyboardHistory', history);
        }
    }
}

@Backend('browser')
export class HistoryBrowser implements BrowserBackendInterface {
    id: string = 'historyBrowser';
    public sortDefault = false;
    private cache: CacheService;
    public error: EventEmitter<string> = new EventEmitter<string>();

    constructor(){
        this.cache = ServiceInjector.injector.get(CacheService);
    }

    navigate(path: string): Promise<Array<FileItem>>{
        let callback: Function;
        let result: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => callback = resolve);
        let history: Array<StreamInfoType> = this.cache.get('history', []);
        callback(history.reverse().map(item => new FileItem(item.title,
                                                   item.backend + '::' + (item.filename ? item.filename : item.url),
                                                   ['enque'],
                                                   'file',
                                                   item.backend))
                );
        return result;
    }
}
