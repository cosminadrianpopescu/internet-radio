import { EventEmitter, Injectable } from "@angular/core";
import { AlarmType, RepeatType, CommandType, Backend, BrowserBackendInterface, FileItem } from "../shared/types";
import { CacheService } from "./cache";
import { ServiceInjector } from "../app.module";
import { PlayerService } from "./player";
import { Observable } from "rxjs/Rx";
import { CommonsService } from "./commons";
import { UUID } from "./uuid";

@Injectable()
export class AlarmsService{
    private cache: CacheService;
    private player: PlayerService;

    constructor(){
        this.cache = ServiceInjector.injector.get(CacheService);
        this.player = ServiceInjector.injector.get(PlayerService);
        this.cache.ready.subscribe(result => this.setAllAlarms());
    }

    private nextAlarmTime(id: string): Date{
        let alarm: AlarmType = this.get(id);
        if ((alarm.repeat == null || alarm.repeat == 'none') && alarm.triggered > 0){
            return null;
        }
        let d: Date = alarm.date;
        if (typeof(d) == 'string'){
            d = new Date(d);
        }
        if (d > new Date()){
            return d;
        }
        do {
            if (alarm.repeat == 'daily'){
                d.setDate(d.getDate() + 1);
            }
            else if (alarm.repeat == 'weekdays'){
                do {
                    d.setDate(d.getDate() + 1);
                } while (d.getDay() == 6 || d.getDay() == 0);
            }
            else if (alarm.repeat == 'weekends'){
                do {
                    d.setDate(d.getDate() + 1);
                } while (d.getDay() != 6 && d.getDay() != 0);
            }
            else {
                d.setTime(d.getTime() + Number(alarm.repeat));
            }
        } while (d < new Date());

        return d;
    }

    private save(alarm: AlarmType){
        let alarms: Array<AlarmType> = this.list().filter(item => item.id != alarm.id);
        alarms.push(alarm);
        this.cache.set('alarms', alarms);
    }

    private isEnabled(id: string): boolean{
        let alarm: AlarmType = this.get(id);
        return alarm ? alarm.enabled : false;
    }

    private setAlarm(id){
        let alarm: AlarmType = this.get(id);
        if (alarm && !alarm.triggered){
            alarm.triggered = 0;
        }
        let d: Date = new Date();
        let time: number;
        if (alarm.date > d){
            time = alarm.date.getTime() - d.getTime();
        }
        else {
            let next: Date = this.nextAlarmTime(alarm.id);
            if (next == null){
                alarm.enabled = false;
                this.save(alarm);
                return null;
            }

            time = next.getTime() - d.getTime();
            alarm.date = next;
        }

        if (alarm.enabled && time != null){
            let id: string = alarm.id;
            Observable.timer(time).subscribe(() => this.triggerAlarm(id));
        }
        else {
            alarm.enabled = false;
        }
        this.save(alarm);
    }

    private triggerAlarm(id: string){
        let alarm: AlarmType = this.get(id);
        if (typeof(alarm) == 'undefined' || !this.isEnabled(alarm.id)){
            return ;
        }
        if (alarm.command == 'log'){
            console.log('alarm triggered', alarm, new Date());
        }
        else if (alarm.command == 'play'){
            this.player.add(alarm.item.path, true);
        }
        else if (alarm.command == 'stop'){
            this.player.clearAll();
        }
        alarm.triggered++;

        if (alarm.command == 'log'){
            let d: Date = this.nextAlarmTime(alarm.id);
            console.log('next alarm time is', d);
        }

        this.save(alarm);
        this.setAlarm(alarm.id);
    }

    private setAllAlarms(){
        this.list().map(alarm => this.setAlarm(alarm.id));
        this.cache.set('alarms', this.list().filter(alarm => alarm.enabled || alarm.repeat != 'none'));
        console.log('alarms are', this.list());
    }

    public add(title: string, date: Date, repeat: RepeatType | number, command: CommandType, item: FileItem){
        let d: Date = new Date();
        if (date < d){
            date.setDate(date.getDate() + 1);
        }
        let alarm: AlarmType = new AlarmType();
        alarm.title = title;
        alarm.date = date;
        alarm.command = command;
        alarm.item = item;
        alarm.repeat = repeat;
        alarm.enabled = true;
        alarm.triggered = 0;
        alarm.id = UUID.UUID();
        this.save(alarm);
        this.setAlarm(alarm.id);

        return alarm.id;
    }

    public del(id: string){
        this.cache.set('alarms', this.list().filter(alarm => alarm.id != id));
    }

    public list(): Array<AlarmType>{
        let result: Array<AlarmType> = this.cache.get('alarms', []);
        result.forEach(alarm => alarm.date = new Date(alarm.date));
        return result;
    }

    public get(id: string): AlarmType{
        let result: AlarmType = this.list().find(alarm => alarm && alarm.id == id);
        if (result){
            result.date = new Date(result.date);
        }
        return result;
    }

    public disable(id: string){
        let alarm: AlarmType = this.get(id);
        alarm.enabled = false;
        this.save(alarm);
    }

    public enable(id: string){
        let alarm: AlarmType = this.get(id);
        alarm.enabled = true;
        this.save(alarm);
        this.setAlarm(id);
    }

    public update(alarm: AlarmType){
        this.del(alarm.id);
        this.save(alarm);
        this.setAlarm(alarm.id);
    }
}

@Backend('browser')
export class AlarmsBrowser implements BrowserBackendInterface{
    public id: string = 'alarmsBrowser';
    public sortDefault: boolean = false;
    public error: EventEmitter<string> = new EventEmitter<string>();
    private service: AlarmsService;
    private commons: CommonsService;

    constructor() {
        this.commons = ServiceInjector.injector.get(CommonsService);
        this.service = ServiceInjector.injector.get(AlarmsService);
    }

    navigate(path: string): Promise<Array<FileItem>>{
        let callback: Function;
        let promise: Promise<Array<FileItem>> = new Promise<Array<FileItem>>((resolve, reject) => callback = resolve);

        let alarms: Array<AlarmType> = this.service.list().sort((a, b) => a.date <= b.date ? -1 : 1);
        let result: Array<FileItem> = [new FileItem('Add new alarm', null, [], 'file', '')];
        result = result.concat(alarms.map(a => {
            let t: string = this.commons.formatTime(a.date);
            return new FileItem(`${a.title} at ${t} (${a.command})`, a.id, ['delete', a.enabled ? 'disable' : 'enable'], 'file', '');
        }));

        callback(result);

        return promise;
    }
}
