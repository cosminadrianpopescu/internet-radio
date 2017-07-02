import { Backend , FileItem , BrowserBackendInterface } from "../shared/types";
import { Injectable } from "@angular/core";
import { KeyboardHistoryService } from "./history";
import { ServiceInjector } from "../app.module";
import { EventEmitter } from "@angular/core";

@Backend('browser')
@Injectable()
export class KeyboardHistoryBrowser implements BrowserBackendInterface{
    public id: string = 'keyboardHistory';
    public sortDefault: boolean = false;
    private history: KeyboardHistoryService;

    public error: EventEmitter<string> = new EventEmitter<string>();

    constructor() {
        this.history = ServiceInjector.injector.get(KeyboardHistoryService);
    }

    navigate(path: string): Promise<Array<FileItem>>{
        let callback: Function;
        let promise: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => callback = resolve);
        let history: Map<string, Array<string>> = this.history.all();
        let result: Array<FileItem> = [];
        if (path == null){
            Object.keys(history).forEach(key =>
                result.push(<FileItem>{
                    type: 'dir', 
                    path: key,
                    name: key,
                })
            );
        }
        else {
            result.push(<FileItem>{
                type: 'dir', 
                path: null,
                name: '..',
            });

            if (history[path]){
                for(let s of history[path].reverse()){
                    result.push(<FileItem>{
                        type: 'file',
                        path: s,
                        name: s,
                    });
                }
            }
        }
        callback(result);

        return promise;
    }
}
