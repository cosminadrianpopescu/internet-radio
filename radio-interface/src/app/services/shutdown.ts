import { Injectable } from "@angular/core";
import { WebsocketBase } from "../shared/types";

@Injectable()
export class ShutdownService extends WebsocketBase{
    public onMessage(msg: any){}

    public send(cmd: string){
        this.ws.send({command: cmd});
    }
}
