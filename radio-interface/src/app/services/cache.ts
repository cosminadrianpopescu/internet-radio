import { EventEmitter, Injectable } from "@angular/core";
import { LocalStorage } from "./local-storage";
import { ServiceInjector } from "../app.module";

class CacheValue {
    value: any;
    duration: Date;
}

@Injectable()
export class CacheService {
    private localStorage: LocalStorage;
    public ready: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor() {
        this.localStorage = ServiceInjector.injector.get(LocalStorage);
        this.localStorage.ready.subscribe(result => this.ready.emit(result));
    }

    set(key: string, value: any, duration?: number){
        let item : CacheValue = new CacheValue();
        item.value = value;
        if (duration){
            let d: Date = new Date();
            d.setSeconds(d.getSeconds() + duration);
            item.duration = d;
        }
        this.localStorage.setItem(key, JSON.stringify(item));
    }

    get(key: string, defaultValue?: any): any{
        if (this.localStorage.data[key]){
            let item : CacheValue = JSON.parse(this.localStorage.data[key]);
            let value : any = item.value;
            if (item.duration){
                var d1 = new Date(item.duration);
                var d2 = new Date();
                if (d1 < d2){
                    value = null;
                    this.localStorage.del(key);
                }
            }

            return value;
        }

        if (typeof(defaultValue) == 'undefined') {
            defaultValue = null;
        }

        return defaultValue;
    }

    del(key: string){
        this.localStorage.del(key);
    }

    list() {
        console.log('cache is', this.localStorage);
    }
}
