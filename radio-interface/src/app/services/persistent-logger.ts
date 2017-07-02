import { Injectable } from "@angular/core";
import { WebsocketBase } from "../shared/types";

@Injectable()
export class PersistentLogger extends WebsocketBase{
    public onMessage(result: any){}

    constructor(){
        super();
        this.log(`Started logging at ${new Date()}`);
    }

    public log(msg: any){
        let s: string = ['array', 'object'].indexOf(typeof(msg)) == -1 ? msg + "" : JSON.stringify(msg);
        this.ws.send({command: 'log', args: {msg: s}, callback_id: this.uuid});
    }
}
