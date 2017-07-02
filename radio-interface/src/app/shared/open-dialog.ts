import { OnInit, EventEmitter, TemplateRef, ViewChild, ViewEncapsulation, Component } from "@angular/core";
import { Browser } from "./browser";
import { Dialog } from "./dialog";

@Component({
  selector: 'source-select',
  templateUrl: '../html/select-browse-source.html',
  styleUrls: ['../css/root.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SourceSelect implements OnInit {
    @ViewChild('openDlgTpl') public tpl: TemplateRef<any>;
    @ViewChild('filesBrowser') public filesBrowser: Browser;
    @ViewChild('youtubeBrowser') public youtubeBrowser: Browser;
    @ViewChild('radioBrowser') public radioBrowser: Browser;
    @ViewChild('favouritesBrowser') public favBrowser: Browser;
    @ViewChild('sourceDialog') public sourceDlg: Dialog;

    public browsers: Object = {};

    public browsersReady: EventEmitter<Object> = new EventEmitter<Object>();

    public open(id: string){
        this.sourceDlg.bsDialog.hide();
        this.browsers[id].show(null);
    }

    ngOnInit(){
        this.browsers['files'] = this.filesBrowser;
        this.browsers['youtube'] = this.youtubeBrowser;
        this.browsers['radioBrowser'] = this.radioBrowser;
        this.browsers['favouritesBrowser'] = this.favBrowser;
        this.browsersReady.emit(this.browsers);
    }
}
