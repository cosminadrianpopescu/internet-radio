import { HostListener, ViewEncapsulation, OnInit, ViewChild, Component } from "@angular/core";
import { Browser, SelectEvent } from "../shared/browser";
import { Keyboard } from "../shared/keyboard";
import { FileItem } from "../shared/types";
import { ServiceInjector } from "../app.module";
import { TimepickerComponent } from "ng2-bootstrap";
import { Router } from "@angular/router";
import { TimerService } from "../services/timer";
import { NgbTimepicker, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { CommonsService } from "../services/commons";

@Component({
    selector: 'timers-form',
    templateUrl: '../html/timers.html',
    styleUrls: ['../css/timer.css'],
    encapsulation: ViewEncapsulation.None,
})
export class TimersController implements OnInit {
    @ViewChild('browser') private browser: Browser;
    @ViewChild('keyboard') private keyboard: Keyboard;
    @ViewChild('timepicker') private timepicker: NgbTimepicker;

    private editTimer: boolean = false;
    private isPaused: boolean = false;
    private model: NgbTimeStruct = {hour: 0, minute: 20, second: 0};

    private service: TimerService;
    private router: Router;
    private commons: CommonsService;

    constructor(){
        this.service = ServiceInjector.injector.get(TimerService);
        this.router = ServiceInjector.injector.get(Router);
        this.commons = ServiceInjector.injector.get(CommonsService);

        this.service.tick.subscribe(e => this.model = e);
    }

    private showMainBrowser(){
        this.editTimer = false;
        this.browser.type = 'timerBrowser';
        this.browser.show(null);
    }

    ngOnInit(){
        if (this.service.isSet()){
            this.editTimer = false;
            this.model = this.service.get();
            this.isPaused = this.service.isPaused();
        }
        else {
            this.showMainBrowser();
        }

        this.browser.itemSelected.subscribe((ev: SelectEvent) => {
            if (ev.item.path == 'new-timer'){
                this.editTimer = true;
            }
            else {
                this.model = JSON.parse(ev.item.path);
                this.editTimer = false;
                this.service.set(this.model.hour, this.model.minute, this.model.second);
            }
        });

        this.browser.back.subscribe(() => {
            this.router.navigate(['root']);
        });
    }

    @HostListener('click', ['$event'])
    private onFocus(ev: any){
        if (ev.target.nodeName.toLowerCase() == 'input' && ev.target.getAttribute("id") != "inputId"){
            this.keyboard.category = null;
            this.keyboard.prompt = 'Please choose';
            this.keyboard.show('numerical').then(result => {
                if (result){
                    let prop: string = ev.target.parentNode.getAttribute('class').replace(/^ngb-tp-(.*)$/gi, '$1');
                    this.model[prop] = Number(result);
                    ev.target.value = (Number(result) < 10 ? "0" : "") + result;
                    this.timepicker['update' + this.commons.capitalize(prop)](this.model[prop]);
                }
            })
        }
    }
    private cancel(){
        this.showMainBrowser();
    }

    private start(){
        this.service.set(this.model.hour, this.model.minute, this.model.second);
        this.editTimer = false;
    }

    private stop() {
        this.service.reset();
        this.editTimer = true;
        this.isPaused = false;
    }

    private pause() {
        this.service.pause();
        this.isPaused = true;
    }

    private resume() {
        this.service.resume();
        this.isPaused = false;
    }

    private home() {
        this.router.navigate(['root']);
    }
}

