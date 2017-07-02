import { HostListener, EventEmitter, ElementRef, ViewChild, Input, Component } from "@angular/core";
import { FileItem } from "./types";
import { BrowserService , NavigateEvent } from "../services/browser";
import { ServiceInjector } from "../app.module";
import { Keyboard } from "./keyboard";
import { Scroll } from "./scroll";
import { BaseComponentWithSubscribers } from "./component";

export class SelectEvent{
    constructor(public item: FileItem, public option: string, public backendId: string){}
}

@Component({
    selector: 'browser',
    templateUrl: '../html/browser.html',
    styleUrls: ['../css/browser.css', '../css/playlist.css'],
})
export class Browser extends BaseComponentWithSubscribers {
    private items: Array<FileItem> = [];
    private service: BrowserService;
    public visible: boolean = false;
    private loading: boolean = true;
    private divTop: number = 0;
    public error: EventEmitter<string> = new EventEmitter<string>();
    public back: EventEmitter<boolean> = new EventEmitter<boolean>();
    
    private noItemsText = "No items to display";

    @Input() type: string;
    private path: string;
    @Input('with-keyboard') withKeyboard: string = null;
    @Input('can-create-folder') canCreateFolder: string = null;
    @Input('has-options') hasOptions: boolean = true;

    @ViewChild('mainDiv') private mainDiv: ElementRef;
    @ViewChild('searchKeyboard') private keyboard: Keyboard;
    @ViewChild('scroller') private scroller: Scroll;

    public itemSelected: EventEmitter<SelectEvent> = new EventEmitter<SelectEvent>();

    constructor() {
        super();
        if (this.withKeyboard == null){
            this.withKeyboard = 'false';
        }
        if (this.canCreateFolder == null){
            this.canCreateFolder == 'false';
        }
        this.service = ServiceInjector.injector.get(BrowserService);
        this.connect(this.service.onNavigate, (navEv: NavigateEvent) => {
            if (navEv.id == this.type) {
                this.mainDiv.nativeElement.scrollTop = 0;
                this.items = navEv.items;
                if (this.canCreateFolder == 'true'){
                    this.items = [new FileItem('Create new folder', 'new-folder', [], 'file', '')].concat(this.items);
                }
                this.loading = false;
                if (document && document.querySelector('.selected')){
                    setTimeout(() => {
                        let el: any = document.querySelector('.selected');
                        if (el){
                            let top = el.getBoundingClientRect().top - this.mainDiv.nativeElement.scrollTop;
                            this.scroller.animate(top - el.clientHeight, 'scrollTop');
                        }
                    });
                }
            }
        });
        this.connect(this.service.error, err => {
            if (this.visible){
                this.error.emit(`Got error from ${this.type}. The error is ${err}`);
            }
        });
    }

    public show(path: string){
        this.visible = true;
        this.navigate(path);
    }

    public navigate(path: string, sort?: boolean){
        this.path = path;
        this.service.navigate(path, this.type, sort);
    }

    public selectItem(ev: MouseEvent, item: FileItem, option){
        ev.cancelBubble = true;
        if (item.type == 'dir' && option == null){
            this.loading = true;
            if (item.path == null || !item.path.match(/^search::/gi)){
                this.navigate(item.path);
            }
            else {
                this.keyboard.prompt = 'Please enter the query';
                this.keyboard.show('text').then(response => response ? this.navigate(item.path + response, false) : this.loading = false);
            }
        }
        else {
            if (item.path == 'new-folder' && this.canCreateFolder == 'true'){
                this.keyboard.prompt = 'Please enter a name';
                this.keyboard.show('text').then(response => {
                    if (response != null){
                        this.service.mkdir(this.path, response, this.type).then(resp => this.navigate(this.path));
                    }
                });
            }
            else {
                this.itemSelected.emit(new SelectEvent(item, option, this.type));
                if (option == null){
                    this.hide();
                }
            }
        }
    }

    public hide(){
        this.mainDiv.nativeElement.scrollTop = 0;
        this.visible = false;
    }

    private backClicked(){
        this.hide();
        this.back.emit(true);
    }
}
