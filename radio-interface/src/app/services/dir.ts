import { Backend, BrowserBackendInterface, FileItem, WebsocketBase } from "../shared/types";
import { EventEmitter } from "@angular/core";
import { SimpleNgWebSocket } from "simple-ng-websocket/index";
import { ServiceInjector } from "../app.module";

@Backend('browser')
export class DirBrowser extends WebsocketBase implements BrowserBackendInterface {
    id: string = 'dirBrowser';
    public sortDefault = true;
    private callback: Function;

    protected onMessage(items: Array<FileItem>){
        items = items.filter(item => item.type == 'dir');
        items.forEach(item => item.options = item.name == '..' ? [] : ['select']);
        this.callback(items);
    }

    constructor(){
        super();
    }

    navigate(path: string): Promise<Array<FileItem>>{
        let result: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => this.callback = resolve);
        this.ws.send({command: 'browse_files', args: {path: path}, callback_id: this.uuid + "",});
        return result;
    }
}
