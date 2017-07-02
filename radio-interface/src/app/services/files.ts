import { BrowserBackendInterface , Backend , FileItem, WebsocketBase } from "../shared/types";
import { SimpleNgWebSocket } from "simple-ng-websocket/index";
import { ServiceInjector } from "../app.module";
import { EventEmitter } from "@angular/core";
import { CONFIG } from "../shared/config";

@Backend('browser')
export class FilesBrowserBackend extends WebsocketBase implements BrowserBackendInterface {
    id: string = 'files';
    sortDefault: boolean = true;

    private callback: Function;
    private config: CONFIG;

    protected onMessage(items: Array<FileItem>){
        this.callback(items.map(item => {
            item.options = (item.type == 'file' ? ['addToFavourites', 'enque'] : []);
            let r: RegExp = /\.playlist$/gi;
            if (item.type == 'file'){
                item.path = (item.path.match(r) ? 'playlists::' : 'vlc::') + item.path;
            }
            return item;
        }));
    }

    constructor() {
        super();
        this.config = ServiceInjector.injector.get(CONFIG);
    }
    
    navigate(path: string): Promise<Array<FileItem>>{
        if (path == null){
            path = this.config.browsersPaths.local;
        }
        let result: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => this.callback = resolve);
        this.ws.send({command: 'browse_files', args: {path: path}, callback_id: this.uuid + "",});
        return result;
    }
}
