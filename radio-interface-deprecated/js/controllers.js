vlcRadio.controller('DialogController', ['$scope', '$mdDialog', function($scope, $mdDialog){
    $scope.answer = function(answer){
        $mdDialog.hide(answer);
    }
}]);

vlcRadio.controller('TestController', ['$scope', '$timeout', 'commons', 'xmlService', 'playerInterface', 'itemsBrowserInterface', 'currentWeatherService', 'dateTimeService', 'cacheService', 'forecastWeatherService', 'uuidService', 'alarmService', 'timerService', 'favouritesService', 'historyService', 'keyboardHistoryService', 'youtubePlayer', 'youtubeInfo', 'templateService', 'vlcPlayerWs', function($scope, $timeout, commons, xmlService, player, browser, weather, dateTime, cache, forecast, uuid, alarms, timer, favourites, history, keyboardHistory, youtubePlayer, youtubeInfo, tpl, vlc){
    $scope.showProgress = false;
    $scope.tests = {
        testEvents: function(){
            console.log('Testing events');
            // player.onStatusChanged('position', function(oldStatus, newStatus){
            //     console.log('callback 1');
            //     console.log('position changed from ', oldStatus.position, newStatus.position);
            // });

            // player.onStatusChanged('position', function(oldStatus, newStatus){
            //     console.log('callback 2');
            //     console.log('position changed from ', oldStatus.position, newStatus.position);
            // });

            player.onStatusChanged('state', function(oldStatus, newStatus){
                console.log('callback 1');
                console.log('state changed from ', oldStatus.state, newStatus.state);
            })

            player.onStatusChanged('state', function(oldStatus, newStatus){
                console.log('callback 2');
                console.log('state changed from ', oldStatus.state, newStatus.state);
            });

            player.onStatusChanged('streamInfo', function(oldStatus, newStatus){
                console.log('callback 1');
                console.log('stream info changed from ', oldStatus.streamInfo, newStatus.streamInfo);
            });

            player.onStatusChanged('streamInfo', function(oldStatus, newStatus){
                console.log('callback 2');
                console.log('stream info changed from ', oldStatus.streamInfo, newStatus.streamInfo);
            });
        },
        testGetStatus: function(){
            console.log('testing get status');
            player.getStatus(function(status){
                console.log('status is', status);
            })
        },
        testXml2Json: function(){
            console.log('testing xml2json');
            var xml1 = xmlService.getInstance("<root1></root1>");
            var xml2 = xmlService.getInstance("<root2></root2>");
            console.log('the objs are', xml1.getJson(), xml2.getJson());
        },
        testPlaylist: function(){
            console.log('testing playlist');
            player.getPlaylist(function(data){
                console.log("data is", data);
            }, function(msg){
                commons.alert(msg.statusText, 'Error');
            });
        },
        testProgress: function(){
            console.log('show progress');
            $scope.showProgress = true;
        },
        testAlert: function(){
            console.log('test alert');
            commons.alert('alert message', 'Alert');
        },
        testDialog: function(){
            commons.showDialog('#dialogTemplate', function(answer){
                console.log('answer is', answer);
            });
        },
        testFileBrowser: function(){
            commons.setImplementation(browser, 'filesBrowser');
            browser._onNavigateFinished(function(items){
                console.log('items are', items);
            })
            browser.navigate(null);
        },
        testYoutubeBrowser: function(){
            commons.setImplementation(browser, 'youtubeBrowser');
            browser._onNavigateFinished(function(items){
                console.log('items are', items);
            })
            browser.navigate(null);
            var search = {
                type: 'playlist',
                page: '',
                query: 'system of a down',
            }
            browser.navigate(JSON.stringify(search));
            search = {
                type: 'video',
                page: '',
                query: 'system of a down',
            }
            browser.navigate(JSON.stringify(search));
        },
        testConfig: function(){
            console.log('testing config');
            console.log('youtube api end point is', commons.config().youtube.apiEndPoint);
        },
        testWeather: function(){
            console.log('testing weather');
            weather.onWeatherChanged(function(data){
                console.log("weather is", data);
            })
        },
        testDateTime: function(){
            console.log('testing the date time service');
            dateTime.onTimeChanged(function(d){
                console.log('new time is', d);
            });
            dateTime.onTick(function(d){
                console.log('tick ', d.getSeconds());
            })
        },
        testIdle: function(){
            console.log('testing idle mechanism');
            $scope.$on('idle', function(){
                console.log('entering idle');
            });
            $scope.$on('resume', function(){
                console.log('resuming');
            })
        },
        testCache: function(){
            console.log('testing cache');
            var value = {i1: 'val 1', i2: 'val 2'};
            cache.set('test', value, 9);
            console.log('value is', cache.get('test'));
            cache.list();
            setTimeout(function(){
                console.log('value is', cache.get('test'));
                cache.list();
            }, 10 * 1000);
        },
        testForecast: function(){
            console.log('testing forecast');
            forecast.onWeatherChanged(function(data){
                console.log("forecast is", data);
            })
        },
        testKeyboard: function(){
            console.log('testing keyboard');
            $scope.$emit('needKeyboard', {prompt: 'This is a prompt', type: 'text', inputCategory: 'test'}, function(result){
                console.log('you typed', result);
                console.log('keyboard history is', keyboardHistory.get());
            });
        },
        testNumericKeyboard: function(){
            console.log('testing numerical keyboard');
            $scope.$emit('needKeyboard', {prompt: 'This is a numerical prompt', type: 'numerical', inputCategory: 'test'}, function(result){
                console.log('you typed', result);
            })
        },
        testUuid: function(){
            console.log('testing uuid');
            console.log('uuid is', uuid.generate());
            console.log('uuid is', uuid.generate());
            console.log('uuid is', uuid.generate());
        },
        testAlarm: function(){
            console.log('testing alarms');
            var d = new Date();
            d.setMilliseconds(d.getMilliseconds() + 5000);
            var id = alarms.add('Alarm 1', new Date(d), 10000, 'log', null);
            var id2 = alarms.add('Alarm 2', new Date(d), 'weekdays', 'log', null);
            var id3 = alarms.add('Alarm 3', new Date(d), 'weekends', 'log', null);
            var id4 = alarms.add('Alarm 4', new Date(d), 10000, 'log', null);
            console.log('id is', id);
            console.log('id2 is', id2);
            console.log('id3 is', id3);
            console.log('id4 is', id4);
            $timeout(function(){
                alarms.disable(alarms.get(id4));
                console.log('disabled alarm is', alarms.get(id4));
            }, 9000);
            $timeout(function(){
                alarms.enable(alarms.get(id4));
                console.log('enabled alarm is', alarms.get(id4));
            }, 18000);
            $timeout(function(){
                alarms.del(id);
                alarms.del(id2);
                alarms.del(id3);
                alarms.del(id4);
                console.log('alarms deleted');
            }, 30000);
        },
        testAlarmWithPlayer: function(){
            console.log('testing alarm with player');
            var d = new Date();
            d.setMilliseconds(d.getMilliseconds() + 5000);
            var id = alarms.add(new Date(d), null, 'openUrl', {url: encodeURIComponent('https://youtube.com/playlist?list=PLhPuhmVojEof7_t6S_QlQaVxju4_KygZu')})
        },
        testTimer: function(){
            console.log('testing countdown timer');
            timer.set(0, 0, 15);
            timer.onTick(function(h, m, s){
                console.log('ticking', h, m, s);
            });
            $timeout(function(){
                timer.pause();
                var hms = timer.get();
                console.log('timer is', hms.hours, hms.minutes, hms.seconds);
            }, 5000);
            $timeout(function(){
                timer.resume();
            }, 10000);
            timer.onBoom(function(){
                console.log('count down expired. BOOM');
            })
        },
        testFavourites: function(){
            console.log('Testing favourites');
            console.log('favourites are', favourites.get());
        },
        testHistory: function(){
            console.log('Testing history');
            console.log('history is', history.get());
            $timeout(function(){
                player.doCommand('next');
                $timeout(function(){
                    player.doCommand('next');
                    $timeout(function(){
                        console.log('history is', history.get());
                    }, 10000);
                }, 10000);
            }, 10000);
        },
        testKeyboardHistoryService: function(){
            keyboardHistory.add('youtube', 'system of a down');
            keyboardHistory.add('youtube', 'implant pentru refuz');
            keyboardHistory.add('radios', 'rock fm');
            keyboardHistory.add('radios', 'gold fm');
            console.log('history is', keyboardHistory.get());
            keyboardHistory.del('youtube');
            keyboardHistory.del('radios');
            console.log('history is', keyboardHistory.get());
        },
        testYoutubePlayer: function(){
            var promise = youtubePlayer.doCommand('openUrl', {url: 'https://www.youtube.com/watch?v=Q6k0Qpv6oi8&list=PLhPuhmVojEof7_t6S_QlQaVxju4_KygZu'});
            console.log('result is', promise);
            var item6;
            $timeout(function(){
                youtubePlayer.getPlaylist(function(items){
                    console.log('items', items);
                    item6 = items[6];
                });
                youtubePlayer.getStatus(function(status){
                    console.log('status is', status);
                });
                youtubePlayer.doCommand('seek_forward', {time: 10});
                youtubePlayer.doCommand('loop');
                $timeout(function(){
                    youtubePlayer.getStatus(function(status){
                        console.log('status is', status);
                    });
                    youtubePlayer.doCommand('enque', {url: 'https://www.youtube.com/watch?v=xIqaIfaJ3-E'});
                    var promise = youtubePlayer.doCommand('next');
                    console.log('promise is', promise);
                    $timeout(function(){
                        youtubePlayer.doCommand('playItem', {id: item6.id});
                        $timeout(function(){
                            youtubePlayer.getPlaylist(function(items){
                                console.log('items', items);
                            })
                            youtubePlayer.doCommand('stop');
                            youtubePlayer.getStatus(function(status){
                                console.log('status is', status);
                            });
                            youtubePlayer.doCommand('openUrl', {url: 'https://www.youtube.com/watch?v=CSvFpBOe8eY'});
                            $timeout(function(){
                                youtubePlayer.doCommand('seek_forward', {time: 90});
                                $timeout(function(){
                                    youtubePlayer.doCommand('clearAll');
                                    $timeout(function(){
                                        youtubePlayer.getStatus(function(status){
                                            console.log('status is', status);
                                        });
                                        youtubePlayer.getPlaylist(function(items){
                                            console.log('items are', items);
                                        });
                                    }, 2000);
                                }, 20000)
                            }, 2000);
                        }, 10000);
                    }, 10000);
                }, 10000);
            }, 10000);
        },
        testYoutubeVideosInfo: function(){
            youtubeInfo.getVideoInfo(['Q6k0Qpv6oi8', 'xIqaIfaJ3-E'], function(items){
                console.log('infos are', items);
            });
            youtubeInfo.getPlaylistInfo('PLDC0E3D2BB4F3D234', function(items){
                console.log('items are', items);
            });
        },
        testPlayer: function(){
            player.doCommand('openUrl', {url: 'https://www.youtube.com/watch?v=Q6k0Qpv6oi8&list=PLhPuhmVojEof7_t6S_QlQaVxju4_KygZu'});
            $timeout(function(){
                player.getPlaylist(function(items){
                    console.log('items are', items);
                    player.doCommand('openUrl', {url: '/home/lixa/Music/cata/cata.xspf'});
                    $timeout(function(){
                        player.getPlaylist(function(items){
                            console.log('items are', items);
                            player.doCommand('enque', {url: 'https://www.youtube.com/watch?v=CSvFpBOe8eY'});
                            $timeout(function(){
                                youtubePlayer.getPlaylist(function(items){
                                    console.log('youtube items are', items);
                                })
                                player.doCommand('stop');
                            }, 10000);
                        })
                    }, 10000);
                })
            }, 10000);
        },
        testMakeYoutubeRequest: function(){
            commons.makeYoutubeRequest({
                url: 'https://www.googleapis.com/youtube/v3/playlists',
                options: {
                    channelId: 'UCmwocxSgqhULM1PwnROQbfw',
                    key: commons.config().youtube.apiKey,
                    part: 'snippet',
                }, 
                success: function(pages){
                    console.log('The pages are', pages);
                }
            });
            commons.makeYoutubeRequest({
                url: 'https://www.googleapis.com/youtube/v3/playlists',
                options: {
                    channelId: 'UCmwocxSgqhULM1PwnROQbfw',
                    key: commons.config().youtube.apiKey,
                    part: 'snippet',
                }, 
                maxPages: 1,
                success: function(pages){
                    console.log('The pages are', pages);
                }
            });
        },
        testTemplateEngine: function(){
            console.log('template is', tpl.parse('xpfs-template', {name: 'test', tracks: 'tracks'}));
        },
        testReadFile: function(){
            vlc._readFile('file:///home/lixa/Music/playlists/imagine-john-lennon.playlist', function(data){
                console.log('data is', data);
            })
        }
    }
}]);

vlcRadio.controller('RootController', ['$scope', '$location', '$state', 'playerInterface', 'commons', 'currentWeatherService', 'forecastWeatherService', 'cacheService', 'alarmService', 'timerService', function($scope, $location, $state, player, commons, weather, forecast, cache, alarms, timer){
    function isSelected(path){
        return $location.path() == path ? ' selected' : '';
    }
    function setSelected(idx){
        for (var i in $scope.buttons){
            $scope.buttons[i].selected = (i == idx ? ' selected' : '');
        }
    }
    function initInfo(){
        $scope.info = {
            playing: {
                now: '', 
                next: '',
            },
            position: {
                current: '--:--',
                total: '--:--',
            },
            weather: [],
            d: new Date(),
        }
    }
    function setInfoPlaying(oldStatus, newStatus){
        var state = commons.get(newStatus, 'state', '')
        $scope.isPlaying = state == 'playing' || state == 'paused';
        if ($scope.isPlaying){
            $scope.info.playing.now = commons.formatNowPlaying(newStatus);
            player.getPlaylist(function(items){
                for (var i in items){
                    i = i * 1;
                    if (items[i].playing && i < items.length - 1){
                        $scope.info.playing.next = items[i + 1].name;
                        break;
                    }
                }
            })
        }
    }
    timer.onTick(function(h, m, s){
        $scope.timer = {hours: h, minutes: m, seconds: s};
    })
    function setInfoWeather(forecast){
        $scope.isTimerSet = timer.isSet();
        if (forecast.data.list.length > 2){
            $scope.info.weather = [];
            for (var i = 0; i < ($scope.isTimerSet ? 2 : 3); i++){
                var obj = forecast.data.list[i];
                $scope.info.weather.push({
                    icon: weather.getIcon(obj, 0),
                    text: weather.formatTemp(obj.temp.max, 1)
                        + ' / ' + weather.formatTemp(obj.temp.min, 1),
                    description: obj.weather[0].description,
                })
            }
        }
    }
    function setInfoPosition(oldStatus, newStatus){
        var current = Math.round(newStatus.position * newStatus.length, 0);
        $scope.info.position = {
            current: commons.displayTime(current),
            total: commons.displayTime(newStatus.length * 1),
        }
    }
    function browse(which){
        $scope.$emit('browseForItem', {type: which, path: null}, onBrowserItemSelected);
    }
    function onBrowserItemSelected(item) {
        if (item.id){
            player.doCommand('playItem', {id: item.id});
        }
        else {
            player.doCommand('openUrl', {url: encodeURIComponent(item.path)});
        }
    }

    $scope.buttons = [
        {
            id: 'but-favourites', 
            text: 'Favourites', 
            selected: isSelected('/root/favourites'),
            click: function(){
                browse('favourites');
            },
        },
        {
            id: 'but-open',
            text: 'Open',
            selected: '',
            click: function(){
                commons.showDialog('#openChoose', function(answer){
                    if (answer != 'cancel'){
                        browse(answer);
                    }
                });
            }
        },
        {
            id: 'but-stop-all',
            text: 'Clear all', 
            click: function(){
                player.doCommand('clearAll');
            }
        },
        {
            id: 'but-playlist',
            text: 'Playlist',
            selected: '',
            click: function(){
                browse('playlist');
            }
        },
        {
            id: 'but-control-shuffle',
            text: 'Shuffle',
            selected: '',
            click: function(){
                player.shuffle(function(response){
                    if (response == "ok"){
                        commons.alert("Playlist shuffled");
                    }
                });
            }
        },
        {
            id: 'but-backend', 
            text: 'Backend', 
            click: function(){
                commons.showDialog('#backendsTpl', function(answer){
                    player._changeBackend(answer);
                })
            }
        },
        {
            id: 'but-alarms', 
            text: 'Alarms', 
            click: function(){
                $location.url('/alarms');
            }
        },
        {
            id: 'but-timer',
            text: 'Timer', 
            click: function(){
                $location.url('/timer');
            }
        },
        {
            id: 'but-history', 
            text: 'History', 
            click: function(){
                browse('history');
            }
        },
        {
            id: 'but-close', 
            text: 'Shut down', 
            click: function(){
                commons.showDialog('#shutdown', function(answer){
                    player.doCommand(answer);
                });
            }
        },
    ];
    $scope.controls = [
        {
            id: 'but-seek-back',
            selected: '',
            click: function(){
                player.doCommand('seek_back', {time: -commons.config().seek});
            }
        },
        {
            id: 'but-play', 
            selected: '',
            click: function(){
                player.doCommand($scope.controls[1].id == 'but-pause' ? 'pause' : 'play');
            }
        },
        {
            id: 'but-stop',
            selected: '',
            click: function(){
                player.doCommand('stop');
            }
        },
        {
            id: 'but-seek-forward',
            selected: '',
            click: function(){
                player.doCommand('seek_forward', {time: commons.config().seek});
            }
        },
        {
            id: 'but-loop', 
            selected: '',
            click: function(){
                player.doCommand('loop');
            }
        },
    ];

    initInfo();
    player.onStatusChanged('streamInfo:state', setInfoPlaying);
    player.onStatusChanged('position', setInfoPosition);
    player.getStatus(function(status){
        checkButtons(status);
        $scope.isPlaying = commons.get(status, 'state', '') == 'playing';
        setInfoPlaying(status, status);
    });
    function checkButtons(status){
        $scope.controls[1].id = 'but-' + (status.state == 'playing' ? 'pause' : 'play');
        $scope.controls[4].selected = status.loop ? ' selected' : '';
    }
    player.onStatusChanged('state:loop:shuffle', function(oldStatus, newStatus){
        checkButtons(newStatus);
    });
    forecast.onWeatherChanged(setInfoWeather);
}]);

var BrowserController = function($scope, $location, $timeout, commons, player, browser, cache){
    var stackIdx = 0;
    var stackInfo = {};
    $scope.currentLevel = 0;
    $scope.activate = false;
    $scope.showProgress = false;
    $scope.noItemsText = "There are no items to display here";
    $scope.selectItem = function(item, option){
        $scope.showProgress = true;
        browser.selectItem(item, option);
    }
    function finish(){
        stackIdx--;
        if (stackIdx == 0){
            $scope.activate = false;
        }
        else {
            activateBrowser({
                type: stackInfo[stackIdx].type,
                cancelCallback: stackInfo[stackIdx].cancelCallback,
            }, stackInfo[stackIdx].callback);
        }
    }
    $scope.backClick = function(){
        if (stackInfo[stackIdx].cancelCallback != null){
            stackInfo[stackIdx].cancelCallback();
        }
        finish();
    }
    function activateBrowser(args, _callback){
        $scope.currentLevel = stackIdx;
        $scope.items = [];
        stackInfo[stackIdx] = {
            type: args.type,
            cancelCallback: args.cancelCallback,
            callback: _callback,
        }
        commons.setImplementation(browser, args.type + 'Browser');
        $scope.activate = true;
        $scope.showProgress = true;
        if (typeof(args.path) != 'undefined'){
            browser.navigate(args.path);
        }
    }
    function setScroll(){
        $('.list-wrapper').scrollTop(0);
        if ($('.list-item.selected').length > 0){
            var offset = $('.list-item.selected').offset().top - $(window).scrollTop();
            $('.list-wrapper').animate({scrollTop: offset}, 300);
        }
    }
    function checkScroll(){
        if ($('.list-wrapper .list-items>div').length > 0){
            $timeout(function(){
                setScroll();
            }, 500);
            return ;
        }

        $timeout(function(){
            checkScroll();
        }, 100);
    }
    browser._onNavigateFinished(function(items){
        $scope.showProgress = false;
        if (typeof(stackInfo[stackIdx]) == 'undefined'){
            stackInfo[stackIdx] = {};
        }
        stackInfo[stackIdx].items = items;
        $scope.items = items;
        checkScroll();
    })
    browser._onMediaClicked(function(item){
        var callback = stackInfo[stackIdx].callback;
        finish();
        if (callback != null){
            callback(item);
        }
    });
    browser._onOptionFinished(function(msg){
        $scope.showProgress = false;
        commons.alert(msg);
    });
    $scope.$on('browserNeeded', function(event, args, _callback){
        stackIdx++;
        activateBrowser(args, _callback);
    });
}

vlcRadio.controller('BrowserController', ['$scope', '$location', '$timeout', 'commons', 'playerInterface', 'itemsBrowserInterface', 'cacheService', BrowserController]);

vlcRadio.controller('ScreensaverController', ['$scope', '$rootScope', 'currentWeatherService', 'dateTimeService', 'playerInterface', 'commons', 'timerService', function($scope, $rootScope, weather, dateTime, player, commons, timer){
    $scope.useScreensaver = commons.config().screensaver.use;
    var colors = commons.config().screensaver.colors;
    colors['key'] = null;

    $scope.isTimerSet = timer.isSet();

    timer.onTick(function(h, m, s){
        $scope.timer = {
            hours: h,
            minutes: m,
            seconds: s,
        }
    });

    function setColors(d){
        var key = '_' + (Math.floor(d.getMinutes() / 10) * 10);
        if (key != colors.key){
            colors.key = key;
            $scope.timeColor = colors[key].timeColor;
            $scope.dateColor = colors[key].dateColor;
            $scope.playingColor = colors[key].playingColor;
            // Some bug here, when comming back from 
            // another controler (which is not nested), 
            // although the scope is set, the view is not 
            // synchronized
            $('#time').css('color', colors[key].timeColor);
            $('#now_playing').css('color', colors[key].playingColor);
            $('#date').css('color', colors[key].dateColor);
        }
    }

    function setDate(d){
        $scope.date = d;
        setColors(d);
    }

    function setPlayerStatus(oldStatus, newStatus){
        if (newStatus.state != "stopped"){
            $scope.nowPlaying = commons.formatNowPlaying(newStatus);
        }
        else {
            $scope.nowPlaying = "";
        }
    }

    dateTime.onDateChanged(setDate);
    dateTime.onTimeChanged(setDate);
    player.onStatusChanged('streamInfo:state', setPlayerStatus);
    var d = new Date();
    setDate(d);
    setColors(d);
    delete d;
    player.getStatus(function(status){
        setPlayerStatus(status, status);
    })
    weather.onWeatherChanged(function(_weather){
        if (_weather != null){
            $scope.weatherIcon = weather.getIcon(_weather.data, _weather.iconIdx);
            $scope.weatherText = weather.formatTemp(_weather.data.main.temp);
        }
    })

    $scope.$on('idle', function(){
        $scope.activate = true;
    });
    $scope.$on('resume', function(){
        $scope.activate = false;
    });
    $scope.click = function(){
    }
}]);

vlcRadio.controller('KeyboardController', ['$scope', 'commons', 'keyboardHistoryService', function($scope, commons, history){
    $scope.showHistory = false;
    var type = 'text';
    var inputCategory = null;
    $scope.currentLevel = 0;
    $scope.keysHistory = [];
    $scope.input = '';
    $scope.callback = null;
    function finish(result){
        $scope.currentLevel--;
        $scope.activate = false;
        if (inputCategory != null && result != null){
            history.add(inputCategory, result);
        }
        if ($scope.callback != null){
            $scope.callback(result);
        }
        $scope.callback = result;
        $scope.input = '';
    }
    function setKeys(type){
        $scope.keys = [
            {id: 'key_1', text1: '1', text2: type == 'text' ? 'abc' : '', showDialog: false},
            {id: 'key_2', text1: '2', text2: type == 'text' ? 'def' : '', showDialog: false},
            {id: 'key_3', text1: '3', text2: type == 'text' ? 'ghi' : '', showDialog: false},
            {id: 'key_4', text1: '4', text2: type == 'text' ? 'jkl' : '', showDialog: false},
            {id: 'key_5', text1: '5', text2: type == 'text' ? 'mno' : '', showDialog: false},
            {id: 'key_6', text1: '6', text2: type == 'text' ? 'pqrs' : '', showDialog: false},
            {id: 'key_7', text1: '7', text2: type == 'text' ? 'tuv' : '', showDialog: false},
            {id: 'key_8', text1: '8', text2: type == 'text' ? 'wxyz' : '', showDialog: false},
            {id: 'key_9', text1: '9', text2: type == 'text' ? ' -' : '', showDialog: false},
            {id: 'key_backspace', text1: 'Backspace', text2: '', showDialog: false},
            {id: 'key_0', text1: '0', text2: '', showDialog: false},
            {id: 'key_accept', text1: 'Accept', text2: '', showDialog: false},
        ];
    }
    $scope.showHistoryBrowser = function() {
        $scope.$emit('browseForItem', {type: 'keyboardHistory', path: inputCategory}, function(item){
            $scope.selectHistory(item.path);
        });
    }
    $scope.backClick = function(){
        finish(null);
    };
    $scope.keyClicked = function(key){
        if (key.id == 'key_backspace'){
            if ($scope.input.length > 0) {
                $scope.input = $scope.input.slice(0, -1);
            }

            return ;
        }
        if (key.id == 'key_accept'){
            finish($scope.input);
            return ;
        }
        if (type == 'numerical' || key.id == 'key_0'){
            $scope.input += key.text1;
            return ;
        }

        key.showDialog = true;
    }
    $scope.chooseSymbol = function(key, ch){
        $scope.input += ch;
        for (var i in $scope.keys){
            $scope.keys[i].showDialog = false;
        }
    }
    $scope.selectHistory = function(input){
        $scope.input = input;
        $scope.showHistory = false;
        finish(input);
    }

    $scope.$on('keyboardNeeded', function(event, args, callback){
        if (!args.id){
            id = null;
        }
        $scope.currentLevel++;
        inputCategory = args.inputCategory;
        // if (inputCategory != null){
        //     var _history = history.get(inputCategory);
        //     $scope.keysHistory = [];
        //     _history.reverse().map(function(input){
        //         if ($scope.keysHistory.indexOf(input) == -1 && input != '' && input != null){
        //             $scope.keysHistory.push(input);
        //         }
        //     });
        // }
        $scope.prompt = args.prompt;
        type = args.type;
        setKeys(type);
        $scope.callback = callback;
        $scope.activate = true;
        $('#keyboardInput').focus();
    })
}])

vlcRadio.controller('AlarmsController', ['$scope', '$state', '$timeout', '$location', 'commons', function($scope, $state, $timeout, $location, commons){
    $scope.editAlarm = false;
    function alarmEdit(item){
        if (item.type == 'new'){
            var alarm = {
                title: null,
                date: new Date(),
                command: null,
                command_args: null,
                repeat: null,
            };
        }
        else {
            alarm = item.alarmData;
        }
        $state.go('alarm-edit', {
            alarm: alarm,
        });
    }
    if (!$scope.editAlarm){
        $timeout(function(){
            $scope.$emit('browseForItem', {type: 'alarms', path: null, cancelCallback: function(){
                $location.url('/root');
            }}, alarmEdit);
        }, 1);
    }
}]);

vlcRadio.controller('AlarmsEditController', ['$scope', '$location', '$timeout', '$stateParams', 'alarmService', 'commons', function($scope, $location, $timeout, $stateParams, alarms, commons){
    $scope.editAlarm = true;
    if (!$stateParams.alarm){
        $location.url('/alarms');
        return ;
    }
    $scope.alarm = $stateParams.alarm;
    if (typeof($scope.alarm.date) == 'string'){
        $scope.alarm.date = new Date($scope.alarm.date);
    }
    function changeTitle(title){
        $scope.alarm.title = title;
    }
    $timeout(function(){
        if ($scope.alarm.title == null){
            $scope.$emit('needKeyboard', {prompt: 'Choose an alarm title', type: 'text', inputCategory: 'Alarm'}, function(result){
                if (result == null){
                    $location.url('/alarms');
                }
                else {
                    changeTitle(result);
                }
            });
        }
    }, 0);
    $scope.editHour = function(date){
        $scope.$emit('needKeyboard', {prompt: 'Please select the hour (0 - 23)', type: 'numerical'}, function(hour){
            if (hour != null){
                date.setHours(hour);
            }
        });
    }
    $scope.editMinutes = function(date){
        $scope.$emit('needKeyboard', {prompt: 'Please select the minutes (0 - 59)', type: 'numerical'}, function(minutes){
            if (minutes != null){
                date.setMinutes(minutes);
            }
        });
    }
    $scope.selectSource = function(){
        commons.showDialog('#openChoose', function(answer){
            if (answer != 'cancel'){
                $scope.$emit('browseForItem', {type: answer, path: null}, function(item){
                    $scope.alarm.command_args = {url: encodeURIComponent(item.path)};
                });
            }
        });
    }
    $scope.save = function(){
        if($scope.alarm.command == null){
            commons.alert('You have to choose a command');
            return ;
        }
        if ($scope.alarm.command == 'openUrl' && ($scope.alarm.command_args == null || $scope.alarm.command_args == '')){
            commons.alert('You have to choose an url to open');
            return ;
        }
        $scope.alarm.date.setSeconds(0);
        if (!$scope.alarm.id){
            alarms.add($scope.alarm.title, $scope.alarm.date, $scope.alarm.repeat, $scope.alarm.command, $scope.alarm.command_args);
        }
        else {
            alarms.update($scope.alarm);
        }
        $location.url('/alarms');
    }
    $scope.cancel = function() {
        $location.url('/alarms');
    }
}]);

vlcRadio.controller('TimerController', ['$scope', '$timeout', '$location', 'commons', 'timerService', function($scope, $timeout, $location, commons, timer){
    var audio = $('#alarmAudio')[0];
    $scope.isTimerPaused = timer.isPaused();
    $scope.isAlarmOn = timer.isAlarm();
    $scope.isTimerSet = timer.isSet();
    function initTimer(){
        if (timer.isSet()){
            var hms = timer.get();
            $scope.timer = {
                hours: hms.hours,
                minutes: hms.minutes,
                seconds: hms.seconds,
            }
        }
        else {
            $scope.timer = {
                hours: 0,
                minutes: 20,
                seconds: 0,
            }
        }
    }
    timer.onBoom(function(){
        audio.src = commons.config().alarmUrl;
        audio.play();
        $location.url('/timer');
        $scope.isAlarmOn = true;
    });
    timer.onTick(function(h, m, s){
        $scope.timer.hours = h;
        $scope.timer.minutes = m;
        $scope.timer.seconds = s;
    })
    $scope.editField = function(property){
        $scope.$emit('needKeyboard', {prompt: 'Please input ' + property, type: 'numerical'}, function(input){
            if (input != null){
                $scope.timer[property] = input;
            }
        });
    }
    $scope.backClick = function(){
        $location.url('/root');
    }
    $scope.start = function(){
        if ($scope.timer.hours == 0 && $scope.timer.minutes == 0 && $scope.timer.seconds == 0){
            commons.alert('You have to select a time amount');
            return ;
        }

        timer.set($scope.timer.hours * 1, $scope.timer.minutes * 1, $scope.timer.seconds * 1);
        $scope.isTimerSet = true;
    }
    $scope.stop = function(){
        timer.stop();
        $scope.isTimerSet = false;
        $scope.isTimerPaused = false;
        $scope.isAlarmOn = false;
        audio.src = '';
        audio.pause();
        initTimer();
    }
    $scope.pause = function(){
        timer.pause();
        $scope.isTimerPaused = true;
    }
    $scope.resume = function(){
        timer.resume();
        $scope.isTimerPaused = false;
    }

    initTimer();
}]);
