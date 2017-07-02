import { OnInit, ViewChild, Input, ElementRef, Component } from "@angular/core";
import { CommonsService } from "../services/commons";
import { ServiceInjector } from "../app.module";

class LastScroll {
    constructor(public date: Date, public dir: number){}
}

@Component({
    selector: 'scroll',
    templateUrl: '../html/scroll.html',
    styleUrls: ['../css/scroll.css'],
})
export class Scroll implements OnInit {
    @Input() element: any;
    @Input() direction: 'horizontal' | 'vertical';
    @Input('display-position') displayPosition: string = 'center';
    private commons: CommonsService;
    private lastScroll: LastScroll = null;
    @ViewChild('el1') private el1: any;
    @ViewChild('el2') private el2: any;
    private dir1: string;
    private dir2: string;

    private animDuration: number = 100;

    private getProp(el: ElementRef, prop: string): number{
        return this.commons.get(el, prop);
    }

    private getStyleProp(el: ElementRef, prop: string): number {
        let result: string = this.getProp(el, 'style.' + prop).toString().replace(/px$/, '');
        if (result == ''){
            return 0;
        }

        return Number(result) * 1;
    }

    constructor(){
        this.commons = ServiceInjector.injector.get(CommonsService);
    }

    public ngOnInit(){
        this.el1 = this.el1.nativeElement;
        this.el2 = this.el2.nativeElement;
        if (this.direction == "vertical"){
            this.dir1 = "up";
            this.dir2 = "down";
            let top: number = this.getStyleProp(this.element, 'top');
            let left: number = this.getStyleProp(this.element, 'left');
            if (this.displayPosition == 'center'){
                left += this.getProp(this.element, 'clientWidth') / 2 - this.getProp(this.el1, 'clientWidth') / 2;
            }
            else if (this.displayPosition == 'left'){
                left = this.getStyleProp(this.element, 'left');
            }
            else if (this.displayPosition == 'right'){
                left = this.getStyleProp(this.element, 'left') + this.getProp(this.element, 'clientWidth')
                    - this.getProp(this.el1, 'clientWidth');
            }
            this.el1.style.top = (top + 5) + 'px';
            this.el1.style.left = left + 'px';
            this.el2.style.bottom = '5px';
            this.el2.style.left = left + 'px';
        }
        else if (this.direction == 'horizontal'){
            this.dir1 = "left";
            this.dir2 = "right";
            let top: number = this.getStyleProp(this.element, 'top') + this.getProp(this.element, 'clientHeight') / 2
                - this.getProp(this.el1, 'clientHeight') / 2;
            if (top >= window.innerHeight){
                top -= window.innerHeight;
            }
            let right: number = this.getStyleProp(this.element, 'left') + this.getProp(this.element, 'clientWidth') 
                - this.getProp(this.el2, 'clientWidth');
            let left: number = this.getStyleProp(this.element, 'left');

            this.el1.style.top = top + 'px';
            this.el1.style.left = left + 'px';
            this.el2.style.top = top + 'px';
            this.el2.style.right = '5px';
        }

        this.el1.className += ' scroll-icon-' + this.dir1;
        this.el2.className += ' scroll-icon-' + this.dir2;
    }

    public animate(dest: number, which: string){
        let step: number = (dest - this.element[which]) / (this.animDuration ? (this.animDuration / 15) : 1);
        if (dest <= 0){
            dest = 0;
        }
        let lastPos = null;
        let id = setInterval(() => {
            if ((this.element[which] >= dest && step >= 0) || (this.element[which] <= dest && step < 0) 
               || (lastPos != null && lastPos == this.element[which])){
                clearInterval(id);
                this.element[which] = dest;
            }
            else {
                lastPos = this.element[which];
                this.element[which] += step;
            }
        }, 15);
    }

    private getScrollProp(dir: number): string{
        return this.direction == 'vertical' ? 'scrollTop' : 'scrollLeft';
    }

    private scroll(dir: number){
        let d: Date = new Date();
        if (this.lastScroll != null && this.lastScroll.dir == dir && d.getTime() - this.lastScroll.date.getTime() <= 500){
            this.onLongPress(dir);
            return ;
        }
        let which: string = this.getScrollProp(dir);
        let delta: number = which == 'scrollTop' ? window.innerHeight : window.innerWidth;
        delta -= 10;
        if (dir == 2){
            delta = -delta;
        }

        this.animate(this.element[which] - delta, which);
        this.lastScroll = new LastScroll(d, dir);
        return false;
    }

    private onLongPress(dir: number){
        let which: string = this.getScrollProp(dir);
        let max: number = this.element.children[0][which == 'scrollTop' ? 'clientHeight' : 'clientWidth'];
        this.animate(dir == 2 ? max : 0, which);
    }
}

