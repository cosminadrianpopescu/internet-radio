import { Pipe, PipeTransform } from "@angular/core";
import { CommonsService } from "../services/commons";
import { ServiceInjector } from "../app.module";

@Pipe({name: 'radiotime'})
export class RadiotimePipe implements PipeTransform{
    public transform(input: string){
        return ("00" + input).slice(-2);
    }
}

@Pipe({name: 'mydate'})
export class MyDatePipe implements PipeTransform{
    private commons: CommonsService;

    constructor(){
        this.commons = ServiceInjector.injector.get(CommonsService);
    }

    public transform(input: Date, pattern: string): string{
        if (pattern == "time"){
            return this.commons.formatTime(input);
        }

        return this.commons.formatDate(input);
    }
}
