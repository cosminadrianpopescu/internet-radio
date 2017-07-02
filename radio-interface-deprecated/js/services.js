// Cache Service
vlcRadio.factory('cacheService', [function(){
    return {
        // duration is in seconds
        set: function(key, value, duration){
            var item = {
                value: value,
            }
            if (duration){
                var d = new Date();
                d.setSeconds(d.getSeconds() + duration);
                item.duration = d;
            }
            localStorage.setItem(key, JSON.stringify(item));
        },
        get: function(key, defaultValue){
            if (localStorage[key]){
                var item = JSON.parse(localStorage[key]);
                var value = item.value;
                if (item['duration']){
                    var d1 = new Date(item.duration);
                    var d2 = new Date();
                    if (d1 < d2){
                        value = null;
                        delete localStorage[key];
                    }

                    delete d1;
                    delete d2;
                }

                return value;
            }

            if (!defaultValue){
                defaultValue = null;
            }

            return defaultValue;
        },
        del: function(key){
            if (localStorage[key]){
                delete localStorage[key];
            }
        },
        list: function(){
            console.log('cache is', localStorage);
        },
    }
}]);

// Service for an implementation of an interface
vlcRadio.factory('ifaceHelper', ['$injector', function($injector){
    return {
        setImplementation: function(iface, _impl){
            var impl = $injector.get(_impl);
            for (var method in iface){
                if (!method.match(/^_/)){
                    if (typeof(impl[method]) == 'undefined'){
                        throw 'You must implement ' + method + ' in ';
                    }
                }

                if (typeof(impl[method]) != 'undefined'){
                    iface[method] = impl[method];
                }
            }
        }
    };
}]);

// Commons Service
vlcRadio.factory('commons', ['$rootScope', '$mdDialog', '$animate', '$state', 'ifaceHelper', 'config', function($rootScope, $mdDialog, $animate, $state, ifaceHelper, config){
    $animate.enabled(false);

    function makeYoutubeRequest(url, options, nextPageToken, callback){
        if (typeof(nextPageToken) != 'undefined' && nextPageToken != null){
            options['pageToken'] = nextPageToken;
        }
        $.ajax({
            url: url,
            data: options,
            dataType: 'json',
            async: false,
            success: function(data){
                console.log('url is', url, options);
                console.log('youtube data is', data);
                callback(data);
            }
        });
    }

    function getValue(obj, path){
        var value;
        try {
            eval('value = obj.' + path);
        }
        catch (e){
            return value;
        }
        return value;
    }

    function _get(obj, path, def){
        var value = getValue(obj, path);
        if (typeof(value) != 'undefined' && value != null){
            if (typeof(def) == "boolean"){
                value = value == "true" ? true : false;
            }
            return value;
        }

        return def;
    }

    return {
        getArray: function(obj, path){
            var value = getValue(obj, path);
            if (typeof(value) != 'undefined' && value != null){
                if (Object.prototype.toString.call(value) == '[object Array]'){
                    return value;
                }
                else {
                    return [value];
                }
            }

            return [];
        },
        get: function(obj, path, def){
            return _get(obj, path, def);
        },
        showDialog: function(templateSelector, callback){
            return $mdDialog.show({
                parent: angular.element(document.body),
                template: $(templateSelector).html(),
                controller: 'DialogController',
                clickOutsideToClose: true,
            })
            .then(function(answer){
                callback(answer);
            })
        },
        alert: function(message, title){
            if (title == 'undefined' || title == null){
                title = ''
            }
            $mdDialog.show(
                $mdDialog.alert()
                .parent(angular.element($('body')[0]))
                .title(title)
                .textContent(message)
                .ariaLabel('Alert dialog demo')
                .ok("Close me")
            );
        },
        setImplementation: function(iface, impl){
            ifaceHelper.setImplementation(iface, impl);
        },
        config: function(){
            return config;
        },
        displayTime: function(seconds){
            var min = Math.floor(seconds / 60);
            var sec = seconds - min * 60;

            return (min >= 10 ? min : "0" + min) + ":" + (sec >= 10 ? sec : "0" + sec);
        },
        formatNowPlaying: function(status){
            var txt = _get(status, 'streamInfo.now_playing', '');
            if (txt != _get(status, 'streamInfo.title', '')){
                txt += (txt == '' ? '' : ' - ') + _get(status, 'streamInfo.title', '');
            }

            if (txt == '' && _get(status, 'streamInfo.filename') != ''){
                txt = _get(status, 'streamInfo.filename');
            }

            return txt;
        },
        copyService: function(service){
            var result = {}
            for (var i in service){
                result[i] = service[i];
            }

            return result;
        },
        browse: function(args, callback){
            $rootScope.$emit('browseForItem', args, function(items){
                callback(items);
            })
        },
        prompt: function(args, callback){
            $rootScope.$emit('needKeyboard', args, function(query){
                if (query == ''){
                    query = null;
                }
                callback(query);
            });
        },
        makeYoutubeRequest: function(args){
            var result = [];
            var n = 0;
            function loop(data){
                result.push(data);
                if (typeof(args['maxPages']) != 'undefined' && ++n >= args['maxPages']){
                    args['success'](result);
                    return ;
                }
                if (typeof(data['nextPageToken']) != 'undefined'){
                    makeYoutubeRequest(args['url'], args['options'], data['nextPageToken'], loop);
                }
                else {
                    args['success'](result);
                }
            }
            makeYoutubeRequest(args['url'], args['options'], null, loop);
        },
    }
}]);

// Templating Service
vlcRadio.factory('templateService', ['commons', function(commons){
    return {
        parse: function(id, params){
            var result = $('#' + id).html();
            for (var key in params){
                var value = params[key];
                var r = new RegExp('#' + key + '#', 'gi');
                result = result.replace(r, value);
            }

            return result;
        }
    }
}]);

// Favourites Service
vlcRadio.factory('favouritesService', ['config', 'cacheService', function(config, cache){
    var favourites = null;
    return {
        get: function(){
            return cache.get('localFavourites', [])
        },
        add: function(title, url){
            var favourites = cache.get("localFavourites", []);
            var fav = {
                title: title,
                url: url,
            }

            favourites.push(fav);
            cache.set('localFavourites', favourites);
        },
        remove: function(item){
            var favourites = cache.get('localFavourites', []);
            for (var i in favourites){
                if (item.path == favourites[i].url){
                    favourites.splice(i, 1);
                    break;
                }
            }

            cache.set('localFavourites', favourites);
        }
    }
}]);

vlcRadio.factory('weatherService', ['$interval', 'commons', 'cacheService', function($interval, commons, cache){
    var WeatherService = function(){
        this.last_weather = function(){
            return cache.get(this.cache_key);
        }
        this.triggerEvents = function(){
            for (var i in this.weatherChangedEventsStack){
                this.weatherChangedEventsStack[i](this.last_weather());
            }
        };
        this.getUrl = function(operation){
            return commons.config().weather.url.replace(/#operation#/, operation);
        };
        this.refreshWeather = function(operation){
            var self = this;
            $.ajax({
                url: this.getUrl(this.operation), 
                dataType: 'jsonp', 
                contentType: 'application/jsonp', 
                type: 'GET', 
                success: function(data){
                    var last_weather = {
                        data: data, 
                        iconIdx: 0,
                    }

                    cache.set(self.cache_key, last_weather, self.interval);

                    self.triggerEvents();
                },
            });
        }
    }

    WeatherService.prototype.get = function(){
        if (this.interval == null){
            throw 'you must extend this service';
        }
        return this.last_weather();
    }

    WeatherService.prototype.onWeatherChanged = function(callback){
        if (this.interval == null){
            throw 'you must extend this service';
        }
        this.weatherChangedEventsStack.push(callback);
        if (this.last_weather() != null){
            callback(this.last_weather());
        }
    }

    WeatherService.prototype.init = function(_interval, _cache_key, _operation){
        this.interval = _interval;
        this.operation = _operation;
        this.cache_key = _cache_key;
        this.weatherChangedEventsStack = [];
        var self = this;
        if (this.last_weather() == null){
            this.refreshWeather(this.operation);
        }
        $interval(function(){
            if (self.last_weather() == null){
                self.refreshWeather(self.operation);
            }

            if (self.intervalCallback != null){
                if (self.intervalCallback(self.last_weather())){
                    self.triggerEvents();
                }
            }
        }, 1000 * 60);
    };

    WeatherService.prototype.formatTemp = function(t){
        return Math.round(t, 1) + '\u2103';
    }

    return WeatherService;
}]);

vlcRadio.factory('currentWeatherService', ['weatherService', 'commons', function(weather, commons){
    var service = new weather();
    service.intervalCallback = function(last_weather){
        if (last_weather != null && last_weather.data.weather.length > 1){
            last_weather.iconIdx++;
            if (last_weather.iconIdx >= last_weather.data.weather.length){
                last_weather.iconIdx = 0;
            }
            return true;
        }
        return false;
    }

    service.getIcon = function(obj, idx){
        return 'http://openweathermap.org/img/w/' + obj.weather[idx].icon + '.png';
    }

    service.init(commons.config().weather.updateCurrentInterval * 60, 'last_weather', 'weather');

    return service;
}]);

vlcRadio.factory('forecastWeatherService', ['weatherService', 'commons', function(weather, commons){
    var service = new weather();
    service.init(commons.config().weather.updateForecastInterval * 60 * 60, 'forecast', 'forecast/daily/');
    return service;
}]);

vlcRadio.factory('dateTimeService', ['$interval', 'commons', function($interval, commons){
    var last_time = new Date();
    var events = {
        dateChanged: [],
        timeChanged: [],
        tick: [],
    }
    $interval(function(){
        var d = new Date();
        var dirty = false;
        if (d.getHours() != last_time.getHours() || d.getMinutes() != last_time.getMinutes()){
            for (var i in events.timeChanged){
                events.timeChanged[i](d);
            }
            dirty = true;
        }
        if (d.getDate() != last_time.getDate() || d.getMonth() != last_time.getMonth() || d.getYear() != last_time.getYear()){
            for (var i in events.dateChanged){
                events.dateChanged[i](d);
            }
            dirty = true;
        }

        if (dirty){
            delete last_time;
            last_time = d;
        }
        for (var i in events.tick){
            events.tick[i](d);
        }
        delete d;
    }, 1000);

    return {
        onDateChanged: function(callback){
            events.dateChanged.push(callback);
        },
        onTimeChanged: function(callback){
            events.timeChanged.push(callback);
        },
        onTick: function(callback){
            events.tick.push(callback);
        }
    }
}]);

// XML Service
vlcRadio.factory('xmlService', [function(){
    return {
        getInstance: function(xml){
            var x2js = new X2JS();
            var obj = x2js.xml_str2json(xml);
            delete x2js;

            return {
                getJson: function(){
                    return obj;
                }
            }
        }
    }
}]);

// Radio Player Interface
vlcRadio.factory('playerInterface', [function(){
    return {
        getStatus: function(){
            throw 'you must implement getStatus method';
        },
        onStatusChanged: function(property, callback){
            throw 'you must implement onstatuschange method';
        },
        doCommand: function(command){
            throw 'you must implement docommand';
        },
        getPlaylist: function(){
            throw 'you must implement getPlaylist';
        },
        _name: function(){
            throw 'you must implement _name method';
        },
        getFiles: function(path){
            throw 'you must implement getFiles method';
        },
        shuffle: function(callback){
            throw 'you must implement shufle method';
        },
        saveAsPlaylist: function(name, path, content){
            console.log("not implemented");
        },
        _getBackends: function(){
            console.log('not implemented');
        },
        _changeBackend: function(backend){
            console.log('not implemented');
        },
    }
}]);

// Items browser interface
vlcRadio.factory('itemsBrowserInterface', function(){
    var navigateFinishedCallback = null;
    var mediaClickedCallback = null;
    var optionFinishedCallback = null;

    return {
        _navigationFinished: function(result, sort){
            if (typeof(sort) == 'undefined'){
                sort = true;
            }
            if (sort){
                result.sort(function(a, b){
                    if (a.type == b.type){
                        return (a.name < b.name ? -1 : (a.name == b.name ? 0 : 1));
                    }
                    if (typeof(a.sortOrder) != 'undefined'){
                        return a.sortOrder < b.sortOrder ? -1 : 1;
                    }
                    return a.type == 'dir' ? -1 : 1;
                });
            };
            navigateFinishedCallback(result);
        },
        _onNavigateFinished: function(callback){
            navigateFinishedCallback = callback;
        },
        _mediaClicked: function(item){
            mediaClickedCallback(item);
        },
        _onMediaClicked: function(callback){
            mediaClickedCallback = callback;
        },
        _optionsFinished: function(result){
            optionFinishedCallback(result);
        },
        _onOptionFinished: function(callback){
            optionFinishedCallback = callback;
        },
        navigate: function(path, callback){
            throw 'you must implement browse';
        },
        selectItem: function(item, option){
            throw 'you must implement selectItem';
        },
    }
});

// VLC Player Service
vlcRadio.factory('vlcPlayer', ['$http', '$interval', 'xmlService', 'commons', 'config', function($http, $interval, xmlService, commons, config){
    var timer = null, statusXml = null;
    var events = {
        streamInfo: [], length: [], position: [], repeat: [], loop: [], state: [], shuffle: [],
    }

    function triggerEvents(key, oldStatus, newStatus){
        for (var i in events[key]){
            events[key][i](oldStatus, newStatus);
        }
    }

    function checkStatus(){
        $http({
            method: 'GET', 
            url: 'requests/status.xml'
        }).then(function(response){
            if (statusXml != response.data){
                var oldStatus = status2Json(statusXml);
                var newStatus = status2Json(response.data);
                for(var ev in events){
                    if (ev == 'streamInfo'){
                        if (commons.get(oldStatus, 'streamInfo.artist', '') != commons.get(newStatus, 'streamInfo.artist', '')
                           || commons.get(oldStatus, 'streamInfo.filename', '') != commons.get(newStatus, 'streamInfo.filename', '')
                           || commons.get(oldStatus, 'streamInfo.title', '') != commons.get(newStatus, 'streamInfo.title', '')
                           || commons.get(oldStatus, 'streamInfo.description', '') != commons.get(newStatus, 'streamInfo.description', '')
                           || commons.get(oldStatus, 'streamInfo.now_playing', '') != commons.get(newStatus, 'streamInfo.now_playing', '')){

                            triggerEvents(ev, oldStatus, newStatus);
                        }
                    }
                    else {
                        if (commons.get(oldStatus, ev) != commons.get(newStatus, ev)){
                            triggerEvents(ev, oldStatus, newStatus);
                        }
                    }
                }
            }
            statusXml = response.data;
        }, function(response){
            console.error('error getting the status', response);
        })
    }

    function status2Json(statusXml){
        var xml = xmlService.getInstance(statusXml);
        var status = xml.getJson();
        delete xml;
        var result = {
            streamInfo: {},
            length: commons.get(status, 'root.length', 0),
            position: commons.get(status, 'root.position', 0),
            repeat: commons.get(status, 'root.repeat', false),
            loop: commons.get(status, 'root.loop', false),
            state: commons.get(status, 'root.state', 'stopped'),
            shuffle: commons.get(status, 'root.random', false),
        }

        var streamInfo = {};
        var informationArray = commons.getArray(status, 'root.information.category');
        for (var i in informationArray){
            var obj = informationArray[i];
            var name = commons.get(obj, '_name', '');
            var infoArray = commons.getArray(obj, 'info');
            if (name == 'meta'){
                for (var j in infoArray){
                    var info = obj.info[j];
                    var name = commons.get(info, '_name', '');
                    if (name == 'artist' || name == 'filename' || name == 'description' || name == 'title' || name == 'now_playing' || name == 'genre' || name == 'url'){
                        streamInfo[name] = commons.get(info, '__text', '');
                    }
                }
                break;
            }
        }
        if (commons.get(streamInfo, 'now_playing', null) == null){
            streamInfo.now_playing = commons.get(streamInfo, 'title');
        }
        result['streamInfo'] = streamInfo;
        return result;
    }

    var commands = {
        prev: {command: 'pl_previous'},
        next: {command: 'pl_next'},
        play: {command: 'pl_play'},
        pause: {command: 'pl_pause'},
        stop: {command: 'pl_stop'},
        loop: {command: 'pl_loop'},
        shuffle: {command: 'pl_random'},
        playItem: 'command=pl_play&id=#id#',
        removeItem: 'command=pl_delete&id=#id#',
        openUrl: 'command=in_play&input=#url#',
        clearAll: {command: 'pl_empty'},
        enque: 'command=in_enqueue&input=#input#',
    }

    function sendCommand(command){
        $.ajax({
            url: 'requests/status.xml',
            data: command,
            error: function(){
                console.log('error playing with the following arguments', arguments);
            }
        });
    }

    function parseCommand(cmd, params){
        if (typeof(cmd) == 'string'){
            for (key in params){
                var r = new RegExp('#' + key + '#', 'g');
                cmd = cmd.replace(r, params[key]);
            }
        }

        return cmd;
    }

    var result = {
        _name: function(){
            return 'VLC PLAYER';
        },
        startCheck: function(interval){
            timer = $interval(checkStatus, interval);
        },
        stopCheck: function(){
            if (timer != null){
                $interval.cancel(timer);
                timer = null;
            }
        },
        getStatus: function(callback){
            $http({
                method: 'GET', 
                url: 'requests/status.xml'
            }).then(function(response){
                callback(status2Json(response.data));
            });
        },
        onStatusChanged: function(property, callback){
            var properties = property.split(':');
            for (var i in properties){
                events[properties[i]].push(callback);
            }
        },
        doCommand: function(cmd, args){
            var _cmd = commands[cmd];
            if (typeof(args) != 'undefined'){
                _cmd = parseCommand(_cmd, args);
            }
            sendCommand(_cmd);
        },
        getPlaylist: function(successCallback, errorCallback){
            $.ajax({
                url: 'requests/playlist_jstree.xml',
                success: function(xml, txt, data){
                    var xml = xmlService.getInstance(data.responseText);
                    var response = xml.getJson();
                    var result = [];
                    delete xml;
                    var plItems = commons.getArray(response, 'root.item');
                    for (i in plItems){
                        if (commons.get(plItems[i], '_name') == 'Playlist'){
                            var items = commons.getArray(plItems[i], 'item');
                            for (var j in items){
                                result.push({
                                    'id': commons.get(items[j], '_id'),
                                    'playing': commons.get(items[j], '_current') == 'current',
                                    'duration': commons.get(items[j], '_duration'),
                                    'name': commons.get(items[j], '_name'),
                                    'uri': commons.get(items[j], '_uri'),
                                })
                            }
                            break;
                        }
                    }
                    successCallback(result);
                },
                error: function(error){
                    errorCallback(error);
                }
            })
        },
        getFiles: function(path, callback){
            var self = this;
            $.ajax({
                url: 'requests/browse.xml?uri=' + encodeURIComponent('file://' + path), 
                success: function(data, code, xhr){
                    var xml = xmlService.getInstance(xhr.responseText);
                    var json = xml.getJson();
                    var elements = commons.getArray(xml.getJson(), 'root.element');
                    var result = [];
                    for (i in elements){
                        var item = {
                            type: commons.get(elements[i], '_type', ''),
                            path: commons.get(elements[i], '_path', ''),
                            name: commons.get(elements[i], '_name', ''),
                        };

                        if (item.type != 'dir'){
                            item.options = ['addToFavourites'];
                        }
                        result.push(item);
                    }
                    delete xml;

                    callback(result);
                },
                error: function(data){
                    commons.alert('Error fetching the files for ' + path);
                }
            })
        },
        shuffle: function(callback){
            console.log('not implemented');
        },
        saveAsPlaylist: function(){
            console.log("not implemented");
        },
    }

    result.startCheck(config.statusIntervalCheck);
    return result;
}]);

vlcRadio.factory('youtubeInfo', ['commons', function(commons){
    return {
        getVideoInfo: function(ids, callback){
            var sId = '';
            ids.forEach(function(id){
                sId += (sId == '' ? '' : ',') + id;
            });

            var result = [];
            commons.makeYoutubeRequest({
                url: commons.config().youtube.apiEndPoint + 'videos',
                options: {
                    part: 'snippet',
                    maxResults: commons.config().youtube.maxResults,
                    key: commons.config().youtube.apiKey,
                    id: sId,
                },
                success: function(pages){
                    var data = pages[0];
                    if (typeof(data.items) != 'undefined'){
                        data.items.forEach(function(item){
                            item['snippet']['videoId'] = item.id;
                            item['snippet']['position'] = result.length;
                            result.push(item['snippet']);
                        })
                    }

                    callback(result);
                }
            });
        },
        getPlaylistInfo: function(id, callback){
            commons.makeYoutubeRequest({
                url: commons.config().youtube.apiEndPoint + 'playlistItems',
                options: {
                    part: 'snippet',
                    maxResults: commons.config().youtube.maxResults,
                    key: commons.config().youtube.apiKey,
                    playlistId: id,
                }, 
                success: function(pages){
                    var result = [];
                    pages.forEach(function(page){
                        page.items.forEach(function(item){
                            item['snippet']['videoId'] = item.snippet.resourceId.videoId;
                            result.push(item['snippet']);
                        });
                    });

                    callback(result);
                }
            })
        }
    }
}]);

// Youtube Player Service
vlcRadio.factory('youtubePlayer', ['$window', '$interval', 'commons', 'youtubeInfo', function($window, $interval, commons, info){
    var player = null;
    var timer = null;
    var loop = false;
    var playlist = [];
    var commandsMap = {
        'stop': 'stopVideo',
        'play': 'playVideo',
        'pause': 'pauseVideo',
        'seek_forward': 'seekTo',
        'seek_back': 'seekTo',
    }
    var events = {
        streamInfo: [], length: [], position: [], repeat: [], loop: [], state: [], shuffle: [],
    }

    var doCommand = function(cmd, args)
    {
        function enque(cmd, items){
            var playlistItems = [];
            items.forEach(function(item){
                item.position += playlist.length;
                item.id = item.position + ':' + item.videoId;
                item.playing = false;

                playlistItems.push(item);
            });
            playlist = playlist.concat(playlistItems);
            if (cmd == 'openUrl'){
                play(playlistItems[0].id);
            }
        }

        function play(id){
            $.each(playlist, function(idx, item){
                if (item.id == id){
                    var videoId = item.id.replace(/^[\d]+:(.*)$/, '$1');
                    item.playing = true;
                    player.loadVideoById({videoId: videoId});
                }
                else {
                    item.playing = false;
                }
            })
        }

        var _cmd = null, _args = {};
        if (cmd == 'openUrl' || cmd == 'enque'){
            var url = decodeURIComponent(args['url']);
            var videoId = url.replace(/^.*v=([^&]+).*$/, '$1');
            var listId = url.replace(/^.*list=([^&]+).*$/, '$1');
            if (listId != url){
                info.getPlaylistInfo(listId, function(items){
                    enque(cmd, items);
                });
            }
            else if (videoId != url){
                info.getVideoInfo([videoId], function(items){
                    enque(cmd, items);
                });
            }

            return ;
        }
        else if (cmd == 'seek_forward' || cmd == 'seek_back'){
            var time = player.getCurrentTime();
            var duration = player.getDuration();
            if (typeof(time) == 'undefined' || typeof(duration) == 'undefined'){
                return ;
            }

            var delta = (duration * 1.0 * (args['time'] * 1.0 / 100.0));

            time += delta;
            _args = time;
        }
        else if (cmd == 'next' || cmd == 'prev'){
            var start, cont, step, item, next = null;
            if (cmd == 'next'){
                start = 0;
                cont = function(i){
                    return i < playlist.length;
                }
                step = 1;
            }
            else {
                start = playlist.length - 1;
                step = -1;
                cont = function(i){
                    return i >= 0;
                }
            }

            for (var i = start; cont(i); i += step){
                item = playlist[i];
                if (item.playing){
                    if (cont(i + step)){
                        next = playlist[i + step];
                    }
                    else if (loop){
                        next = playlist[cmd == 'next' ? 0 : playlist.length - 1];
                    }

                    break;
                }
            }

            if (next != null){
                play(next.id);
            }
            return ;
        }
        else if (cmd == "shuffle"){
            return ;
        }
        else if (cmd == 'loop'){
            loop = !loop;
            triggerEvents('loop');
            return ;
        }
        else if (cmd == 'clearAll'){
            _cmd = 'stopVideo';
            playlist = [];
        }
        else if (cmd == 'playItem'){
            play(args['id']);
            return ;
        }
        else if (cmd == 'removeItem'){
            $.each(playlist, function(idx, item){
                if (item.id == args['id']){
                    playlist.splice(idx, 1);
                    return false;
                }
            });
            return ;
        }

        if (_cmd == null){
            _cmd = commandsMap[cmd];
        }

        player[_cmd](_args);
    }

    function doGetStatus(){
        var duration = player.getDuration();
        if (typeof(duration) == 'undefined'){
            duration = 0;
        }
        var position = player.getCurrentTime();
        if (typeof(position) == 'undefined'){
            position = 0;
        }
        var state = player.getPlayerState();
        if (typeof(state) == 'undefined'){
            state = 'stopped';
        }
        else if (state == 1){
            state = 'playing';
        }
        else if (state == 2){
            state = 'paused';
        }
        else {
            state = 'stopped';
        }
        var data = player.getVideoData();
        var url = player.getVideoUrl();
        if (typeof(url) == 'undefined'){
            url = '';
        }
        var streamInfo = {
            artist: '',
            description: '', 
            filename: '',
            genre: '',
            now_playing: '',
            title: '',
            url: url,
        }
        if (typeof(data) != 'undefined'){
            streamInfo.artist = data['author'];
            streamInfo.title = data['title'];
            if (state == 'playing'){
                streamInfo.now_playing = data['title'];
            }
        }
        var status = {
            length: Math.round(duration, 0), 
            loop: loop,
            position: position / duration,
            repeat: 0,
            state: state,
            streamInfo: streamInfo,
        }

        return status;
    }

    var getStatus = function(callback)
    {
        callback(doGetStatus());
    }

    function triggerEvents(key){
        var status = doGetStatus();
        for (var i in events[key]){
            events[key][i](status, status);
        }
    }

    function checkPosition(){
        triggerEvents('position');
    }

    var result = {
        _init: function(){
            $window.onYouTubeIframeAPIReady = function(){
                player = new YT.Player('youtubePlayer', {
                    height: '390',
                    width: '640',
                    events: {
                        onStateChange: function(ev){
                            triggerEvents('streamInfo');
                            triggerEvents('state');
                            if (timer != null){
                                $interval.cancel(timer);
                            }
                            if (ev.data == YT.PlayerState.PLAYING){
                                timer = $interval(checkPosition, 1000);
                            }
                            else if (ev.data == YT.PlayerState.ENDED){
                                doCommand('next');
                            }
                        },
                        onError: function(ev){
                            console.log('error is', ev);
                            doCommand('next');
                        }
                    },
                });
            }
            $('head').append($('#tplId').html());
        },
        _name: function(){
            return 'YOUTUBE Player';
        },
        getStatus: getStatus,
        onStatusChanged: function(property, callback){
            var properties = property.split(':');
            for (var i in properties){
                events[properties[i]].push(callback);
            }
        },
        doCommand: doCommand,
        getPlaylist: function(successCallback){
            var result = [];
            playlist.forEach(function(item){
                result.push({
                    duration: 0, 
                    id: item.id,
                    name: item.title,
                    playing: item.playing,
                    uri: commons.config().youtube.defaultVideoUri + '?v=' + item.videoId,
                });
            });
            successCallback(result);
        },
        getFiles: function(path, callback){
        },
        shuffle: function(callback){
            var new_list = [];
            $.each(playlist, function(idx, item){
                if (item.playing){
                    new_list.push(item);
                    playlist.splice(idx, 1);
                    return false;
                }
            });


            var idx;
            while (playlist.length > 0){
                idx = Math.floor((Math.random() * playlist.length) + 1) - 1;
                new_list.push(playlist.splice(idx, 1)[0]);
            }

            playlist = new_list;

            callback("ok");
        },
    }
    return result;
}]);

// Radio Backend Proxy service (A service which will pass the requests either to the VLC or the youtube player, depending on the needs)
vlcRadio.factory('playerProxy', ['commons', 'vlcPlayerWs', 'youtubePlayer', 'templateService', function(commons, vlc, youtube, tpl){
    var backends = {
        vlc: {player: vlc, icon: '', name: 'VLC', key: 'vlc'},
        youtube: {player: youtube, icon: '', name: 'Youtube', key: 'youtube'},
    }

    function doCommand(cmd, args){
        var youtubeRegexp = /^https?:\/\/(www\.)?youtube/i;
        var savedPlaylist = /\.playlist$/i;
        var r = /^backend:\/\/(.*)$/g;
        if (cmd == 'playItem' && args['id'].match(r)){
            current = args['id'].replace(r, '$1');
            console.log('current is now', current);
            return ;
        }
        if (cmd == 'openUrl'){
            backends[current].player.doCommand('stop');
            var url = args['url'];
            if (decodeURIComponent(url).match(youtubeRegexp)){
                args['url'] = decodeURIComponent(url);
                current = 'youtube';
            }
            else if (decodeURIComponent(url).match(savedPlaylist)){
                vlc._readFile(decodeURIComponent(url), function(content){
                    var items = JSON.parse(content);
                    $.each(items, function(idx, item){
                        doCommand(idx == 0 ? 'openUrl' : 'enque', {url: encodeURIComponent(item.uri.replace(/^file:\/\//i, ''))});
                    });
                });

                return ;
            }
            else {
                current = 'vlc';
            }
        }
        else if (cmd == 'enque'){
            var url = args['url'];
            var sentTo = '';
            if (decodeURIComponent(url).match(youtubeRegexp)){
                youtube.doCommand(cmd, args);
                sentTo = 'youtube';
            }
            else {
                vlc.doCommand(cmd, args);
                sentTo = 'vlc';
            }

            if (current != sentTo){
                backends[current].player.getStatus(function(status){
                    if (status.state == 'stopped'){
                        current = sentTo;
                    }
                })
            }

            return ;
        }

        backends[current].player.doCommand(cmd, args);
    }

    var current = 'vlc';
    var result = {
        _changeBackend: function(backend){
            backends[current].player.getStatus(function(status){
                if (status.state != 'stopped'){
                    commons.alert('The current backend can be changed only when stopped');
                    return ;
                }

                current = backend;
                commons.alert('The current backend is now ' + backends[current].name);
            })
        },
        _getBackends: function(){
            var result = [];
            for (key in backends){
                result.push(backends[key]);
            }
            return result;
        },
        _name: function(){
            return 'Proxy Backend service';
        },
        getStatus: function(callback){
            backends[current].player.getStatus(callback);
        },
        onStatusChanged: function(property, callback){
            vlc.onStatusChanged(property, callback);
            youtube.onStatusChanged(property, callback);
        },
        doCommand: function(cmd, args){
            doCommand(cmd, args);
        },
        getPlaylist: function(successCallback){
            backends[current].player.getPlaylist(function(playlist){
                if (playlist.length == 0){
                    for (var key in backends){
                        if (key != current){
                            playlist.push({
                                duration: 0, 
                                id: 'backend://' + key,
                                name: 'Change backend to ' + backends[key].name,
                                playing: false,
                                uri: 'backend://' + key,
                            });
                        }
                    }
                }
                successCallback(playlist);
            });
        },
        getFiles: function(path, callback){
            vlc.getFiles(path, callback);
        },
        shuffle: function(callback){
            backends[current].player.shuffle(callback);
        },
        saveAsPlaylist: function(name, path){
            backends[current].player.getPlaylist(function(items){
                vlc._saveFile(name + '.playlist', path, JSON.stringify(items));
            });
        },
    }

    if (commons.config().youtube.useIframeAPI){
        youtube._init();
    }

    return result;
}]);

// VLC Player Service with WebSockets
vlcRadio.factory('vlcPlayerWs', ['$http', '$interval', 'xmlService', 'commons', 'uuidService', function($http, $interval, xmlService, commons, uuid){
    var callbacks = {};
    var events = {
        streamInfo: [], length: [], position: [], repeat: [], loop: [], state: [], shuffle: [],
    }
    var eventsMap = {
        MediaPlayerPlaying: 'state',
        MediaPlayerPaused: 'state',
        MediaPlayerStopped: 'state',
        MediaPlayerEndReached: 'state',
        MediaPlayerMediaChanged: 'streamInfo',
        MediaMetaChanged: 'streamInfo',
        MediaPlayerTitleChanged: 'streamInfo',
        MediaPlayerTimeChanged: 'position',
        MediaLooping: 'loop',
    };
    function triggerEvents(key, status){
        for (var i in events[key]){
            events[key][i](status, status);
        }
    }
    var websocket = null;
    function sendCommand(command, callback){
        if (websocket == null){
            console.log('websocket not initialized yet');
        }
        else {
            if (callback){
                var id = uuid.generate();
                callbacks[id] = callback;
                command['callback_id'] = id + "";
            }
            if (websocket.readyState == 1){
                console.log('send command', command);
                websocket.send(decodeURIComponent(JSON.stringify(command)));
            }
            else {
                websocket.onopen = function(ev){
                    websocket.send(decodeURIComponent(JSON.stringify(command)));
                }
            }
        }
    }
    function initWebSocket() {
        var wsUri = "ws://localhost:1234";
        try {
            if (typeof MozWebSocket == 'function')
                WebSocket = MozWebSocket;
            if ( websocket && websocket.readyState == 1 )
                websocket.close();
            websocket = new WebSocket( wsUri );
            websocket.onmessage = function (evt) {
                // console.log('got message', evt);
                var result = evt.data == "" ? {} : JSON.parse(evt.data);
                if (result.callback_id){
                    for (var key in callbacks){
                        if (key == result.callback_id){
                            callbacks[key](result.data);
                            delete callbacks[key];
                            break;
                        }
                    }
                }
                else if (result.event){
                    // console.log('got event', result);
                    triggerEvents(eventsMap[result.event], result.status, result.status);
                }
            };
        } catch (exception) {
            console.log('ERROR connecting to socket: ' + exception);
        }
    }

    function getPlaylist(callback){
        sendCommand({command: 'get_playlist', args: null}, function(result){
            callback(result);
        });
    }

    var result = {
        _name: function(){
            return 'VLC PLAYER with WS';
        },
        getStatus: function(callback){
            sendCommand({command: 'get_status', args: null}, function(result){
                callback(result);
            })
        },
        onStatusChanged: function(property, callback){
            var properties = property.split(':');
            for (var i in properties){
                events[properties[i]].push(callback);
            }
        },
        doCommand: function(cmd, args){
            if (!args){
                args = null;
            }
            sendCommand({command: cmd, args: args});
        },
        getPlaylist: function(successCallback){
            getPlaylist(successCallback);
        },
        getFiles: function(path, callback){
            sendCommand({command: 'browse_files', args: {path: path}}, function(result){
                callback(result);
            })
        },
        shuffle: function(callback){
            sendCommand({command: 'shuffle', args: null}, function(result){
                callback(result);
            })
        },
        _saveFile: function(name, path, content){
            sendCommand({command: 'save_file', args: {name: name, path: path, content: content}}, function(){
                commons.alert(name + ' saved');
            })
        },
        _readFile: function(name, callback){
            sendCommand({command: 'read_file', args: {file: name}}, function(data){
                callback(data);
            });
        },
        saveAsPlaylist: function(){
            console.log("not implemented");
        },
    }

    initWebSocket();
    return result;
}]);

vlcRadio.factory('filesBrowser', ['commons', 'xmlService', 'favouritesService', 'playerInterface', function(commons, xmlService, favourites, player){
    return {
        navigate: function(path){
            if (path == null){
                path = commons.config().browsersPaths.local;
            }

            var self = this;

            player.getFiles(path, function(result){
                result.forEach(function(item){
                    if (item.type == 'file'){
                        item.options = ['addToFavourites', 'enque'];
                    }
                });

                self._navigationFinished(result);
            })
        },
        selectItem: function(item, option){
            if (item.type == 'dir'){
                this.navigate(item.path);
            }
            else if (item.type == 'file'){
                if (option == 'addToFavourites'){
                    favourites.add(item.name, item.path);
                    this._optionsFinished('Favourite has been added');
                }
                else if (option == 'enque'){
                    player.doCommand('enque', {url: item.path});
                    this._optionsFinished(item.name + ' has been enqued');
                }
                else {
                    this._mediaClicked(item);
                }
            }
        }
    }
}]);

vlcRadio.factory('keyboardHistoryBrowser', ['commons', 'keyboardHistoryService', function(commons, keyboardHistory){
    return {
        _name: 'keyboardHistory',
        navigate: function(path){
            var history = keyboardHistory.get();
            var result = [];
            if (path == null){
                for (var category in history){
                    result.push({
                        type: 'dir', 
                        path: category,
                        name: category,
                    });
                }
            }
            else {
                result.push({
                    type: 'dir', 
                    path: null,
                    name: '..',
                });

                if (history[path]){
                    for (var i = history[path].length - 1; i >= 0; i--){
                        result.push({
                            type: 'file',
                            path: history[path][i],
                            name: history[path][i],
                        })
                    }
                }
            }
            this._navigationFinished(result, false);
        },
        selectItem: function(item, option){
            if (item.type == 'dir'){
                this.navigate(item.path);
            }
            else if (item.type == 'file'){
                if (option == 'addToFavourites'){
                    favourites.add(item.name, item.path);
                    this._optionsFinished('Favourite has been added');
                }
                else {
                    this._mediaClicked(item);
                }
            }
        }
    }
}]);

vlcRadio.factory('youtubeBrowser', ['commons', 'favouritesService', 'playerInterface', function(commons, favourites, player){
    return {
        navigate: function(path){
            var self = this;
            if (path == null){
                commons.makeYoutubeRequest({
                    url: commons.config().youtube.apiEndPoint + 'playlists',
                    options: {
                        key: commons.config().youtube.apiKey,
                        part: 'snippet',
                        channelId: commons.config().youtube.channelId,
                        maxResults: commons.config().youtube.maxResults,
                    },
                    success: function(pages){
                        var result = [{
                            type: 'dir', 
                            path: 'search', 
                            name: 'Search',
                        }];
                        pages.forEach(function(page){
                            page.items.forEach(function(item){
                                result.push({
                                    name: item.snippet.title,
                                    path: commons.config().youtube.playlistBaseUrl + item.id,
                                    type: 'file',
                                    options: ['addToFavourites', 'enque'],
                                });
                            });
                        });

                        self._navigationFinished(result);
                    }
                })
            }
            else {
                var search = JSON.parse(path);
                commons.makeYoutubeRequest({
                    url: commons.config().youtube.apiEndPoint + 'search',
                    options: {
                        key: commons.config().youtube.apiKey, 
                        part: 'snippet',
                        maxResults: commons.config().youtube.maxResults,
                        q: search.query,
                        type: search.type,
                        pageToken: search.page,
                    },
                    maxPages: 1,
                    success: function(pages){
                        function addSearch(search, token, label){
                            search['page'] = token;
                            return {
                                name: label,
                                path: JSON.stringify(search),
                                type: 'dir',
                            }
                        }
                        var result = [{
                            name: '..',
                            path: null,
                            type: 'dir',
                        }];

                        var page = pages[0];
                        var currentPage = search['page'];
                        if (typeof(page.prevPageToken) != 'undefined'){
                            result.push(addSearch(search, page.prevPageToken, 'Previous page'));
                        }
                        if (typeof(page.nextPageToken) != 'undefined'){
                            result.push(addSearch(search, page.nextPageToken, 'Next page'));
                        }

                        if (search['type'] == 'playlist'){
                            search['type'] = 'video';
                            result.push(addSearch(search, currentPage, 'Search videos'));
                        }
                        else {
                            search['type'] = 'playlist';
                            result.push(addSearch(search, currentPage, 'Search playlists'));
                        }

                        page.items.forEach(function(item){
                            var url = typeof(item.id.videoId) == 'undefined' ? 
                                commons.config().youtube.playlistBaseUrl + item.id.playlistId : 
                                commons.config().youtube.defaultVideoUri + '?v=' + item.id.videoId;
                            result.push({
                                name: item.snippet.title,
                                path: url,
                                type: 'file',
                                options: ['addToFavourites', 'enque'],
                            });
                        });

                        self._navigationFinished(result);
                    }
                });
            }
        },
        selectItem: function(item, option){
            var self = this;
            if (item.path == 'search'){
                commons.prompt({prompt: 'Search query:', type: 'text', inputCategory: 'Youtube'}, function(query){
                    if (query != null){
                        var search = {
                            type: 'playlist',
                            page: '',
                            query: query,
                        }
                        self.navigate(JSON.stringify(search));
                    }
                    else {
                        self.navigate(null);
                    }
                });
            }
            else if (item.type == 'dir'){
                self.navigate(item.path);
            }
            else {
                if (option == 'addToFavourites'){
                    var self = this;
                    player.getStatus(function(status){
                        var path = item.path;
                        if (status.shuffle){
                            path += '&shuffle=';
                        }
                        favourites.add(item.name, path);
                        self._optionsFinished('Playlist added to favourites');
                    })
                }
                else if (option == 'enque'){
                    player.doCommand('enque', {url: item.path});
                    self._optionsFinished(item.name + ' enqued');
                }
                else {
                    this._mediaClicked(item);
                }
            }
        }
    }
}]);

vlcRadio.factory('radioBrowser', ['commons', 'favouritesService', function(commons, favourites){
    return {
        _name: 'radio',
        navigate: function(path){
            var url = commons.config().vtunner.baseUrl;
            if (path != null){
                if (path.match(/^search/)){
                    path = path.replace(/^search\/(.*)$/, 'SearchForm.asp?sSearchType=&sSearchInput=$1');
                }
                url += '&p=' + encodeURIComponent(path);
            }

            var self = this;

            $.ajax({
                url: url,
                success: function(data, code, xhr){
                    self._navigationFinished(data);
                }
            });
        },
        selectItem: function(item, option){
            if (item.type == 'dir'){
                this.navigate(item.path);
            }
            else if (item.type == 'file'){
                if (option == 'addToFavourites'){
                    favourites.add(item.name, item.path);
                    this._optionsFinished('Radio added to favourites');
                }
                else {
                    this._mediaClicked(item);
                }
            }
            else if (item.type == 'search'){
                var self = this;
                commons.prompt({prompt: 'Search query:', type: 'text', inputCategory: 'Radio'}, function(query){
                    self.navigate(query == null ? null : 'search/' + encodeURIComponent(query));
                });
            }
        }
    }
}])

vlcRadio.factory('favouritesBrowser', ['commons', 'cacheService', 'favouritesService', 'playerInterface', function(commons, cache, favourites, player){
    return {
        navigate: function(path){
            var favourites = cache.get('localFavourites');
            var items = [];
            for (var i in favourites){
                items.push({
                    type: 'file',
                    path: favourites[i].url,
                    name: favourites[i].title,
                    options: ['delete', 'enque'],
                })
            }
            this._navigationFinished(items);
        },
        selectItem: function(item, option){
            if (option == 'delete'){
                favourites.remove(item);
                // this._optionsFinished(item.name + ' removed from favourites');
                this.navigate(null);
            }
            else if (option == 'enque'){
                player.doCommand('enque', {url: item.path});
                this._optionsFinished(item.name + ' enqued');
            }
            else {
                this._mediaClicked(item);
            }
        }
    }
}]);

vlcRadio.factory('alarmsBrowser', ['commons', 'cacheService', 'alarmService', function(commons, cache, alarms){
    return {
        navigate: function(path){
            var alarms = cache.get('alarms', []);
            var items = [{
                type: 'new', 
                name: 'Add new alarm',
                sortOrder: 0,
            }];
            for (var i in alarms){
                items.push({
                    type: 'alarm',
                    name: alarms[i].title,
                    options: ['delete', alarms[i].enabled ? 'disable' : 'enable'],
                    sortOrder: 10,
                    alarmData: alarms[i],
                })
            }
            this._navigationFinished(items);
        },
        selectItem: function(item, option){
            if (option == 'delete'){
                alarms.del(item.alarmData.id);
                this.navigate(null);
            }
            else if (option == 'disable' || option == 'enable'){
                alarms[option](item.alarmData);
                this.navigate(null);
            }
            else {
                this._mediaClicked(item);
            }
        }
    }
}]);

vlcRadio.factory('historyBrowser', ['commons', 'historyService', function(commons, history){
    return {
        navigate: function(path){
            var items = history.get();
            var result = [];
            for (var i = items.length - 1; i >= 0; i--){
                result.push({
                    type: 'file', 
                    path: items[i].url, 
                    name: items[i].name,
                });
            }

            this._navigationFinished(result, false);
        },
        selectItem: function(item, option){
            this._mediaClicked(item)
        }
    }
}])

vlcRadio.factory('dirBrowser', ['commons', 'playerInterface', 'cacheService', function(commons, player, cache){
    return {
        navigate: function(path){
            if (path == null){
                path = commons.config().browsersPaths.local;
            }

            var self = this;

            player.getFiles(path, function(items){
                var result = []
                items.forEach(function(item){
                    if (item.type == 'dir'){
                        if (item.name != '..'){
                            item.options = ['select'];
                        }
                        result.push(item);
                    }
                });

                self._navigationFinished(result);
            })
        },
        selectItem: function(item, option){
            if (option == 'select'){
                this._mediaClicked(item);
            }
            else if (item.type == 'dir'){
                cache.set('dirBrowserLocation', item.path);
                this.navigate(item.path);
            }
        }
    }
}]);

vlcRadio.factory('playlistBrowser', ['commons', 'playerInterface', 'favouritesService', 'cacheService', function(commons, player, favourites, cache){
    return {
        navigate: function(path){
            if (path == null){
                var self = this;
                player.getPlaylist(function(items){
                    var playlist = [];
                    playlist.push({
                        type: 'dir',
                        name: 'Save as playlist',
                        path: 'save-as-playlist',
                    })
                    for (var i in items){
                        playlist.push({
                            type: 'file',
                            id: items[i].id.replace(/^plid_/, ''),
                            path: items[i].uri,
                            name: items[i].name,
                            playing: items[i].playing,
                            options: ['addToFavourites', 'delete'],
                        });
                    }
                    if (playlist.length == 1){
                        playlist = [];
                    }
                    self._navigationFinished(playlist, false);
                });
            }
            else {
                var self = this;
                commons.browse({type: 'dir', path: cache.get('dirBrowserLocation')}, function(item){
                    commons.prompt({prompt: 'Playlist name:', type: 'text', inputCategory: 'Save playlist'}, function(query){
                        if (query != null){
                            player.saveAsPlaylist(query, item.path);
                            self.navigate(null);
                        }
                    });
                })
            }
        },
        selectItem: function(item, option){
            if (item.type == 'dir'){
                this.navigate(item.path);
            }
            else if (option == 'addToFavourites'){
                favourites.add(item.name, item.path);
                this._optionsFinished(item.name + ' added to favourites');
            }
            else if (option == 'delete'){
                player.doCommand('removeItem', {id: item.id});
                this.navigate(null);
            }
            else {
                this._mediaClicked(item);
            }
        }
    }
}])

vlcRadio.factory('uuidService', ['commons', 'cacheService', function(commons, cache){
    return {
        generate: function(){
            var result = cache.get('uuid', 0);
            if (result > 10000){
                result = 0;
            }
            cache.set('uuid', result + 1);
            var d = new Date();
            result += d.getTime();
            delete d;
            return result;
        }
    }
}]);

vlcRadio.factory('alarmService', ['$timeout', 'commons', 'playerInterface', 'cacheService', 'uuidService', function($timeout, commons, player, cache, uuid){
    var alarms = [];
    function loadAlarmsFromCache(){
        var result = cache.get('alarms', []);
        for (var i in result){
            result[i].date = new Date(result[i].date);
        }

        return result;
    }
    function _removeAlarmFromArray(array, id){
        for (var i in array){
            if (array[i].id == id){
                array.splice(i, 1);
                break;
            }
        }
    }
    function setAlarm(alarm){
        if (!alarm.triggered){
            alarm.triggered = 0;
        }
        var d = new Date();
        var time;
        if (alarm.date > d){
            time = alarm.date - d;
        }
        else {
            var next = nextAlarmTime(alarm);
            if (next == null && alarm.enabled){
                return null;
            }

            time = next - d;
        }

        if (!alarm.id){
            alarm.id = uuid.generate();
        }

        if (alarm.enabled){
            var timerPromise = $timeout(function(){
                triggerAlarm(alarm);
            }, time);

            alarms.push({
                id: alarm.id,
                timerPromise: timerPromise,
            });
        }

        var _alarms = loadAlarmsFromCache();
        _alarms.push(alarm);
        cache.set('alarms', _alarms);

        return alarm.id;
    }
    function nextAlarmTime(alarm){
        if ((alarm.repeat == null || alarm.repeat == '') && alarm.triggered > 0){
            return null;
        }
        var d = alarm.date;
        if (typeof(d) == 'string'){
            d = new Date(d);
        }
        do {
            if (alarm.repeat == 'daily'){
                d.setDate(d.getDate() + 1);
            }
            else if (alarm.repeat == 'weekdays'){
                do {
                    d.setDate(d.getDate() + 1);
                } while (d.getDay() == 6 || d.getDay() == 0);
            }
            else if (alarm.repeat == 'weekends'){
                do {
                    d.setDate(d.getDate() + 1);
                } while (d.getDay() != 6 && d.getDay() != 0);
            }
            else {
                d.setMilliseconds(d.getMilliseconds() + alarm.repeat);
            }
        } while (d < new Date());

        return d;
    }
    function removeAlarm(id){
        _removeAlarmFromArray(alarms, id);
        var _alarms = loadAlarmsFromCache();
        _removeAlarmFromArray(_alarms, id);
        cache.set('alarms', _alarms);
    }
    function triggerAlarm(alarm){
        if (alarm.command == 'log'){
            console.log('alarm triggered', alarm);
        }
        else {
            player.doCommand(alarm.command, alarm.command_args);
        }
        removeAlarm(alarm.id);
        alarm.triggered++;

        var d = nextAlarmTime(alarm);

        if (alarm.command == 'log'){
            console.log('next alarm time is', d);
        }

        if (d != null){
            alarm.date = d;
            setAlarm(alarm);
        }
    }
    function setAllAlarms(){
        var _alarms = loadAlarmsFromCache();
        for (var i in _alarms){
            var id = setAlarm(_alarms[i]);
            if (id == null){
                _alarms[i].del = true;
            }
        }

        var cleanAlarms = [];
        for (var i in _alarms){
            if (!_alarms[i].del){
                cleanAlarms.push(_alarms[i]);
            }
        }

        cache.set('alarms', cleanAlarms);
    }
    function deleteAndStopAlarm(id){
        for (var i in alarms){
            if (alarms[i].id == id){
                $timeout.cancel(alarms[i].timerPromise);
                break;
            }
        }
        removeAlarm(id);
    }

    setAllAlarms();

    return {
        add: function(title, date, repeat, command, command_args){
            var d = new Date();
            if (date < d){
                date.setDate(date.getDate() + 1);
            }
            var alarm = {
                title: title,
                date: date, 
                command: command, 
                command_args: command_args,
                repeat: repeat,
                enabled: true,
            };
            setAlarm(alarm);

            return alarm.id;
        },
        get: function(id){
            var alarms = loadAlarmsFromCache();
            for (var i in alarms){
                if (alarms[i].id == id){
                    return alarms[i];
                }
            }

            return null;
        },
        disable: function(alarm){
            deleteAndStopAlarm(alarm.id);
            alarm.enabled = false;
            setAlarm(alarm);
        },
        enable: function(alarm){
            removeAlarm(alarm.id);
            alarm.enabled = true;
            setAlarm(alarm);
        },
        update: function(alarm){
            removeAlarm(alarm.id);
            setAlarm(alarm);
        },
        del: deleteAndStopAlarm,
    }
}]);

vlcRadio.factory('timerService', ['commons', 'dateTimeService', function(commons, date){
    var timer = null;
    var pausedTimer = null;
    var isBoom = false;

    var tickEvents = [];
    var boomEvents = [];

    function getHMS(){
        var d = new Date();
        var seconds = Math.round((timer - d) / 1000);
        var hours = Math.floor(seconds / (60 * 60));
        var minutes = Math.floor((seconds - hours * 60 * 60) / 60);
        var seconds = seconds - hours * 60 * 60 - minutes * 60;

        delete d;
        return {hours: hours, minutes: minutes, seconds: seconds};
    }

    date.onTick(function(){
        if (timer != null){
            if (timer <= new Date()){
                _stop();
                isBoom = true;
                for (var i in boomEvents){
                    boomEvents[i]();
                }
                return ;
            }
            for (var i in tickEvents){
                hms = getHMS();
                tickEvents[i](hms.hours, hms.minutes, hms.seconds);
            }
        } 
    });

    function _stop(){
        isBoom = false;
        delete timer;
        timer = null;
    }

    function _set(hours, minutes, seconds){
        timer = new Date();
        timer.setSeconds(timer.getSeconds() + seconds);
        timer.setMinutes(timer.getMinutes() + minutes);
        timer.setHours(timer.getHours() + hours);
    }

    return {
        set: _set,
        pause: function(){
            if (timer != null){
                pausedTimer = getHMS();
                _stop();
            }
        },
        resume: function(){
            if (pausedTimer != null){
                _set(pausedTimer.hours, pausedTimer.minutes, pausedTimer.seconds);
                pausedTimer = null;
            }
        },
        stop: _stop,
        onTick: function(callback){
            tickEvents.push(callback);
        },
        onBoom: function(callback){
            boomEvents.push(callback);
        },
        isSet: function(){
            return isBoom || timer != null || pausedTimer != null;
        },
        isPaused: function(){
            return pausedTimer != null;
        },
        isAlarm: function(){
            return isBoom;
        },
        get: function(){
            if (isBoom){
                return {hours: 0, seconds: 0, minutes: 0};
            }
            if (timer != null){
                return getHMS();
            }

            if (pausedTimer != null){
                return pausedTimer;
            }

            return null;
        },
    }
}]);

vlcRadio.factory('historyService', ['commons', 'cacheService', 'playerInterface', function(commons, cache, player){
    player.onStatusChanged('streamInfo', function(oldStatus, newStatus){
        player.getPlaylist(function(items){
            var history = cache.get('history', []);
            for (var i in items){
                if (items[i].playing){
                    // Ugly hack for youtube. The VLC Player
                    // will register each youtube clip with the youtube url
                    // and then with the google video.
                    // we keep only the url with youtube, not the googlevideo
                    if (items[i].uri.match(/googlevideo/)){
                        return ;
                    }

                    var currentItem = items[i];
                    break;
                }
            }
            var url;
            if (commons.get(newStatus, 'streamInfo.filename', '').match(/^(http|file):\/\//)){
                url = newStatus.streamInfo.filename;
            }
            else {
                url = commons.get(currentItem, 'uri', '');
                if (url == ''){
                    return ;
                }
            }
            var name;
            if (typeof(newStatus.streamInfo.now_playing) != 'undefined' && newStatus.streamInfo.now_playing != ""){
                name = newStatus.streamInfo.now_playing;
            }
            else {
                name = currentItem.name;
            }
            if (history.length > 0 && history[history.length - 1].url == url && history[history.length - 1].name == name){
                return ;
            }
            history.push({url: url, name: name});
            while (history.length >= 100){
                history.shift();
            }
            cache.set('history', history);
        });
    });

    return {
        get: function(){
            return cache.get('history', []);
        }
    }
}])

vlcRadio.factory('keyboardHistoryService', ['commons', 'cacheService', function(commons, cache){
    return {
        get: function(category){
            var result = cache.get('keyboardHistory', {});
            if (category){
                if (typeof(result[category]) == 'undefined'){
                    return [];
                }
                return result[category];
            }
            return result;
        },
        add: function(type, input){
            var history = cache.get('keyboardHistory', {});
            var collection = commons.get(history, type, []);
            collection.push(input);
            if (collection.length >= 100){
                collection.shift();
            }
            history[type] = collection;
            cache.set('keyboardHistory', history);
        },
        del: function(type){
            var history = cache.get('keyboardHistory', {});
            if (typeof(history[type]) != 'undefined'){
                delete history[type];
                cache.set('keyboardHistory', history);
            }
        }
    }
}]);
