import { Idle } from "@ng-idle/core";
import { ServiceInjector } from "../app.module";
import { OnInit } from "@angular/core";
import { DEFAULT_INTERRUPTSOURCES } from "@ng-idle/core";
import { BaseComponentWithSubscribers } from "./component";

export abstract class BaseIdle extends BaseComponentWithSubscribers implements OnInit{
    protected idle: Idle;

    constructor() {
        super();
        this.idle = ServiceInjector.injector.get(Idle);
    }

    protected startIdle(){
        this.idle.setIdle(this.idleInterval());
        this.idle.watch();
    }

    protected abstract onStart();

    protected abstract onEnd();

    protected abstract idleInterval(): number;

    protected abstract idleOnInit();

    ngOnInit(){
        this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);
        this.connect(this.idle.onIdleStart, () => this.onStart());
        this.connect(this.idle.onIdleEnd, () => this.onEnd());
        this.idleOnInit();
    }
}
