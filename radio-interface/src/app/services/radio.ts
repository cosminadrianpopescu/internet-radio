import { EventEmitter, Injectable } from "@angular/core";
import { Backend , BrowserBackendInterface , FileItem, WebsocketBase } from "../shared/types";
import { CONFIG } from "../shared/config";
import { ServiceInjector } from "../app.module";
import { Response, Http } from "@angular/http";

@Backend('browser')
@Injectable()
export class RadioBrowser extends WebsocketBase implements BrowserBackendInterface {
    id: string = 'radioBrowser';
    sortDefault: boolean = true;
    private config: CONFIG;
    private http: Http;
    private callback: Function;

    public error: EventEmitter<string> = new EventEmitter<string>();

    constructor() {
        super();
        this.config = ServiceInjector.injector.get(CONFIG);
        this.http = ServiceInjector.injector.get(Http);
    }

    onMessage(items: any){
        this.callback((<Array<any>>items).map(item => new FileItem(
            item.name,
            (item.type == 'file' ? 'vlc::' : '') + (item.path == 'search' ? 'search::' : item.path),
            item.options ? item.options : [],
            item.type == 'search' ? 'dir' : item.type, this.id
        )));
    }
    
    navigate(path: string): Promise<Array<FileItem>>{
        let result: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => this.callback = resolve);
        let url = this.config.vtunner.baseUrl;
        if (path != null){
            if (path.match(/^search/)){
                path = path.replace(/^search\/(.*)$/, 'SearchForm.asp?sSearchType=&sSearchInput=$1');
            }
        }

        console.log('path is', path);

        this.ws.send({command: 'radio_browser', args: {p: path || ''}, callback_id: this.uuid})

        // this.http.get(url)
        //     .map((response: Response) => response.json())
        //     .subscribe(json => {
        //         this.callback((<Array<any>>json).map(item => new FileItem(
        //             item.name,
        //             (item.type == 'file' ? 'vlc::' : '') + (item.path == 'search' ? 'search::' : item.path),
        //             item.options ? item.options : [],
        //             item.type == 'search' ? 'dir' : item.type, this.id
        //         )));
        //     });

        return result;
    }
}
