import { CacheService } from "./cache";
import { WeatherData } from "../shared/types";
import { CONFIG } from "../shared/config";
import { Inject, EventEmitter, Injectable } from "@angular/core";
import { Http, Response } from "@angular/http";
import { Observable } from "rxjs/Rx";
import { ServiceInjector } from "../app.module";

export abstract class BaseWeatherService {
    public cacheKey: string;
    public interval: number;
    public operation: string;
    private isReady: boolean = false;

    public weatherChanged: EventEmitter<WeatherData> = new EventEmitter<WeatherData>();
    private cache: CacheService;
    protected config: CONFIG;
    private http: Http;
    public ready: EventEmitter<boolean> = new EventEmitter<boolean>();

    protected abstract init();

    constructor(){
        this.cache = ServiceInjector.injector.get(CacheService);
        this.config = ServiceInjector.injector.get(CONFIG);
        this.http = ServiceInjector.injector.get(Http);

        this.init();

        this.cache.ready.subscribe(() => {
            this.isReady = true;
            this.ready.emit(true);
            this.refreshNotNull();
        });
        Observable.interval(1000 * 60).subscribe((x) => {
            let data: WeatherData = this.get();
            if (data != null && typeof(data.data.weather) != 'undefined' &&  data.data.weather.length > 1){
                data.iconIdx++;
                if (data.iconIdx >= data.data.weather.length){
                    data.iconIdx = 0;
                }
            }
            this.refreshNotNull();
        });
    }

    public get(): WeatherData{
        if (!this.isReady){
            return null;
        }
        return this.cache.get(this.cacheKey);
    }

    private getUrl(): string {
        return this.config.weather.url.replace(/#operation#/, this.operation);
    }

    private refreshNotNull(){
        if (this.get() == null){
            this.refreshWeather();
        }
    }

    public refreshWeather(){
        this.http.get(this.getUrl())
            .map((response: Response) => response.json())
            .subscribe(json => {
                let last_weather: WeatherData = new WeatherData(json, 0);
                this.cache.set(this.cacheKey, last_weather, this.interval);
                this.weatherChanged.emit(last_weather);
            })
    }

    public formatTemp(t: number): string{
        return t.toFixed(1) + '\u2103';
    }

    public getIcon(data: any, idx: number){
        return 'http://openweathermap.org/img/w/' + data.weather[idx].icon + '.png';
    }
}

@Injectable()
export class CurrentWeatherService extends BaseWeatherService {
    protected init(){
        this.interval = this.config.weather.updateCurrentInterval * 60;
        this.cacheKey = 'last_weather';
        this.operation = 'weather';
    }
}

@Injectable()
export class ForecastWeatherService extends BaseWeatherService {
    protected init(){
        this.interval = this.config.weather.updateForecastInterval * 60 * 60;
        this.cacheKey = 'forecast';
        this.operation = 'forecast/daily/';
    }
}
