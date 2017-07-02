import { ViewEncapsulation, ViewChild, TemplateRef, Component } from "@angular/core";
import { CacheService } from "../services/cache";
import { CommonsService } from "../services/commons";
import { CONFIG } from "../shared/config";
import { StatusType , StreamInfoType , Item , PlaylistItem, FileItem } from "../shared/types";
import { FavouritesService, FavouritesBrowser } from "../services/favourites";
import { CurrentWeatherService , ForecastWeatherService } from "../services/weather";
import { DateTimeService } from "../services/date-time";
import { YoutubeInfoService } from "../services/youtube";
import { ServiceInjector } from "../app.module";
import { PlayerService } from "../services/player";
import { BrowserService , NavigateEvent } from "../services/browser";
import { Browser , SelectEvent } from "../shared/browser";
import { Dialog } from "../shared/dialog";
import { Keyboard } from "../shared/keyboard";
import { HistoryService , KeyboardHistoryService } from "../services/history";
import { AlarmsService } from "../services/alarms";
import { TimerService } from "../services/timer";
import { PersistentLogger } from "../services/persistent-logger";

class TestFunction {
    constructor(public name: string,public callback: Function){}
}

let tests: Array<TestFunction> = [];

export function ToTest(target: any, key: string, desc: TypedPropertyDescriptor<any>){
    tests.push(new TestFunction(key, desc.value));
}

@Component({
  selector: 'test',
  templateUrl: '../html/test.html',
  styleUrls: ['../css/root.css'],
  encapsulation: ViewEncapsulation.None,
})
export class TestController {
    private cache: CacheService;
    private commons: CommonsService;
    private config: CONFIG;
    private favourites: FavouritesService;
    private currentWeather: CurrentWeatherService;
    private forecastWeather: ForecastWeatherService;
    private dateTime: DateTimeService;
    private youtubeInfo: YoutubeInfoService;
    private playerService: PlayerService;
    private browser: BrowserService;
    private history: HistoryService;
    private kHistory: KeyboardHistoryService;
    private alarms: AlarmsService;
    private timer: TimerService;
    private logger: PersistentLogger;

    constructor (){
        this.cache = ServiceInjector.injector.get(CacheService);
        this.commons = ServiceInjector.injector.get(CommonsService);
        this.config = ServiceInjector.injector.get(CONFIG);
        this.favourites = ServiceInjector.injector.get(FavouritesService);
        this.currentWeather = ServiceInjector.injector.get(CurrentWeatherService);
        this.forecastWeather = ServiceInjector.injector.get(ForecastWeatherService);
        this.dateTime = ServiceInjector.injector.get(DateTimeService);
        this.youtubeInfo = ServiceInjector.injector.get(YoutubeInfoService);
        this.playerService = ServiceInjector.injector.get(PlayerService);
        this.browser = ServiceInjector.injector.get(BrowserService);
        this.history = ServiceInjector.injector.get(HistoryService);
        this.kHistory = ServiceInjector.injector.get(KeyboardHistoryService);
        this.alarms = ServiceInjector.injector.get(AlarmsService);
        this.timer = ServiceInjector.injector.get(TimerService);
        this.logger = ServiceInjector.injector.get(PersistentLogger);
    }

    @ViewChild('formDialog') dlg: Dialog;
    @ViewChild('genericDialog') genDlg: Dialog;
    @ViewChild('filesBrowser') private filesBrowser: Browser;
    @ViewChild('youtubeBrowser') private youtubeBrowser: Browser;
    @ViewChild('radioBrowser') private radioBrowser: Browser;
    @ViewChild('textKeyboard') private textKeyboard: Keyboard;
    @ViewChild('favouritesBrowser') private favBrowser: Browser;
    @ViewChild('plsBrowser') private plsBrowser: Browser;
    @ViewChild('dirBrowser') private dirBrowser: Browser;
    @ViewChild('tBrowser') private tBrowser: Browser;

    get tests() {
        return tests;
    }

    @ToTest
    private testCache() {
        let value : Item = new Item('url', 'title');
        this.cache.set('test', value, 9);
        console.log('value is', this.cache.get('test'));
        this.cache.list();
        setTimeout(() => {
            console.log('value is', this.cache.get('test'));
            this.cache.list();
        }, 10 * 1000);
    }

    @ToTest
    private testCommons(){
        let obj: Object = {
            i1: 'val 1',
            i2: {
                i3: [1, 2, 3],
                i4: 'value',
            }
        }

        console.log('value is', this.commons.getArray(obj, 'i1.i5'));
        console.log('value is', this.commons.getArray(obj, 'i2.i3'));
        console.log('value is', this.commons.getArray(obj, 'i2.i4'));

        console.log('value is', this.commons.get(obj, 'i1.i5', 'ttt'));
        console.log('value is', this.commons.get(obj, 'i2.i3', 'ttt'));
        console.log('value is', this.commons.get(obj, 'i2.i4', 'ttt'));

        console.log('time is', this.commons.displayTime(92));

        let s: StatusType = new StatusType();
        s.streamInfo = new StreamInfoType();
        s.streamInfo.artist = 'My artist';
        s.streamInfo.description = 'Description';
        s.streamInfo.filename = 'file-name';
        s.streamInfo.title = 'my-title';
        s.streamInfo.url = 'my-url';

        console.log('now playing is', this.commons.formatNowPlaying(s));
    }

    @ToTest
    private testYoutube(){
        this.commons.makeYoutubeRequest('playlists', 'channelId=' + this.config.youtube.channelId, 10)
            .then(items => console.log('paginated playlist items are', items));
        this.commons.makeYoutubeRequest('playlists', 'channelId=' + this.config.youtube.channelId)
            .then(items => console.log('playlist items are', items));
        this.commons.makeYoutubeRequest('search', 'q=system of a down&type=video')
            .then(items => console.log('searched video items are', items));
        this.commons.makeYoutubeRequest('search', 'q=system of a down&type=playlist')
            .then(items => console.log('searched playlist items are', items));
    }

    @ToTest
    private testYoutubeInfo(){
        this.youtubeInfo.getVideoInfo(['Q6k0Qpv6oi8', 'xIqaIfaJ3-E'])
            .then(result => console.log("result is", result));
        this.youtubeInfo.getPlaylistInfo('PLDC0E3D2BB4F3D234')
            .then(result => console.log('playlist result is', result));
    }

    @ToTest
    private testDialog(){
        this.dlg.title = 'Open';
        this.dlg.show();
    }

    @ToTest
    private testLogger(){
        this.logger.log([1, 2, 3]);
        this.logger.log({prop: "value1", prop2: "value2"});
        this.logger.log("cosmin");
        this.logger.log(15);
    }

    private answer(answer: string){
        console.log('answer is', answer);
        this.dlg.bsDialog.hide();
        this.genDlg.title = 'An alert';
        this.genDlg.type = 'alert';
        this.genDlg.body = 'Are you sure?';
        this.genDlg.show().then(result => {
            console.log('you selected', result);
            this.genDlg.title = 'A prompt';
            this.genDlg.body = 'Make a choice';
            this.genDlg.type = 'confirm';
            this.genDlg.show().then(result => console.log('you choose', result));
        })
    }

    private printFavourites(){
        console.log('favourites are', JSON.parse(JSON.stringify(this.favourites.getFlat())));
        console.log('favourites in folder 1 are', JSON.parse(JSON.stringify(this.favourites.get('folder 1'))));
        console.log('favourites in root are', JSON.parse(JSON.stringify(this.favourites.get())));
    }

    @ToTest
    private testFavourites(){
        this.favBrowser.error.subscribe(err => console.log("Error is", err));
        this.favourites.add(new FileItem('my name 1', 'url1', [], 'file', 'backend'));
        this.favourites.add(new FileItem('my name 2', 'url2', [], 'file', 'backend'));
        this.favourites.add(new FileItem('my name 2', 'url2', [], 'file', 'backend'));

        this.favourites.mkdir('folder 1');
        this.favourites.mkdir('folder 1');
        this.favourites.mkdir('folder 2');
        this.favourites.add(new FileItem('my name 1', 'url1', [], 'file', 'backend'), 'folder 1');
        this.favourites.add(new FileItem('my name 1', 'url1', [], 'file', 'backend'), 'folder 1');
        this.favourites.add(new FileItem('my name 2', 'url2', [], 'file', 'backend'), 'folder 1');

        this.printFavourites();

        this.favBrowser.itemSelected.subscribe((ev: SelectEvent) => {
            console.log('you selected', ev);
            this.favourites.remove('url1');
            console.log('after remove url1');
            this.printFavourites();
            this.favourites.remove('url2');
            console.log('after remove url2');
            this.printFavourites();
            this.favourites.remove('url1', 'folder 1');
            console.log('after remove url1 from folder 1');
            this.printFavourites();
            this.favourites.rmdir('folder 1');
            console.log('after remove folder 1');
            this.printFavourites();
            this.favourites.rmdir('folder 2');
            console.log('after remove folder 2');
            this.printFavourites();
        })

        this.favBrowser.show(null);
    }

    @ToTest
    private testWeather(){
        console.log("the weather is now", this.currentWeather.get());
        console.log('the forecast is now', this.forecastWeather.get());
        this.cache.del('last_weather');
        this.cache.del('forecast');
        this.currentWeather.weatherChanged.subscribe(data => console.log("weather data is", data));
        this.forecastWeather.weatherChanged.subscribe(data => console.log('forecast data is', data));
    }

    @ToTest
    private testDateTime(){
        console.log('testing the date time service');
        this.dateTime.timeChanged.subscribe(d => console.log('time changed', d));
        this.dateTime.tick.subscribe(d => console.log('this was a tick', d));
    }

    @ToTest
    private testPlayerBackend(){
        this.playerService.stateChanged.subscribe(state => console.log('state is', state));
        this.playerService.positionChanged.subscribe(position => console.log('position is', position));
        this.playerService.streamInfoChanged.subscribe(info => console.log('new stream info is', info));
        this.playerService.error.subscribe(error => console.log('error is', error));

        this.playerService.add('youtube::https://www.youtube.com/watch?v=JxWfvtnHtS0', true);
        setTimeout(() => {
            console.log('1. the playlist is now', this.playerService.getPlaylist());
            this.playerService.clearAll();
            this.playerService.add('youtube::https://www.youtube.com/watch?list=PLPf69IGxwfBFaYBu7pTf6YCABlM7ZL0sq', true);
            setTimeout(() => {
                console.log('2. the playlist is now', this.playerService.getPlaylist());
                this.playerService.add('youtube::https://www.youtube.com/watch?v=JxWfvtnHtS0', false);
                this.playerService.seek('forward');
                console.log('added');
                setTimeout(() => {
                    console.log('3. the playlist is now', this.playerService.getPlaylist());
                    this.playerService.go('next');
                    setTimeout(() => {
                        let items: Array<PlaylistItem> = this.playerService.getPlaylist();
                        console.log('4. the playlist is now', items);
                        this.playerService.playItem(items[items.length - 1].id);
                        setTimeout(() => {
                            this.playerService.shuffle();
                            console.log('5. the playlist is now', this.playerService.getPlaylist());
                            console.log('the history is now', this.cache.get('history', []));
                        }, 10000);
                    }, 10000);
                }, 10000);
            }, 10000);
        }, 10000);
    }

    @ToTest
    private testYoutubeVLC(){
        this.playerService.stateChanged.subscribe(state => console.log('state is', state));
        this.playerService.positionChanged.subscribe(position => console.log('position is', position));
        this.playerService.streamInfoChanged.subscribe(info => console.log('new stream info is', info));
        this.playerService.error.subscribe(error => console.log('error is', error));

        this.playerService.add('vlc-youtube::https://www.youtube.com/watch?v=JxWfvtnHtS0', true);
    }

    @ToTest
    private testVlcBackend() {
        this.playerService.stateChanged.subscribe(state => console.log('state is', state));
        this.playerService.positionChanged.subscribe(position => console.log('position is', position));
        this.playerService.streamInfoChanged.subscribe(info => console.log('new stream info is', info));
        this.playerService.error.subscribe(error => console.log('error is', error));

        this.playerService.add('vlc::/home/lixa/Music/teatru/hangita.ogg', true);
        setTimeout(() => {
            console.log('1. the playlist is now', this.playerService.getPlaylist());
            this.playerService.add('vlc::/home/lixa/Music/playlists/gheorghe-zamfir.playlist', true);
            setTimeout(() => {
                console.log('2. the playlist is now', this.playerService.getPlaylist());
                this.playerService.add('vlc::/home/lixa/Music/teatru/hangita.ogg', false);
                this.playerService.seek(72);
                setTimeout(() => {
                    console.log('3. the playlist is now', this.playerService.getPlaylist());
                    this.playerService.go('next');
                    setTimeout(() => {
                        let items: Array<PlaylistItem> = this.playerService.getPlaylist();
                        console.log('4. the playlist is now', items);
                        this.playerService.playItem(items[items.length - 1].id);
                        setTimeout(() => {
                            this.playerService.shuffle();
                            console.log('5. the playlist is now', this.playerService.getPlaylist());
                            setTimeout(() => {
                                this.playerService.clearAll();
                                console.log('test finished');
                                console.log('the history is now', this.cache.get('history', []));
                            });
                        }, 10000);
                    }, 10000);
                }, 10000);
            }, 10000);
        }, 10000);
    }

    @ToTest
    private testFileBrowserService(){
        this.browser.onNavigate.subscribe((ev: NavigateEvent) => console.log('items are', ev.items));
        this.browser.error.subscribe(msg => console.log('we have error', msg));
        this.browser.navigate('/home/lixa/Music/', 'files');
    }

    @ToTest
    private testFilesBrowser(){
        this.playerService.error.subscribe(error => console.log('error is', error));
        this.filesBrowser.itemSelected.subscribe((ev: SelectEvent) => {
            console.log('you selected', ev);
            this.playerService.add(ev.item.path, true);
            this.youtubeBrowser.itemSelected.subscribe((ev: SelectEvent) => {
                console.log('you selected', ev);
                this.playerService.add(ev.item.path, true);
                this.radioBrowser.itemSelected.subscribe((ev: SelectEvent) => {
                    console.log('you selected', ev);
                    this.playerService.add(ev.item.path, true);
                    console.log("keyboard history is now", this.kHistory.all());
                });
                this.radioBrowser.show(null);
            });
            this.youtubeBrowser.show(null);

        });
        this.filesBrowser.show('/home/lixa/Music/');
    }

    @ToTest
    private testKeyboard(){
        this.textKeyboard.show('text').then(response => {
            console.log('you typed', response);
            this.textKeyboard.show('numerical').then(response => console.log('you typed', response));
        });
    }

    @ToTest
    private testRadioBrowserBackend(){
        this.radioBrowser.itemSelected.subscribe((ev: SelectEvent) => {
            console.log('you selected', ev);
            this.playerService.add(ev.item.path, true);
            this.favourites.add(ev.item, null);
            console.log("keyboard history is now", this.kHistory.all());
            this.favBrowser.itemSelected.subscribe((ev: SelectEvent) => {
                console.log('you selected', ev);
                this.playerService.add(ev.item.path, true);
            });
            this.favBrowser.show(null);
        });
        this.radioBrowser.show(null);
    }

    @ToTest
    private testAlarmService(){
        // console.log('testing alarms');
        // let d: Date = new Date();
        // d.setMilliseconds(d.getMilliseconds() + 5000);
        // let id: string = this.alarms.add('Alarm 1', d, 10000, 'log', null);
        // let id2: string = this.alarms.add('Alarm 2', d, 'weekdays', 'log', null);
        // console.log('id is', id);
        // console.log('id2 is', id2);
        // setTimeout(() => {
        //     this.alarms.disable(id);
        //     console.log('disabled alarm is', this.alarms.get(id));
        // }, 9000);
        // setTimeout(() => {
        //     this.alarms.enable(id);
        //     console.log('enabled alarm is', this.alarms.get(id));
        // }, 18000);
        // setTimeout(() => {
        //     this.alarms.del(id);
        //     this.alarms.del(id2);
        //     console.log('alarms deleted');
        // }, 30000);
        let d: Date = new Date();
        d.setMilliseconds(d.getMilliseconds() + 5000);
        let id: string = this.alarms.add('Alarm 1', d, 'none', 'log', null);
    }

    @ToTest
    private testDirBrowser(){
        this.dirBrowser.itemSelected.subscribe((ev: SelectEvent) => {
            console.log('ev is', ev);
            this.dirBrowser.hide();
        });
        this.dirBrowser.show('/home/lixa/Music/');
    }

    @ToTest
    private testPlaylistBrowser() {
        this.plsBrowser.itemSelected.subscribe((ev: SelectEvent) => console.log('ev is', ev));
        this.playerService.add('youtube::https://www.youtube.com/watch?list=PLPf69IGxwfBFaYBu7pTf6YCABlM7ZL0sq', false)
            .then(items => this.plsBrowser.show(null));
    }

    @ToTest
    private testTimerService() {
        this.timer.boom.subscribe(d => console.log('BOOM at ', d));
        this.timer.tick.subscribe(t => console.log('tick at', t));
        this.timer.set(0, 0, 20);
        setTimeout(() => {
            console.log('timer paused');
            this.timer.pause();
        }, 5000);
        setTimeout(() => {
            console.log('timer resumed');
            this.timer.resume();
        }, 7000);
    }

    @ToTest
    private testTimerBrowser(){
        this.tBrowser.itemSelected.subscribe((ev: SelectEvent) => console.log('ev is', ev));
        this.tBrowser.show(null);
    }
}
