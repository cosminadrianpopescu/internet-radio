import { EventEmitter, Injectable } from "@angular/core";
import { BrowserBackendInterface , BackendConsumerInterface , FileItem , BackendsCollection } from "../shared/types";

export class NavigateEvent {
    constructor(public items: Array<FileItem>, public path: string, public id: string){}
}

@Injectable()
export class BrowserService implements BackendConsumerInterface {
    public onNavigate: EventEmitter<NavigateEvent> = new EventEmitter<NavigateEvent>();
    public error: EventEmitter<string> = new EventEmitter<string>();
    private backends: Array<BrowserBackendInterface> = [];

    public addBackend(backend: BrowserBackendInterface){
        backend.error.subscribe(err => this.error.emit(err));
        this.backends.push(backend);
    }

    constructor(){
        BackendsCollection.consumeBackends('browser', this);
    }

    private findBackendById(id: string): BrowserBackendInterface{
        return this.backends.find(backend => backend.id == id);
    }

    private comparator(a: FileItem, b: FileItem): number{
        if (a.type != b.type && (a.type == 'dir' || b.type == 'dir')){
            return a.type == 'dir' ? -1 : 1;
        }

        return a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase() ? -1 : 1;
    }

    public navigate(path: string, id: string, sort?: boolean) {
        let backend: BrowserBackendInterface = this.findBackendById(id);
        if (typeof(sort) == 'undefined'){
            sort = backend.sortDefault;
        }
        if (backend == null){
            this.error.emit("There is no backend with the id " + id);
        }
        else {
            backend.navigate(path).then(items => {
                if (sort){
                    items = items.sort((a, b) => this.comparator(a, b));
                }
                this.onNavigate.emit(new NavigateEvent(items, path, id));
            });
        }
    }

    public mkdir(where: string, name: string, backendId: string): Promise<boolean> {
        let backend: BrowserBackendInterface = this.findBackendById(backendId);
        if (backend && backend.mkdir){
            return backend.mkdir(where, name);
        }
        this.error.emit(`The backend ${backendId} cannot create new folders`);
        let callback: Function;
        let result: Promise<boolean> = new Promise<boolean>((resolve, reject) => callback = resolve);
        callback(false);

        return result;
    }
}
