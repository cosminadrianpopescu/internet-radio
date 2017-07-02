import { Injectable } from '@angular/core';


@Injectable()
export class CONFIG {
    youtube = new class {
        url: string = 'http://popestii.eu/rpi/favourites/main.php?c=playlist_json&ts=1445283206-playlists'; 
        channelId: string = 'UCmwocxSgqhULM1PwnROQbfw';
        useIframeAPI: boolean = true;
        apiKey: string = 'AIzaSyBEn76_dANQJPx9P-y0sLaHRbyFrWoFzGY';
        apiEndPoint: string = 'https://www.googleapis.com/youtube/v3/';
        playlistBaseUrl: string = 'https://youtube.com/playlist?list=';
        maxResults: number = 50;
        maxPages: number = 1;
        defaultVideoUri: string = 'https://www.youtube.com/watch/';
        videoKind: string = 'youtube#video';
        playlistKind: string = 'youtube#playlist';
    };
    favourites: Object = {};
    statusIntervalCheck: number = 1000;
    seek: number = 10; // percent
    playerImplementation: string = 'playerProxy';
    idleInterval: number = 20; // seconds
    alarmUrl: string = 'http://localhost:8080/app/ogg/alarm.ogg';
    storageLocation: string = '/home/pi/.cache/';
    replaceConsoleLog: boolean = false;
    screensaver = new class {
        colors = new class {
            _0 = new class {timeColor: string = 'white'; dateColor: string = 'white'; playingColor: string = 'green'}; 
            _10 = new class {timeColor: string = '#f10e0e'; dateColor: string = '#f10e0e'; playingColor: string = 'cyan'}; 
            _20 = new class {timeColor: string = '#ff7dff'; dateColor: string = '#ff7dff'; playingColor: string = 'green'}; 
            _30 = new class {timeColor: string = '#fffc00'; dateColor: string = '#fffc00'; playingColor: string = '#f10e0e'}; 
            _40 = new class {timeColor: string = '#ed8c2e'; dateColor: string = '#ed8c2e'; playingColor: string = 'white'}; 
            _50 = new class {timeColor: string = 'green'; dateColor: string = '#008000'; playingColor: string = '#f10e0e'}; 
        };
    };
    vtunner = new class {
        baseUrl: string = 'http://localhost:8080/vtunner.json?'
    };
    browsersPaths = new class {
        local: string = '/home/pi/Music/';
    };
    weather = new class {
        url: string = 'http://api.openweathermap.org/data/2.5/#operation#?q=brussels&appid=8d7808c9c4ff0854efe59f8721100a2b&units=metric';
        updateCurrentInterval: number = 30; // minutes
        updateForecastInterval: number = 6; // hours
    };
}


