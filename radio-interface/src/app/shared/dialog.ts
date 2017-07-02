import { ViewEncapsulation, TemplateRef, Input, Component, ViewChild } from '@angular/core';
import { ModalDirective } from "ng2-bootstrap";

@Component({
    selector: 'my-dialog',
    templateUrl: '../html/dialog.html',
    styleUrls: ['../css/dialog.css'],
})
export class Dialog {
    @Input()
    title: string;

    @Input()
    body: string | TemplateRef<any>;

    @Input()
    validator: Function;

    private validForm: boolean = true;

    @Input()
    type: 'alert' | 'confirm' | 'dialog' = 'dialog';

    private _resolve: Function;

    @Input()
    size: 'lg' | 'sm' = 'lg';

    private click(what: boolean){
        if (what && this.validator && !this.validator()){
            this.validForm = false;
            setTimeout(() => this.validForm = true, 3000);
            return ;
        }
        this.bsDialog.hide();
        this._resolve(what);
    }

    public show() : Promise<boolean>{
        let result : Promise<boolean> = new Promise((resolve, reject) => {this._resolve = resolve});
        this.bsDialog.show();
        return result;
    }

    @ViewChild('modalDialog') bsDialog: ModalDirective;

    private isBodyString() : boolean {
        return typeof(this.body) == 'string';
    }
}
