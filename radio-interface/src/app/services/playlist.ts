import { Backend, BrowserBackendInterface, FileItem, PlaylistItem } from "../shared/types";
import { PlayerService } from "./player";
import { EventEmitter } from "@angular/core";
import { ServiceInjector } from "../app.module";

@Backend('browser')
export class PlaylistBrowserBackend implements BrowserBackendInterface {
    id: string = 'playlistBrowser';
    private player: PlayerService;
    public sortDefault = false;
    public error: EventEmitter<string> = new EventEmitter<string>();

    constructor(){
        this.player = ServiceInjector.injector.get(PlayerService);
    }

    navigate(path: string): Promise<Array<FileItem>>{
        let callback: Function;
        let result: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => callback = resolve);
        if (path == null){
            let items: Array<FileItem> = PlaylistItem.toFileItems(this.player.getPlaylist(), 'file');
            if (items.length > 1){
                items = [new FileItem('Save as playlist', 'save-as-playlist', [], 'file', '')].concat(items);
            }

            callback(items);
        }
        return result;
    }
}
