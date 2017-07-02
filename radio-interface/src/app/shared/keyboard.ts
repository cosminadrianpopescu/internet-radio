import { OnInit, ElementRef, ViewChild, Input, Component } from "@angular/core";
import { KeyboardHistoryService } from "../services/history";
import { ServiceInjector } from "../app.module";
import { Browser , SelectEvent } from "./browser";
import { KeyboardType } from "./types";
import { BaseComponentWithSubscribers } from "./component";

class Key {
    public id: string;
    public text1: string;
    public text2: string;
    public showDialog: boolean;
}

@Component({
    selector: 'keyboard',
    templateUrl: '../html/keyboard.html',
    styleUrls: ['../css/keyboard.css'],
})
export class Keyboard extends BaseComponentWithSubscribers implements OnInit {
    private visible: boolean = false;
    private callback: Function;
    private history: KeyboardHistoryService;
    @Input() public prompt: string;
    @Input() public category: string;
    private type: string;

    @ViewChild('input') private input: ElementRef;
    @ViewChild('browser') private browser: Browser;

    private keys: Array<Key> = [];

    constructor() {
        super();
        this.history = ServiceInjector.injector.get(KeyboardHistoryService);
    }

    ngOnInit() {
        this.connect(this.browser.itemSelected, (ev: SelectEvent) => this.input.nativeElement.value = ev.item.path);
    }

    private resolve(response: string){
        if (response != null){
            let history: Array<string> = this.history.get(this.category);
            if (this.category && response && (history.length == 0 || history[history.length - 1] != response)){
                this.history.add(this.category, response);
            }
        }

        this.callback(response);
    }

    public show(type: KeyboardType): Promise<string>{
        let result: Promise<string> = new Promise<string>((resolve, reject) => this.callback = resolve);
        this.type = type;
        this.setKeys();
        this.input.nativeElement.value = '';
        this.visible = true;

        return result;
    }

    public hide() {
        this.resolve(null);
        this.visible = false;
    }

    private setKeys(){
        this.keys = [
            <Key>{id: 'key_1', text1: '1', text2: this.type == 'text' ? 'abc' : '', showDialog: false},
            <Key>{id: 'key_2', text1: '2', text2: this.type == 'text' ? 'def' : '', showDialog: false},
            <Key>{id: 'key_3', text1: '3', text2: this.type == 'text' ? 'ghi' : '', showDialog: false},
            <Key>{id: 'key_4', text1: '4', text2: this.type == 'text' ? 'jkl' : '', showDialog: false},
            <Key>{id: 'key_5', text1: '5', text2: this.type == 'text' ? 'mno' : '', showDialog: false},
            <Key>{id: 'key_6', text1: '6', text2: this.type == 'text' ? 'pqrs' : '', showDialog: false},
            <Key>{id: 'key_7', text1: '7', text2: this.type == 'text' ? 'tuv' : '', showDialog: false},
            <Key>{id: 'key_8', text1: '8', text2: this.type == 'text' ? 'wxyz' : '', showDialog: false},
            <Key>{id: 'key_9', text1: '9', text2: this.type == 'text' ? ' -' : '', showDialog: false},
            <Key>{id: 'key_backspace', text1: 'Backspace', text2: '', showDialog: false},
            <Key>{id: 'key_0', text1: '0', text2: '', showDialog: false},
            <Key>{id: 'key_accept', text1: 'Accept', text2: '', showDialog: false},
        ];
    }

    private showHistoryBrowser() {
        this.browser.show(this.category);
    }

    private keyClicked(key: Key){
        let value: string = this.input.nativeElement.value;
        if (key.id == 'key_backspace'){
            if (value.length > 0) {
                value = value.slice(0, -1);
            }
            this.input.nativeElement.value = value;

            return ;
        }
        if (key.id == 'key_accept'){
            this.resolve(value);
            this.visible = false;
            return ;
        }
        if (this.type == 'numerical' || key.id == 'key_0'){
            value += key.text1;
            this.input.nativeElement.value = value;
            return ;
        }

        key.showDialog = true;
    }

    private chooseSymbol(key: Key, symbol: string){
        this.input.nativeElement.value += symbol;
        this.keys.map(key => key.showDialog = false);
    }

    private toArray(s: string): Array<string>{
        let result: Array<string> = [];
        for (let i: number = 0; i < s.length; i++){
            result.push(s[i]);
        }

        return result;
    }
}
