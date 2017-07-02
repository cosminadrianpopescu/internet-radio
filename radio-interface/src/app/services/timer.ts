import { EventEmitter, Injectable } from "@angular/core";
import { Backend, BrowserBackendInterface, FileItem } from "../shared/types";
import { DateTimeService } from "./date-time";
import { ServiceInjector } from "../app.module";
import { CacheService } from "./cache";
import { CommonsService } from "./commons";
import { NgbTimeStruct } from "@ng-bootstrap/ng-bootstrap/timepicker/ngb-time-struct";

@Injectable()
export class TimerService{
    private timer: Date = null;
    private pausedTimer: NgbTimeStruct = null;
    private isBoom: boolean = false;
    private date: DateTimeService;
    private cache: CacheService;
    public boom: EventEmitter<Date> = new EventEmitter<Date>();
    public tick: EventEmitter<NgbTimeStruct> = new EventEmitter<NgbTimeStruct>();
    public hour: number;
    public second: number;
    public minute: number;

    public stop(){
        this.timer = null;
        this.isBoom = false;
    }

    public reset() {
        this.stop();
        this.pausedTimer = null;
    }

    constructor(){
        this.cache = ServiceInjector.injector.get(CacheService);
        this.date = ServiceInjector.injector.get(DateTimeService);
        this.date.tick.subscribe(d => {
            if (this.timer != null){
                if (this.timer <= new Date()){
                    this.boom.emit(this.timer);
                    this.stop();
                    this.isBoom = true;
                    return ;
                }
                let hms: NgbTimeStruct = this.getHMS();
                this.hour = hms.hour;
                this.minute = hms.minute;
                this.second = hms.second;
                this.tick.emit(hms);
            } 
        })
    }

    private getHMS(): NgbTimeStruct {
        let d: Date = new Date();
        let seconds: number = Math.round((this.timer.getTime() - d.getTime()) / 1000);
        let hours: number = Math.floor(seconds / (60 * 60));
        let minutes: number = Math.floor((seconds - hours * 60 * 60) / 60);
        seconds = seconds - hours * 60 * 60 - minutes * 60;

        return <NgbTimeStruct>{hour: hours, minute: minutes, second: seconds};
    }

    public set(hours: number, minutes: number, seconds: number){
        let timers: Array<NgbTimeStruct> = this.cache.get('timers', []);
        let timer = timers.find(t => t.hour == hours && t.minute == minutes && t.second == seconds);
        if (timer == null && this.pausedTimer == null){
            timers.push(<NgbTimeStruct>{hour: hours, minute: minutes, second: seconds});
            this.cache.set('timers', timers);
        }
        this.timer = new Date();
        this.timer.setSeconds(this.timer.getSeconds() + seconds);
        this.timer.setMinutes(this.timer.getMinutes() + minutes);
        this.timer.setHours(this.timer.getHours() + hours);
    }

    public pause(){
        if (this.timer != null){
            this.pausedTimer = this.getHMS();
            this.stop();
        }
    }

    public resume(){
        if (this.pausedTimer != null){
            this.set(this.pausedTimer.hour, this.pausedTimer.minute, this.pausedTimer.second);
            this.pausedTimer = null;
        }
    }

    public isSet(): boolean{
        return this.isBoom || this.timer != null || this.pausedTimer != null;
    }

    public isPaused(): boolean{
        return this.pausedTimer != null;
    }

    public isAlarm(): boolean{
        return this.isBoom;
    }

    public get(): NgbTimeStruct{
        if (this.isBoom){
            return <NgbTimeStruct>{hour: 0, minute: 0, second: 0};
        }

        if (this.timer != null){
            return this.getHMS();
        }

        if (this.pausedTimer != null){
            return this.pausedTimer;
        }

        return null;
    }
}

@Backend('browser')
export class TimerBrowserBackend implements BrowserBackendInterface {
    public id: string = 'timerBrowser';
    public sortDefault: boolean = false;
    public error: EventEmitter<string> = new EventEmitter<string>();
    public cache: CacheService;
    private commons: CommonsService;

    constructor() {
        this.cache = ServiceInjector.injector.get(CacheService);
        this.commons = ServiceInjector.injector.get(CommonsService);
    }

    navigate(path: string): Promise<Array<FileItem>>{
        let callback: Function;
        let promise: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => callback = resolve);

        let timers: Array<NgbTimeStruct> = this.cache.get('timers', []);
        let result: Array<FileItem> = timers.sort((a, b) => {
            if (a.hour > b.hour){
                return 1;
            }
            if (a.hour == b.hour && a.minute > b.minute){
                return 1;
            }
            if (a.hour == b.hour && a.minute == b.minute){
                return a.second > b.second ? 1 : -1;
            }

            return -1;
        })
        .map(t => {
            let l: string = this.commons.displayTime(t.second + t.minute * 60 + t.hour * 60 * 60);
            return new FileItem(l, JSON.stringify(t), [], 'file', '');
        });

        callback([new FileItem('New timer', 'new-timer', [], 'file', '')].concat(result));

        return promise;
    }
}
