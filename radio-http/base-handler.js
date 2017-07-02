const http = require('http');
const Q = require('q');

class BaseHandler {
    /**
     * @param {Connection} conn
     * @param {string} params
     */
    constructor(conn, obj){
        this._conn = conn;
        this._args = obj.args;
        this._cmd = obj.command;
        this._callback_id = obj.callback_id || null;
    }

    respond(content){
        let result = {
            data: content,
        }
        if (this._callback_id){
            result['callback_id'] = this._callback_id;
        }
        this._conn.send(JSON.stringify(result));
    }

    /**
     * @param {string} params
     */
    parse_params(obj){
        this._args = obj.args;
        this._cmd = obj.command;
        this._callback_id = obj.callback_id || null;
        // let result = {};
        // params.split('&').forEach((item) => {
        //     if (item == ''){
        //         return ;
        //     }
        //     let parts = item.split('=');
        //     result[parts[0]] = decodeURIComponent(parts[1]);
        // });

        // return result;
    }

    /**
     * @param {string} url
     * @param {string} q
     */
    fetch_page(url){
        let content = '';
        let result = Q.defer();
        http.get(url, (res) => {
            res.on('data', (data) => {
                content += data;
            });
            res.on('end', () => {
                result.resolve(content.replace(/[\r\n]/ig, ' '));
            });
        });

        return result.promise;
    }

    /**
     * @param {RegExp} r
     * @param {string} s
     *
     * @return {Array}
     */
    _get_all_matches(r, s){
        let result = [];

        let match = r.exec(s);
        while (match != null){
            let item = [];
            match.forEach(i => item.push(i));
            result.push(item);

            match = r.exec(s);
        }

        return result;
    }

    handle(){
        this[this._cmd]();
    }
}

module.exports = BaseHandler;
