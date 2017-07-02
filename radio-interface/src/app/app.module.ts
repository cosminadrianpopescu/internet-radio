import { BrowserModule } from '@angular/platform-browser';
import { PlatformRef, Injector, Injectable, ViewContainerRef, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';

import { RouterOutlet, RouterModule, Routes } from '@angular/router';
import { RootController } from "./controllers/root.controller";
import { CacheService } from "./services/cache";
import { TestController } from "./controllers/test.controller";
import { LocalStorage } from "./services/local-storage";
import { CommonsService } from "./services/commons";
import { ButtonsModule, TimepickerModule, ModalModule } from "ng2-bootstrap";
import { CONFIG } from "./shared/config";
import { FavouritesService } from "./services/favourites";
import { CurrentWeatherService , ForecastWeatherService } from "./services/weather";
import { DateTimeService } from "./services/date-time";
import { YoutubeInfoService } from "./services/youtube";
import { PlayerService } from "./services/player";
import { SimpleNgWebSocket, CONNECT_URL, LOGGER } from 'simple-ng-websocket/index';
import { VlcBackend } from "./services/vlc";
import { FilesBrowserBackend } from "./services/files";
import { BrowserService } from "./services/browser";
import { Dialog } from "./shared/dialog";
import { Browser } from "./shared/browser";
import { Keyboard } from "./shared/keyboard";
import { HistoryService , KeyboardHistoryService, HistoryBrowser } from "./services/history";
import { KeyboardHistoryBrowser } from "./services/history-browsers";
import { RadioBrowser } from "./services/radio";
import { AlarmsService, AlarmsBrowser } from "./services/alarms";
import { DirBrowser } from "./services/dir";
import { PlaylistBrowserBackend } from "./services/playlist";
import { TimerService, TimerBrowserBackend } from "./services/timer";
import { RadiotimePipe, MyDatePipe } from "./shared/pipes";
import { NgIdleModule, Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { Screensaver } from "./shared/screensaver";
import { Scroll } from "./shared/scroll";
import { AlarmsController } from "./controllers/alarms.controller";
import { SourceSelect } from "./shared/open-dialog";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { TimersController } from "./controllers/timers.controller";
import { ShutdownService } from "./services/shutdown";
import { Info } from "./shared/info";
import { NouisliderModule } from 'ng2-nouislider';
import { PlayerSpinner } from "./shared/spinner";
import { PersistentLogger } from "./services/persistent-logger";

const routes : Routes = [
    {path: 'root', component: RootController},
    {path: 'test', component: TestController},
    {path: 'alarms', component: AlarmsController},
    // {path: 'alarm-edit', component: AlarmsEditController},
    {path: 'timers', component: TimersController},
];

export class ServiceInjector {
    public static injector: Injector;
}

@NgModule({
    declarations: [
        AppComponent, RootController, TestController, Dialog, Browser, Keyboard, RadiotimePipe, MyDatePipe, Screensaver, Scroll,
        AlarmsController, SourceSelect, TimersController, Info, PlayerSpinner,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        RouterModule.forRoot(routes, {useHash: true}),
        ModalModule.forRoot(),
        NgIdleModule.forRoot(),
        NgbModule.forRoot(),
        TimepickerModule.forRoot(),
        ButtonsModule.forRoot(),
        NouisliderModule,
    ],
    bootstrap: [AppComponent],
    providers: [CacheService,
        LocalStorage,
        CommonsService,
        CONFIG,
        FavouritesService,
        CurrentWeatherService,
        ForecastWeatherService,
        DateTimeService,
        YoutubeInfoService,
        PlayerService,
        VlcBackend,
        FilesBrowserBackend,
        BrowserService,
        DirBrowser,
        PlaylistBrowserBackend,
        TimerService,
        TimerBrowserBackend,
        PersistentLogger,
        HistoryBrowser,
        ShutdownService,
        SimpleNgWebSocket,
        {provide: CONNECT_URL, useValue: 'ws://localhost:1234'},
        HistoryService,
        KeyboardHistoryService,
        KeyboardHistoryBrowser,
        Idle,
        RadioBrowser,
        AlarmsService,
        AlarmsBrowser,
    ],
})
export class AppModule {
    constructor(private injector: Injector){
        ServiceInjector.injector = injector;
        let weather: CurrentWeatherService = injector.get(CurrentWeatherService);
        weather.ready.subscribe(() => weather.refreshWeather());
        let forecast: ForecastWeatherService = injector.get(ForecastWeatherService);
        forecast.ready.subscribe(() => forecast.refreshWeather());
    }
}
