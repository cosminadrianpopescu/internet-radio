var vlcRadio = angular.module('vlcRadio', ['ngMaterial', 'ui.router', 'ui.router.css'])
.constant('config', settingsTmp);

vlcRadio.config(function($stateProvider, $urlRouterProvider, $httpProvider){
    $urlRouterProvider.otherwise('/root');

    $stateProvider.state('root', {
        url: '/root',
        templateUrl: 'app/html/root.html',
        css: 'app/css/root.css',
        controller: 'RootController'
    })
    .state('test', {
        url: '/test',
        css: 'app/css/root.css',
        templateUrl: 'app/html/test.html',
        controller: 'TestController'
    })
    .state('alarms', {
        url: '/alarms', 
        css: 'app/css/alarms.css',
        templateUrl: 'app/html/alarms.html',
        controller: 'AlarmsController',
    })
    .state('alarm-edit', {
        url: '/alarm-edit', 
        css: 'app/css/alarms.css',
        params: {
            alarm: null,
        },
        templateUrl: 'app/html/alarms.html',
        controller: 'AlarmsEditController',
    })
    .state('timer', {
        url: '/timer', 
        css: 'app/css/timer.css',
        templateUrl: 'app/html/timer.html',
        controller: 'TimerController',
    });
});

vlcRadio.filter('radiotime', function(){
    return function(input){
        return ("00" + input).slice(-2);
    }
})

vlcRadio.run(function($rootScope, $timeout, $injector, commons, playerInterface){
    commons.setImplementation(playerInterface, commons.config().playerImplementation);
    var history = $injector.get('historyService');
    $rootScope.idleTimer = null;
    $rootScope.isIdle = false;

    $rootScope.startIdle = function(){
        if ($rootScope.idleTimer != null){
            $timeout.cancel($rootScope.idleTimer);
        }
        $rootScope.idleTimer = $timeout(function(){
            $rootScope.isIdle = true;
            $rootScope.$broadcast('idle');
            $rootScope.idleTimer = null;
        }, commons.config().idleInterval * 1000);
    }

    $rootScope.$on('click', function(){
        if ($rootScope.isIdle){
            $rootScope.isIdle = false;
            $rootScope.$broadcast('resume');
        }
        $rootScope.startIdle();
    });

    $rootScope.$on('needKeyboard', function(event, args, callback){
        if (!callback){
            callback = null;
        }
        $rootScope.$broadcast('keyboardNeeded', args, callback);
    });

    function processBrowserEvents(event, args, callback){
        if (!callback){
            return;
        }
        if (!args.cancelCallback){
            args.cancelCallback = null;
        }
        $rootScope.$broadcast(event, args, callback);
    }

    $rootScope.$on('browseForItem', function(event, args, callback){
        processBrowserEvents('browserNeeded', args, callback);
    });

    $rootScope.startIdle();
})
