import { Input, OnChanges, HostListener, ViewChild, EventEmitter, ViewEncapsulation, OnInit, Component } from "@angular/core";
import { PlayerService } from "../services/player";
import { ServiceInjector } from "../app.module";
import { NouisliderComponent } from "ng2-nouislider/src/nouislider";
import { StatusType, PlaylistItem } from "./types";
import { PersistentLogger } from "../services/persistent-logger";
import { CommonsService } from "../services/commons";
import { BaseComponentWithSubscribers } from "./component";

@Component({
  selector: 'player-spinner',
  templateUrl: '../html/spinner.html',
  styleUrls: ['../css/spinner.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PlayerSpinner extends BaseComponentWithSubscribers implements OnInit, OnChanges {
    private player: PlayerService;
    private logger: PersistentLogger;
    private subscription: any = null;
    private commons: CommonsService;

    private currentPosition: number = 0;
    private disableSpinner: boolean = true;
    private timerId: any = null;
    private activateSeek: boolean = false;
    private currentLength = 0;
    private _currentPosition: string;
    private _currentLength: string;

    @Input() visible: boolean = false;

    @ViewChild('slider') private slider: NouisliderComponent;

    constructor() {
        super();
        this.player = ServiceInjector.injector.get(PlayerService);
        this.logger = ServiceInjector.injector.get(PersistentLogger);
        this.commons = ServiceInjector.injector.get(CommonsService);
        this.player.stateChanged.subscribe(state => {
            this.disableSpinner = state != 'playing';
            if (state != 'playing'){
                this.currentLength = 0;
                return ;
            }
        });
    }

    private displayTime(n: number){
        return n == 0 ? '--:--:--' : this.commons.displayTime(Math.round(n));
    }

    private calculatePosition(pos: number){
        if (this.currentLength == 0){
            this.player.getStatus().then(status => this.currentLength = status.length);
            return ;
        }
        if (this.activateSeek){
            return ;
        }
        let proc: number = (pos / this.currentLength) * 100;
        this.currentPosition = proc;

        this._currentPosition = this.displayTime(pos);
        this._currentLength = this.displayTime(this.currentLength);
    }

    ngOnInit(){
        this.player.getStatus().then(status => this.disableSpinner = status.state != 'playing');
        this.connect(this.slider.start, () => this.activateSeek = true);
        this.connect(this.slider.end, () => this.activateSeek = false);
    }

    private changed(ev: number){
        if (this.activateSeek){
            this.player.seek(ev);
        }
    }

    private subscribe(){
        this.subscription = this.player.positionChanged.subscribe(pos => this.calculatePosition(pos));
    }

    private unsubscribe() {
        this.subscription ? this.subscription.unsubscribe() : true;
    }

    ngOnChanges(changes: any) {
        changes.visible && changes.visible.currentValue ? this.subscribe() : this.unsubscribe();
    }
}
