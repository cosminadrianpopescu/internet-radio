import { Input, ElementRef, ViewChild, ViewEncapsulation, OnInit, Component } from "@angular/core";
import { InfoType, WeatherData, PlaylistItem } from "./types";
import { ForecastWeatherService } from "../services/weather";
import { ServiceInjector } from "../app.module";
import { TimerService } from "../services/timer";
import { PlayerService } from "../services/player";
import { CommonsService } from "../services/commons";
import { BaseComponentWithSubscribers } from "./component";

@Component({
  selector: 'info',
  templateUrl: '../html/info.html',
  styleUrls: ['../css/info.css'],
  encapsulation: ViewEncapsulation.None,
})
export class Info extends BaseComponentWithSubscribers implements OnInit {
    private isPlaying: boolean = false;
    private info: InfoType = null;
    private weatherService: ForecastWeatherService;
    private timer: TimerService;
    private isTimerSet: boolean = false;
    private player: PlayerService;
    private commons: CommonsService;
    private currentDuration: number;

    constructor() {
        super();
        this.weatherService = ServiceInjector.injector.get(ForecastWeatherService);
        this.timer = ServiceInjector.injector.get(TimerService);
        this.player = ServiceInjector.injector.get(PlayerService);
        this.commons = ServiceInjector.injector.get(CommonsService);

        this.info = this.initInfo();
        this.connect(this.weatherService.weatherChanged, data => this.setInfoWeather(data));

        this.connect(this.player.streamInfoChanged, info => this.setInfoPlaying());
        this.connect(this.player.stateChanged, state => this.setInfoPlaying());
    }

    private initInfo(): InfoType{
        return <InfoType>{
            playing_now: '', 
            playing_next: '',
            position_current: '--:--',
            position_total: '--:--',
            weather: [],
            d: new Date(),
        }
    }

    private setInfoWeather(forecast: WeatherData){
        if (!forecast){
            return ;
        }
        this.isTimerSet = this.timer.isSet();
        if (forecast.data.list.length > 2){
            let arr: Array<Object> = [];
            let icons: Array<string> = [];
            for (var i = 0; i < (this.isTimerSet ? 2 : 3); i++){
                var obj = forecast.data.list[i];
                arr.push({
                    icon: this.weatherService.getIcon(obj, 0),
                    text: this.weatherService.formatTemp(obj.temp.max)
                    + ' / ' + this.weatherService.formatTemp(obj.temp.min),
                    description: obj.weather[0].description,
                });

                icons.push(this.weatherService.getIcon(obj, 0));
            }

            this.info.weather = arr;
            setTimeout(() => {
                icons.forEach((icon, idx) => {
                    document.querySelectorAll(".infoIconToday").item(idx).setAttribute('style', `background-image: url(${icons[idx]})`);
                })
            })
        }
    }

    private setInfoPosition(position){
        this.info.position_current = this.commons.displayTime(Math.round(position));
    }

    private setInfoPlaying(){
        this.player.getStatus().then(status => {
            this.isPlaying = status.state == 'playing';
            if (this.isPlaying){
                this.info.playing_now = this.commons.formatNowPlaying(status);
                let items: Array<PlaylistItem> = this.player.getPlaylist();
                items.forEach((item, idx) => {
                    if (item.playing){
                        this.currentDuration = item.duration ? item.duration : status.length;
                        this.info.position_total = this.commons.displayTime(this.currentDuration);
                    }
                    if (item.playing && idx < items.length - 1){
                        this.info.playing_next = items[idx + 1].name;
                    }
                    else if (item.playing){
                        this.info.playing_next = status.loop ? items[0].name : '';
                    }
                })
            }
        });
    }

    ngOnInit(){
        if (this.weatherService.get() != null){
            this.setInfoWeather(this.weatherService.get());
        }
        this.setInfoPlaying();
    }

    private timerPause(){
        this.timer[this.timer.isPaused() ? 'resume' : 'pause']();
    }
}
