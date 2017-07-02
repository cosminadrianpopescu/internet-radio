import { HostListener, ViewEncapsulation, OnInit, ViewChild, Component } from "@angular/core";
import { Browser, SelectEvent } from "../shared/browser";
import { Keyboard } from "../shared/keyboard";
import { AlarmType, FileItem } from "../shared/types";
import { AlarmsService } from "../services/alarms";
import { ServiceInjector } from "../app.module";
import { SourceSelect } from "../shared/open-dialog";
import { TimepickerComponent } from "ng2-bootstrap";
import { Router } from "@angular/router";

@Component({
    selector: 'alarm-form',
    templateUrl: '../html/alarms.html',
    styleUrls: ['../css/alarms.css'],
    encapsulation: ViewEncapsulation.None,
})
export class AlarmsController implements OnInit {
    @ViewChild('browser') private browser: Browser;
    @ViewChild('keyboard') private keyboard: Keyboard;
    @ViewChild('sourceSelector') private sourceSelector: SourceSelect;
    @ViewChild('timepicker') private timepicker: TimepickerComponent;

    private browsers: Object = {};
    private editAlarm: boolean = false;
    private alarm: AlarmType = new AlarmType();

    private service: AlarmsService;
    private router: Router;

    constructor(){
        this.service = ServiceInjector.injector.get(AlarmsService);
        this.router = ServiceInjector.injector.get(Router);
        this.alarm.date = new Date();
    }

    private showMainBrowser(){
        this.editAlarm = false;
        this.browser.type = 'alarmsBrowser';
        this.browser.show(null);
    }

    ngOnInit(){
        this.showMainBrowser();
        this.browser.itemSelected.subscribe((ev: SelectEvent) => {
            if (ev.item.path == null){
                this.keyboard.category = 'alarms';
                this.keyboard.prompt = 'Pleaase choose a name';
                this.keyboard.show('text').then(title => {
                    if (title){
                        this.editAlarm = true;
                        this.alarm = new AlarmType;
                        this.alarm.title = title;
                        this.alarm.date = new Date();
                        this.alarm.date.setSeconds(0);
                        this.alarm.repeat = 'none';
                        this.alarm.command = 'clearAll';
                    }
                    else {
                        this.showMainBrowser();
                    }
                })
            }
            else if (ev.option == null){
                this.alarm = this.service.get(ev.item.path);
                this.editAlarm = true;
            }
            else if (ev.option == 'delete'){
                console.log("delete alarm", ev);
                this.service.del(ev.item.path);
                this.showMainBrowser();
            }
            else if (ev.option == 'enable' || ev.option == 'disable'){
                this.service[ev.option](ev.item.path);
                this.showMainBrowser();
            }
        });
        this.browser.back.subscribe(() => {
            this.router.navigate(['root']);
        });

        this.sourceSelector.browsersReady.subscribe(browsers => {
            this.browsers = browsers;
            Object.keys(this.browsers).forEach(key => {
                this.browsers[key].hasOptions = false;
                this.browsers[key].itemSelected.subscribe((ev: SelectEvent) => this.sourceSelected(ev.item, ev.backendId));
            });
        });
    }

    private sourceSelected(item: FileItem, backendId: string){
        this.alarm.item = item;
    }

    @HostListener('click', ['$event'])
    private onFocus(ev: any){
        if (ev.target.nodeName.toLowerCase() == 'input' && ev.target.getAttribute("id") != "inputId"){
            this.keyboard.category = null;
            this.keyboard.prompt = 'Please choose hour/minutes';
            this.keyboard.show('numerical').then(result => {
                if (result){
                    if (ev.target.parentNode.nextElementSibling && ev.target.parentNode.nextElementSibling.textContent == ":"){
                        this.alarm.date.setHours(Number(result));
                    }
                    else {
                        this.alarm.date.setMinutes(Number(result));
                    }
                    ev.target.value = (Number(result) < 10 ? "0" : "") + result;
                }
            })
        }
    }

    private selectUrl(){
        this.sourceSelector.sourceDlg.show();
    }

    private cancel(){
        this.showMainBrowser();
    }

    private save(){
        this.alarm.id ? this.service.update(this.alarm) :
            this.service.add(this.alarm.title, this.alarm.date, this.alarm.repeat, this.alarm.command, this.alarm.item);
        this.router.navigate(['root']);
    }
}
