import { EventEmitter, OnDestroy } from "@angular/core";

export class BaseComponentWithSubscribers implements OnDestroy {
    private subscriptions: Array<any> = [];

    public connect(ev: EventEmitter<any>, callback: Function){
        this.subscriptions.push(ev.subscribe(callback));
    }

    public ngOnDestroy(){
        this.subscriptions.forEach((item) => item.unsubscribe());
    }
}
