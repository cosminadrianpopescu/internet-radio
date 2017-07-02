import { ElementRef, ViewChild, OnInit, Component } from "@angular/core";
import { CONFIG } from "./config";
import { ServiceInjector } from "../app.module";
import { TimerService } from "../services/timer";
import { CommonsService } from "../services/commons";
import { StatusType, Time, WeatherData } from "./types";
import { DateTimeService } from "../services/date-time";
import { PlayerService } from "../services/player";
import { CurrentWeatherService } from "../services/weather";
import { BaseIdle } from "./idle";
import { PersistentLogger } from "../services/persistent-logger";

@Component({
    selector: 'screensaver',
    templateUrl: '../html/screensaver.html',
})
export class Screensaver extends BaseIdle implements OnInit{
    private config: CONFIG;
    private colors: Object;
    private isTimerSet: boolean = false;
    private timer: TimerService;
    private weather: CurrentWeatherService;
    private commons: CommonsService;
    private dateTime: DateTimeService;
    private logger: PersistentLogger;
    private player: PlayerService;
    private time: Time = null;
    private timeColor: string;
    private playingColor: string;
    private dateColor: string;
    private date: Date = new Date();
    private nowPlaying: string = null;
    private visible: boolean = false;
    private weatherText: string;
    @ViewChild('weatherDiv') weatherDiv: ElementRef;
    @ViewChild('playingDiv') playingDiv: ElementRef;
    @ViewChild('dateDiv') dateDiv: ElementRef;
    @ViewChild('timeDiv') timeDiv: ElementRef;

    private setStatus(){
        this.player.getStatus().then(status => this.setPlayerStatus(status));
    }

    private setWeather(weather: WeatherData){
        let icon: string = this.weather.getIcon(weather.data, weather.iconIdx);
        this.weatherDiv.nativeElement.setAttribute('style', `background-image: url(${icon})`);
        this.weatherText = this.weather.formatTemp(weather.data.main.temp);
    }

    constructor(){
        super();
        this.config = ServiceInjector.injector.get(CONFIG);
        this.timer = ServiceInjector.injector.get(TimerService);
        this.commons = ServiceInjector.injector.get(CommonsService);
        this.dateTime = ServiceInjector.injector.get(DateTimeService);
        this.logger = ServiceInjector.injector.get(PersistentLogger);
        this.player = ServiceInjector.injector.get(PlayerService);
        this.weather = ServiceInjector.injector.get(CurrentWeatherService);

        this.connect(this.timer.tick, t => this.time = t);
        this.connect(this.weather.weatherChanged, weather => this.setWeather(weather));
        this.connect(this.dateTime.dateChanged, d => this.setDate(d)); 
        this.connect(this.dateTime.timeChanged, d => this.setDate(d));
        this.connect(this.player.stateChanged, state => this.setStatus());
    }

    protected onStart(){
        this.visible = true;
    }

    protected onEnd(){
    }

    protected idleInterval(): number{
        return this.config.idleInterval;
    }

    protected idleOnInit(){
        this.startIdle();
        this.colors = this.config.screensaver.colors;
        this.colors['key'] = null;
        this.isTimerSet = this.timer.isSet();

        this.setDate(this.date);
        this.setColors(this.date);
        this.setStatus();

        if (this.weather.get() != null){
            this.setWeather(this.weather.get());
        }
    }

    private setColors(d: Date){
        let key: string = '_' + (Math.floor(d.getMinutes() / 10) * 10);

        if (key != this.colors['key']){
            this.colors['key'] = key;
            this.timeDiv.nativeElement.setAttribute('style', `color: ${this.colors[key].timeColor}`);
            this.dateDiv.nativeElement.setAttribute('style', `color: ${this.colors[key].dateColor}`);
            this.playingDiv.nativeElement.setAttribute('style', `color: ${this.colors[key].playingColor}`);
        }
    }

    private setDate(d: Date){
        this.date = d;
        this.setColors(d);
    }

    private setPlayerStatus(status: StatusType){
        if (status.state != "stopped"){
            this.nowPlaying = this.commons.formatNowPlaying(status);
        }
        else {
            this.nowPlaying = '';
        }
    }

    private click(ev: MouseEvent, reason: string){
        ev.cancelBubble = true;
        ev.preventDefault();
        setTimeout(() => {
            this.idle.stop();
            this.visible = false;
            this.startIdle();
        });
    }
}
