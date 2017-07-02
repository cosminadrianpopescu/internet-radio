import { ViewEncapsulation, OnInit, ViewChild, ElementRef, Component } from "@angular/core";
import { Browser, SelectEvent } from "../shared/browser";
import { PlayerService } from "../services/player";
import { ServiceInjector } from "../app.module";
import { FavouritesService } from "../services/favourites";
import { Dialog } from "../shared/dialog";
import { CONFIG } from "../shared/config";
import { FileItem, PlaylistItem, StateType } from "../shared/types";
import { Keyboard } from "../shared/keyboard";
import { Router } from "@angular/router";
import { SourceSelect } from "../shared/open-dialog";
import { HistoryBrowser, HistoryService } from "../services/history";
import { ShutdownService } from "../services/shutdown";
import { PersistentLogger } from "../services/persistent-logger";
import { BaseComponentWithSubscribers } from "../shared/component";

@Component({
  selector: 'root',
  templateUrl: '../html/root.html',
  styleUrls: ['../css/root.css'],
  encapsulation: ViewEncapsulation.None,
})
export class RootController extends BaseComponentWithSubscribers implements OnInit{
    @ViewChild('buttonsDiv') private buttonsDiv: ElementRef;
    @ViewChild('playlist') playlistBrowser: Browser;
    @ViewChild('dirBrowser') dirBrowser: Browser;
    @ViewChild('alertDlg') alertDlg: Dialog;
    @ViewChild('keyboard') keyboard: Keyboard;
    @ViewChild('sourceSelector') private sourceSelector: SourceSelect;
    @ViewChild('history') private historyBrowser: Browser;
    private browsers: Object = {};
    @ViewChild('openDialog') private dlg: Dialog;
    @ViewChild('errDlg') private errDlg: Dialog;
    @ViewChild('shutdownDlg') private shutdownDlg: Dialog;

    private controlsVisible: boolean = true;
    private filesDefaultPath: string = '';

    private player: PlayerService;
    private favourites: FavouritesService;
    private config: CONFIG;
    private logger: PersistentLogger;
    private router: Router;
    private history: HistoryService;
    private sd: ShutdownService;

    private loading: boolean = false;

    private buttons: Array<Object> = [
        {
            id: 'but-favourites', 
            text: 'Favourites', 
            selected: '',
            click: () => this.sourceSelector.open('favouritesBrowser'),
        },
        {
            id: 'but-open',
            text: 'Open',
            selected: '',
            click: () => this.sourceSelector.sourceDlg.show(),
        },
        {
            id: 'but-stop-all',
            text: 'Clear all', 
            click: () => {
                this.player.clearAll();
                this.loading = false;
            },
        },
        {
            id: 'but-playlist',
            text: 'Playlist',
            selected: '',
            click: () => this.playlistBrowser.show(null),
        },
        {
            id: 'but-control-shuffle',
            text: 'Shuffle',
            selected: '',
            click: () => {
                this.player.shuffle();
                this.alert('Playlist shuffled');
            },
        },
        {
            id: 'but-alarms', 
            text: 'Alarms', 
            click: () => this.router.navigate(['alarms']),
        },
        {
            id: 'but-timer',
            text: 'Timer', 
            click: () => this.router.navigate(['timers']),
        },
        {
            id: 'but-history', 
            text: 'History', 
            click: () => this.historyBrowser.show(null),
        },
        {
            id: 'but-close', 
            text: 'Shut down', 
            click: () => this.shutdownDlg.show(),
        },
    ];

    private controls: Array<Object> = [
        {
            id: 'but-seek-back',
            selected: '',
            hidden: false,
            click: () => this.player.go('prev'),
        },
        {
            id: 'but-play', 
            selected: '',
            hidden: false,
            click: () => this.player.resume(),
        },
        {
            id: 'but-pause', 
            hidden: true,
            selected: '',
            click: () => this.player.pause(),
        },
        {
            id: 'but-stop',
            hidden: false,
            selected: '',
            click: () => this.player.stop(),
        },
        {
            id: 'but-seek-forward',
            hidden: false,
            selected: '',
            click: () => this.player.go('next'),
        },
        {
            id: 'but-loop', 
            hidden: false,
            selected: '',
            click: () => {
                this.controlsVisible = false;
                setTimeout(() => this.controlsVisible = true, 10000);
            },
        },
    ];

    constructor() {
        super();
        if (window.onoffline == null){
            window.addEventListener('offline', () => this.alert("There is no network connection"));
        }
        this.player = ServiceInjector.injector.get(PlayerService);
        this.favourites = ServiceInjector.injector.get(FavouritesService);
        this.config = ServiceInjector.injector.get(CONFIG);
        this.router = ServiceInjector.injector.get(Router);
        this.history = ServiceInjector.injector.get(HistoryService);
        this.sd = ServiceInjector.injector.get(ShutdownService);
        this.logger = ServiceInjector.injector.get(PersistentLogger);

        if (this.config.replaceConsoleLog){
            var that = this;
            console.log = function() {
                that.logger.log(arguments);
            }
            console.error = function() {
                that.logger.log(arguments);
            }
        }

        this.filesDefaultPath = this.config.browsersPaths.local;
    }

    private alert(msg: string): Promise<boolean>{
        this.alertDlg.body = msg;
        return this.alertDlg.show();
    }

    private errorAlert(err: string): Promise<boolean> {
        this.errDlg.body = err;
        this.loading = false;
        return this.errDlg.show();
    }

    private itemSelected(item: FileItem, option: string, backendId: string){
        this.logger.log("item is");
        this.logger.log(item);
        this.logger.log(option);
        if (option == 'delete' && backendId == 'favouritesBrowser'){
            this.favourites.remove(item.path);
            this.browsers['favouritesBrowser'].navigate(null);
        }
        else if (option == 'delete' && backendId == 'playlistBrowser'){
            this.player.remove(item.path);
            this.browsers['playlistBrowser'].navigate(null);
        }
        else if (option == 'addToFavourites'){
            if (backendId == 'playlistBrowser'){
                let plItem: PlaylistItem = this.player.findItemById(item.path);
                item = new FileItem(plItem.name, plItem.uri, [], 'file', backendId);
            }
            this.favourites.add(item);
            this.alert(`${item.name} added to favourites`);
        }
        else {
            this.loading = true;
            if (option == 'enque'){
                this.browsers[backendId].visible = false;
            }
            if (backendId != 'playlistBrowser'){
                this.player.add(item.path, option != 'enque')
                .then(result => {
                    if (option == 'enque'){
                        this.alert(`${item.name} enqued`);
                        this.loading = false;
                        this.browsers[backendId].visible = true;
                    }
                });
            }
            else {
                this.logger.log('else');
                this.loading = false;
                if (item.path == 'save-as-playlist'){
                    this.dirBrowser.show(this.config.browsersPaths.local)
                    return ;
                }
                this.player.playItem(item.path);
            }
        }
    }

    private stateChanged(s: StateType){
        this.logger.log('state changed');
        this.logger.log(s);
        if (s == 'startPlaying'){
            this.loading = true;
        }
        else if (this.loading && s == 'playing'){
            this.loading = false;
        }

        this.controls.forEach((c: any) => {
            if (c.id == 'but-play'){
                c.hidden = s == 'playing';
            }
            if (c.id == 'but-pause'){
                c.hidden = s != 'playing';
            }
        })
    }

    private showKeyboard(category: string, prompt: string): Promise<string>{
        this.keyboard.category = category;
        this.keyboard.prompt = prompt;
        return this.keyboard.show('text');
    }

    private alarmSelected(a: FileItem, option: string){
        console.log("you selected", a, option);
        if (a.path == null){
            this.showKeyboard('alarms', 'Please choose a name')
            .then(title => {
                if (title){
                    console.log('your alarm is', title);
                }
            });
        }
    }

    ngOnInit(){
        this.connect(this.sourceSelector.browsersReady, browsers => {
            this.browsers = browsers;
            this.browsers['playlistBrowser'] = this.playlistBrowser;
            this.browsers['historyBrowser'] = this.historyBrowser;
            Object.keys(this.browsers).forEach(key => {
                this.connect(this.browsers[key].error, err => this.errorAlert(err));
                this.connect(this.browsers[key].itemSelected, (ev: SelectEvent) => this.itemSelected(ev.item, ev.option, ev.backendId));
            });
        });

        this.connect(this.player.error, err => this.errorAlert(err));
        this.connect(this.player.stateChanged, s => this.stateChanged(s));

        this.connect(this.dirBrowser.error, err => this.errorAlert(err));
        this.connect(this.dirBrowser.itemSelected, (ev: SelectEvent) => {
            this.dirBrowser.hide();
            this.showKeyboard('playlists', 'Please choose a name')
            .then(text => {
                if (text != ''){
                    this.player.saveAsPlaylist(text, ev.item.path).then(() => this.alert(`Playlist saved as ${ev.item.path}/${text}.playlist`));
                }
            });
        });
    }

    private shutdown(reboot: boolean){
        this.shutdownDlg.bsDialog.hide();
        this.sd.send(reboot ? 'reboot' : 'shutdown');
    }
}
