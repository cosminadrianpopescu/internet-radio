vlcRadio.directive('onLongPress', function($timeout) { return {
        restrict: 'A',
        link: function($scope, $elm, $attrs) {
            $elm.mousedown(function(ev){
                // Locally scoped variable that will keep track of the long press
                $scope.longPress = false;

                // We'll set a timeout for 600 ms for a long press
                $timeout(function() {
                    $scope.longPress = true;
                }, 600);
            });

            $elm.mouseup(function(ev){
                var pos = $elm.data('swipePos');
                if (pos != null){
                    // If we have a swipePos and a delta in any direction
                    // bigger then 15, then this was a swipe, not a long press
                    if (Math.abs(pos.x - ev.pageX) >= 15 || Math.abs(pos.y - ev.pageY) > 15){
                        return;
                    }
                }
                if ($scope.longPress) {
                    $scope.$apply(function() {
                        $scope.$eval($attrs.onLongPress)
                    });
                    $elm.data('preventClick', true);
                }
                $scope.longPress = false;
            });
        }
    };
});

vlcRadio.directive('screensaver', function(){
    return {
        restrict: 'E',
        scope: {
            activate: '=?activate'
        },
        templateUrl: 'app/html/screensaver.html',
        controller: 'ScreensaverController',
    }
});

vlcRadio.directive('keyboard', function(){
    return {
        restrict: 'E',
        scope: {
            activate: '=?activate',
            type: '=type',
            prompt: '=?prompt',
        },
        templateUrl: 'app/html/keyboard.html',
        controller: 'KeyboardController',
    }
});

vlcRadio.directive('itemBrowser', function(){
    return {
        restrict: 'E',
        scope: {
            activate: '=?activate',
            isKeyboardBrowser: '=?isKeyboardBrowser',
        },
        templateUrl: 'app/html/playlist.html',
        controller: 'BrowserController',
    }
});

vlcRadio.directive('keyboardBrowser', function(){
    return {
        restrict: 'E', 
        scope: {
            activate: '=?activate',
            isKeyboardBrowser: '=?isKeyboardBrowser',
        },
        templateUrl: 'app/html/playlist.html',
        controller: 'KeyboardBrowserController',
    }
})

vlcRadio.directive('swipe', function() {
    return {
        restrict: 'A',
        link: function($scope, $elm, $attrs) {
            $elm.mousedown(function(ev){
                var pos = {x: ev.pageX, y:ev.pageY};
                $elm.data('swipePos', pos);
            })
            .mouseup(function(ev){
                $scope.$emit('click');
                var pos = {x: ev.pageX, y:ev.pageY}
                var swipePos = $elm.data('swipePos');
                var which = $attrs.swipe == 'X' ? 'scrollLeft' : 'scrollTop';
                var deltaMouse = which == 'scrollTop' ? pos.y - swipePos.y : pos.x - swipePos.x;
                if (Math.abs(deltaMouse) >= 100){
                    var delta = which == 'scrollTop' ? $(window).height() : $(window).width();
                    delta -= 10;
                    if (deltaMouse < 0){
                        delta = -delta;
                    }
                    // $elm.data('preventClick', true);
                    var animate;
                    var sAnimate = 'animate = {' + which + ': ' + ($elm[which]() - delta) + '}'
                    eval(sAnimate);
                    $elm.animate(animate, '300');
                    // $elm[which]($elm[which]() - delta);
                }
                ev.preventDefault();
                return false;
            })
        }
    };
});

vlcRadio.directive('scroll', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            direction: '=direction',
            selector: '=selector',
            displayPosition: '=?displayPosition',
        },
        link: function($scope, $elm, $attrs){
            var scrolledElement = $($scope.selector);
            var el1 = $elm.children().first();
            var el2 = $elm.children().first().next();
            var last_scroll = null;
            function isVisible(dir){
                return true;
                var which = $scope.direction == 'vertical' ? 'scrollTop' : 'scrollLeft';
                if (dir == 1){
                    return scrolledElement[which]() > 0;
                }
                if (dir == 2){
                    var max = scrolledElement.children().first()[which == 'scrollTop' ? 'height' : 'width']();
                    var win = $(window)[which == 'scrollTop' ? 'height' : 'width']();
                    var pos = scrolledElement[which]();
                    return max - pos > win;
                }

                return false;
            }
            function showElements(){
                el1[isVisible(1) ? 'show' : 'hide']();
                el2[isVisible(2) ? 'show' : 'hide']();
            }
            if (!$scope.displayPosition){
                $scope.displayPosition = 'center';
            }
            scrolledElement.scroll(function(ev){
                showElements();
            });
            scrolledElement.attrchange({
                callback: function(e){
                    showElements();
                }
            })
            if ($scope.direction == "vertical"){
                $scope.dir1 = "up";
                $scope.dir2 = "down";
                var top = scrolledElement.position().top;
                var bottom = scrolledElement.position().top + scrolledElement.height();
                var left;
                if ($scope.displayPosition == 'center'){
                    left = scrolledElement.position().left + scrolledElement.width() / 2 - el1.width() / 2;
                }
                else if ($scope.displayPosition == 'left'){
                    left = scrolledElement.position().left;
                }
                else if ($scope.displayPosition == 'right'){
                    left = scrolledElement.position().left + scrolledElement.width() - el1.width();
                }
                el1.css('top', top + 5).css('left', left);
                el2.css('top', bottom - el2.height() - 5).css('left', left);
            }
            else {
                $scope.dir1 = "left";
                $scope.dir2 = "right";
                var top = scrolledElement.position().top + scrolledElement.height() / 2 - el1.height() / 2;
                if (top >= $(window).height()){
                    top -= $(window).height();
                }
                var right = scrolledElement.position().left + scrolledElement.width() - el2.width();
                var left = scrolledElement.position().left;
                el1.css('top', top).css('left', left);
                el2.css('top', top).css('left', right);
            }
            $scope.scroll = function(dir){
                var d = new Date();
                if (last_scroll != null && last_scroll.dir == dir && d - last_scroll.time <= 500){
                    delete d;
                    $scope.onLongPress(dir);
                    return ;
                }
                var which = $scope.direction == 'vertical' ? 'scrollTop' : 'scrollLeft';
                var delta = which == 'scrollTop' ? $(window).height() : $(window).width();
                delta -= 10;
                if (dir == 2){
                    delta = -delta;
                }
                var animate;
                var sAnimate = 'animate = {' + which + ': ' + (scrolledElement[which]() - delta) + '}'
                eval(sAnimate);
                scrolledElement.animate(animate, '300');
                // $elm[which]($elm[which]() - delta);
                last_scroll = {
                    dir: dir,
                    time: d,
                }
                return false;
            }
            $scope.onLongPress = function(dir){
                var which = $scope.direction == 'vertical' ? 'scrollTop' : 'scrollLeft';
                var max = scrolledElement.children().first()[which == 'scrollTop' ? 'height' : 'width']();
                sAnimate = 'animate = {' + which + ': ' + (dir == 2 ? max : 0) + '}';
                eval(sAnimate);
                scrolledElement.animate(animate, '300');
            }
        },
        templateUrl: 'app/html/scroll.html',
    };
});

vlcRadio.directive('rClick', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, $elm, $attrs) {
            function checkPreventClick($elm){
                var result = false;
                $elm.parents().each(function(){
                    if ($(this).data('preventClick')){
                        $(this).data('preventClick', null);
                        result = true;
                        return false;
                    }
                    if ($(this).attr('r-click') != null){
                        $(this).data('preventClick', true);
                    }
                });

                if ($elm.data('preventClick')){
                    $elm.data('preventClick', null);
                    return true;
                }

                return result;
            }
            $elm.click(function(ev){
                $scope.$emit('click');
                if (!checkPreventClick($elm)){
                    // Wait for double click
                    if ($elm.data('doubleClick')){
                        $elm.data('doubleClick', null);
                    }
                    else {
                        $scope.$apply(function() {
                            $scope.$eval($attrs.rClick)
                        });
                    }
                }
                $elm.data('preventClick', null);
            });
        }
    };
});

vlcRadio.directive('rDoubleClick', function($timeout){
    return {
        restrict: 'A', 
        link: function($scope, $elm, $attrs){
            $scope.clickTimer = null;
            $elm.click(function(ev){
                console.log('timer is', $scope.clickTimer);
                if ($scope.clickTimer == null){
                    $scope.clickTimer = $timeout(function(){
                        console.log('reset timer');
                        $scope.clickTimer = null;
                    }, 800);

                    console.log('timer is', $scope.clickTimer);
                }
                else {
                    console.log('timer ok');
                    $elm.data('doubleClick', true);
                    $scope.$apply(function() {
                        $scope.$eval($attrs.rDoubleClick)
                    });
                }
            })
        }
    }
})
