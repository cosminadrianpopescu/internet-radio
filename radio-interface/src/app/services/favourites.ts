import { Injectable, EventEmitter } from "@angular/core";
import { CacheService } from "./cache";
import { FileItem, Backend, BrowserBackendInterface } from "../shared/types";
import { ServiceInjector } from "../app.module";

@Injectable()
export class FavouritesService{
    private cache: CacheService;
    public error: EventEmitter<string> = new EventEmitter<string>();

    constructor(){
        this.cache = ServiceInjector.injector.get(CacheService);
    }

    private getItemFolder(item: FileItem): string {
        return item.options && item.options.length > 0 ? item.options[0] : null;
    }

    public get(folder?: string): Array<FileItem>{
        if (typeof(folder) == 'undefined'){
            folder = null;
        }

        return this.cache.get('localFavourites', []).filter(item => this.getItemFolder(item) == folder);
    }

    public getFlat(): Array<FileItem> {
        return this.cache.get('localFavourites', []);
    }

    public add(toAdd: FileItem, folder?: string){
        toAdd = Object.assign({}, toAdd);
        if (typeof(folder) == 'undefined'){
            folder = null;
        }
        let favourites : Array<FileItem> = this.getFlat();
        let item = favourites.find(item => item.path == toAdd.path && this.getItemFolder(item) == folder);

        if (item == null){
            toAdd.options = [folder];
            favourites.push(toAdd);
            this.cache.set('localFavourites', favourites);
        }
        else {
            this.error.emit(`There is already an item with the ${item.path} url in the same folder`);
        }
    }

    public mkdir(name: string){
        let favourites: Array<FileItem> = this.get();
        let item = favourites.find(value => value.name == name);

        if (item == null){
            let item = new FileItem(name, name, [], 'dir', '');
            favourites.push(item);
            this.cache.set('localFavourites', favourites);
        }
        else {
            this.error.emit(`A folder named ${name} exists already`);
        }
    }

    public rmdir(name: string){
        let favourites: Array<FileItem> = this.get().filter(item => item.name != name || item.type != 'dir')
            .filter(item => (item.type == 'file' && this.getItemFolder(item) != name) || item.type == 'dir');
        this.cache.set('localFavourites', favourites);
    }

    public remove(url: string, folder?: string){
        if (typeof(folder) == 'undefined'){
            folder = null;
        }

        this.cache.set('localFavourites', this.getFlat()
            .filter(item => item.path != url || this.getItemFolder(item) != folder));
    }
}

@Backend('browser')
export class FavouritesBrowser implements BrowserBackendInterface{
    id: string = 'favouritesBrowser';
    public sortDefault = true;
    private favourites: FavouritesService;

    public error: EventEmitter<string> = new EventEmitter<string>();

    constructor(){
        this.favourites = ServiceInjector.injector.get(FavouritesService);
        this.favourites.error.subscribe(err => this.error.emit(err));
    }

    navigate(path: string): Promise<Array<FileItem>>{
        let callback: Function;
        let result: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => callback = resolve);
        let favourites: Array<FileItem> = this.favourites.get(path);

        if(path != null){
            favourites = favourites.concat([new FileItem('..', null, [], 'dir', '')]);
        }

        favourites.forEach(item => item.options = item.type == 'dir' ? [] : ['delete', 'enque']);

        callback(favourites);

        return result;
    }

    public mkdir(where: string, name: string): Promise<boolean>{
        let callback: Function;
        let result: Promise<boolean> = new Promise<boolean>((resolve, reject) => callback = resolve);

        this.favourites.mkdir(name);
        callback(true);

        return result;
    }
}
