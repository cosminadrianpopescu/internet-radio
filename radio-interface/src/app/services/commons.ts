import { Injectable } from "@angular/core";
import { Response, Http } from "@angular/http";
import { CONFIG } from "../shared/config";
import { StatusType , YoutubeRequestType, StreamInfoType } from "../shared/types";
import { ServiceInjector } from "../app.module";

@Injectable()
export class CommonsService {
    private http: Http;
    private config: CONFIG;
    constructor(){
        this.http = ServiceInjector.injector.get(Http);
        this.config = ServiceInjector.injector.get(CONFIG);
    }

    private getValue(obj: Object, path: string): any {
        let value: any;
        try {
            eval('value = obj.' + path);
        }
        catch (e){
            return value;
        }
        return value;
    }

    public getArray(obj: Object, path: string): Array<any>{
        let value = this.getValue(obj, path);

        if (typeof(value) != 'undefined' && value != null){
            if (Object.prototype.toString.call(value) == '[object Array]'){
                return value;
            }
            else {
                return [value];
            }
        }

        return [];
    }

    public get(obj: Object, path: string, def?: any): any{
        let value = this.getValue(obj, path);
        if (typeof(value) != 'undefined' && value != null){
            if (typeof(def) == "boolean"){
                value = value == "true" ? true : false;
            }
            return value;
        }

        return def;
    }

    public displayTime(seconds: number): string{
        let h: number = Math.floor(seconds / 3600);
        let min: number = Math.floor((seconds - h * 3600) / 60);
        let sec: number = Math.floor(seconds - h * 3600 - min * 60);

        return (h >= 10 ? h : "0" + h) + ":" + (min >= 10 ? min : "0" + min) + ":" + (sec >= 10 ? sec : "0" + sec);
    }

    public formatTime(d: Date): string {
        let m: number = d.getMinutes();
        let h: number = d.getHours();

        return (h >= 10 ? h : "0" + h) + ":" + (m >= 10 ? m : "0" + m);
    }

    public formatDate(date: Date){
        let d: number = date.getDate();
        let m: number = date.getMonth() + 1;
        let y: number = date.getFullYear();

        return (d >= 10 ? d : "0" + d) + "/" + (m >= 10 ? m : "0" + m) + "/" + y;
    }

    public formatNowPlaying(status: any): string {
        let prefix = status.streamInfo ? 'streamInfo.' : '';
        let txt = this.get(status, prefix + 'now_playing', '');
        if (txt != this.get(status, prefix + 'title', '')){
            txt += (txt == '' ? '' : ' - ') + this.get(status, prefix + 'title', '');
        }

        if (txt == '' && this.get(status, prefix + 'filename') != ''){
            txt = this.get(status, prefix + 'filename');
        }

        return txt;
    }

    // Here I am getting all the results of an available playlist recurively, until maximum 500.
    // For this, I am returning a promise. In the first call, I am making the first api call.
    // Then, if I have more results (nextPageToken), I am calling again the function, but I am passing the
    // promise already created. This promise (which is returned to the user) is resolved in the moment
    // that I have no more pages or more than 500 results. Like this, 
    // we can call this function like makeYoutubeRequest(params).then(result => console.log('result'))
    private _makeYoutubeRequest(type: string,
            q: string,
            maxResults: number,
            callback: Function,
            items: Array<Object>, 
            n: number,
            nextPageToken: string) {

        let url: string = this.config.youtube.apiEndPoint + type;
        this.http.get(`${url}?${q}&part=snippet&key=${this.config.youtube.apiKey}&maxResults=${maxResults}&${nextPageToken}`)
            .map((response: Response) => response.json())
            .subscribe(json => {
                items = items.concat(json.items);
                if (typeof(json['nextPageToken']) !== 'undefined' && n < this.config.youtube.maxPages){
                    this._makeYoutubeRequest(type, q, maxResults, callback, items, ++n, 'pageToken=' + json['nextPageToken']);
                }
                else {
                    callback(items);
                }
            });
    }

    public makeYoutubeRequest(type: YoutubeRequestType, q: string, maxResults?: number) : Promise<Array<Object>>{
        let result: Promise<Array<Object>>;
        let callback: Function;
        result = new Promise<Array<Object>>((resolve, reject) => callback = resolve);
        if (typeof(maxResults) === 'undefined'){
            maxResults = this.config.youtube.maxResults;
        }

        this._makeYoutubeRequest(type, q, maxResults, callback, [], 0, '');

        return result;
    }

    public capitalize(s: string): string{
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
}
