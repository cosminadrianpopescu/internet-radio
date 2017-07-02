import { EventEmitter, Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";

@Injectable()
export class DateTimeService {
    public dateChanged: EventEmitter<Date> = new EventEmitter<Date>();
    public timeChanged: EventEmitter<Date> = new EventEmitter<Date>();
    public tick: EventEmitter<Date> = new EventEmitter<Date>();
    private mockDate: Date = null;

    private last_time: Date = new Date();

    constructor() {
        Observable.interval(1000).subscribe((x) => {
            if (window['mockDate']){
                this.mockDate = window['mockDate'];
                window['mockDate'] = null;
            }
            var d = new Date();
            if (this.mockDate != null){
                this.mockDate.setSeconds(this.mockDate.getSeconds() + 1);
                d = new Date(this.mockDate.getTime());
            }

            var dirty = false;
            if (d.getHours() != this.last_time.getHours() || d.getMinutes() != this.last_time.getMinutes()){
                this.timeChanged.emit(d);
                dirty = true;
            }
            if (d.getDate() != this.last_time.getDate() ||
                d.getMonth() != this.last_time.getMonth() ||
                d.getFullYear() != this.last_time.getFullYear()){
                this.dateChanged.emit(d);
                dirty = true;
            }

            if (dirty){
                this.last_time = d;
            }
            this.tick.emit(d);
        });
    }
}
