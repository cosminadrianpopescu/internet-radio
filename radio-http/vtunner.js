let iconv = require('iconv').Iconv;
let BaseHandler = require('./base-handler');

const BASE_URL = 'http://vtuner.com/setupapp/guide/asp/BrowseStations/';
const RADIO_URL = 'http://vtuner.com/setupapp/guide/asp/func/dynampls.asp?link=1&id=#id#';

class VTunner extends BaseHandler {
    constructor(conn, obj){
        super(conn, obj);
    }

    _main_page(){
        this.respond([
            {name: 'Search', path: 'search', type: 'search'},
            {name: 'By genre', path: 'startpage.asp?sBrowseType=format', type: 'dir'},
            {name: 'By location', path: 'startpage.asp?sBrowseType=location', type: 'dir'},
            {name: 'By language', path: 'startpage.asp?sBrowseType=language', type: 'dir'},
        ]);
    }

    /**
     * @param {string} content
     */
    parse_directory(content){
        let r = /href=['"]..\/BrowseStations\/BrowsePremiumStations\.asp\?([^'"]+)['"]/gi;
        let result = [{'name': '..', 'path': '', 'type': 'dir'}];
        let i = new iconv('ISO-8859-1', 'UTF-8');

        this._get_all_matches(r, content).forEach(match => {
            result.push({
                name: i.convert(match[1].replace(/^.*NiceLOFO=(.*)$/, '$1')).toString(),
                path: 'BrowsePremiumStations.asp?' + match[1],
                type: 'dir',
            });
        });

        return result;
    }

    /**
     * @param {string} content
     */
    parse_directory_with_files(content){
        let r = /href="[^"]+id=([0-9]+">[^<]+)<.*?valign="middle">([^<]+)</igm;
        let i = new iconv('ISO-8859-1', 'UTF-8');
        let ids = [];
        let locations = [];
        let result = [];
        let matches = this._get_all_matches(r, content);
        matches.forEach(match => {
            ids.push(match[1]);
            locations.push(match[2]);
        });
        let page_matches = this._get_all_matches(/href="[^"]+iCurrPage=([0-9]+)"/img, content);
        let pages = [];
        page_matches.forEach(match => pages.push(match[1]));
        let page_max = Math.max(...pages.map(item => Number(item)));
        let page = 1;
        r = /^(.*iCurrPage=)([0-9]+)$/gi;
        if (this._args['p'].match(r)){
            page = Number(this._args['p'].replace(r, '$2'));
        }
        if (page > 1){
            result.push({
                name: 'Previous page',
                path: this._args['p'].replace(r, '$1') + (page - 1),
                type: 'dir',
            });
        }
        if (page < page_max){
            result.push({
                name: 'Next page',
                path: this._args['p'].replace(r, '$1') + (page == 1 ? '&iCurrPage=' : '') + (page + 1),
                type: 'dir',
            })
        }

        ids.forEach((_id, idx) => {
            let id, name;
            [id, name] = _id.split('">', 2);
            result.push({
                name: i.convert(name + ' (' + locations[idx] + ')').toString(),
                path: RADIO_URL.replace(/#id#/ig, id),
                type: 'dir',
            })
        })

        return result;
    }

    /**
     * @param {string} content
     */
    parse_streams(content){
        let url = content.replace(/^.*link=([^"]+)".*$/gi, '$1');
        return [{name: 'Stream', path: url, type: 'file', options: ['addToFavourites']}];
    }

    radio_browser(){
        let path = this._args['p'] || '';

        if (path == ''){
            this._main_page();
            return ;
        }

        let r = /^search::(.*)$/i;
        let q = path.match(r) ? path.replace(r,'SearchForm.asp?sSearchType=&sSearchInput=$1') : path;
        let that = this;
        let http_r = /^http:\/\//gi;

        let url = (path.match(http_r) ? '' : BASE_URL) + q;

        this.fetch_page(url)
            .then(function(content){
                if (path.match(/^startpage/i)){
                    that.respond(that.parse_directory(content));
                    return ;
                }
                if (path.match(http_r)){
                    that.respond(that.parse_streams(content));
                    return ;
                }
                that.respond(that.parse_directory_with_files(content));
            });

        return ;
    }
}

module.exports = VTunner;
