var app = angular.module('letitride', ['ui.router']);


//MAIN CONTROLLER 
app.controller('MainCtrl', ['$scope', '$stateParams', 'auth', function ($scope, $stateParams, auth) {
    $scope.isLoggedIn = auth.isLoggedIn;
}]);

//RIDE CONTROLLER
app.controller('RideCtrl', ['$scope', '$stateParams', 'auth', function ($scope, $stateParams, auth) {
    $scope.isLoggedIn = auth.isLoggedIn;
    initMap();
}]);

//AUTHENTICATION CONTROLLER
app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function ($scope, $state, auth) {
        $scope.user = {};

        $scope.register = function () {
            auth.register($scope.user).error(function (error) {
                $scope.error = error;
            }).then(function () {
                $state.go('home');
            });
        };

        $scope.logIn = function () {
            auth.logIn($scope.user).error(function (error) {
                $scope.error = error;
            }).then(function () {
                $state.go('home');
            });
        };
    }]);

//NAVIGATION CONTROLLER
app.controller('NavCtrl', [
    '$scope',
    'auth',
    function ($scope, auth) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
    }]);

//AUTHENTICATION FACTORY
app.factory('auth', ['$http', '$window', function ($http, $window) {
    var auth = {};

    auth.logIn = function (user) {
        return $http.post('/login', user).success(function (data) {
            auth.saveToken(data.token);
        });
    };

    auth.logOut = function () {
        $window.localStorage.removeItem('letitride-token');
    };

    auth.register = function (user) {
        return $http.post('/register', user).success(function (data) {
            auth.saveToken(data.token);
        });
    };

    auth.currentUser = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        }
    };

    auth.isLoggedIn = function () {
        var token = auth.getToken();

        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };

    auth.saveToken = function (token) {
        $window.localStorage['letitride-token'] = token;
    };

    auth.getToken = function () {
        return $window.localStorage['letitride-token'];
    }

    return auth;
}]);

//STATES
app.config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'MainCtrl'
            })
            .state('contact', {
                url: '/contact',
                templateUrl: '/contact.html',
                controller: 'MainCtrl'
            })
            .state('about', {
                url: '/about',
                templateUrl: '/about.html',
                controller: 'MainCtrl'
            })
            .state('ride', {
                url: '/ride',
                templateUrl: '/ride.html',
                controller: 'RideCtrl'
            })
            .state('login', {
                url: '/login',
                templateUrl: '/login.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('ride');
                    }
                }]
            })
            .state('register', {
                url: '/register',
                templateUrl: '/register.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            });
        $urlRouterProvider.otherwise('home');
    }]);

function initMap() {
    var directionsDisplay = new google.maps.DirectionsRenderer;
    var directionsService = new google.maps.DirectionsService;

    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 36.778259, lng: -119.417931}, //CA coordinates
        zoom: 15
    });

    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('top-panel'));

    var control = document.getElementById('floating-panel');
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(control);


    //Geolocation stuff
    var pos;
    var infoWindow = new google.maps.InfoWindow({map: map});
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            map.setCenter(pos);

        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        handleLocationError(false, infoWindow, map.getCenter());
    }

    //add traffic to map
    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    //event added to button to get directions to a fixed place
    var directionsButtonClick = function(){
        calculateAndDisplayRoute(directionsService, directionsDisplay, pos);
    };

    document.getElementById('click').addEventListener('click', directionsButtonClick);

    function calculateAndDisplayRoute(directionsService, directionsDisplay, pos) {
        directionsService.route({
            origin: pos,
            destination: {lat: 37.3352, lng: -121.8811},
            travelMode: google.maps.TravelMode.DRIVING
        }, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }

    //Search Function stuff. Not sure how to update the pos so that when you search a location and get directions, it changes
    var searchBox = new google.maps.places.SearchBox(document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('pac-input'));
    google.maps.event.addListener(searchBox, 'places_changed', function() {
        searchBox.set('map', null);

        var places = searchBox.getPlaces();

        var bounds = new google.maps.LatLngBounds();

        var i, place;
        for (i = 0; place = places[i]; i++) {
            (function(place) {
                var marker = new google.maps.Marker({

                    position: place.geometry.location
                });
                marker.bindTo('map', searchBox, 'map');
                google.maps.event.addListener(marker, 'map_changed', function() {
                    if (!this.getMap()) {
                        this.unbindAll();
                    }
                });
                bounds.extend(place.geometry.location);


            }(place));

        }
        map.fitBounds(bounds);
        searchBox.set('map', map);
        map.setZoom(Math.min(map.getZoom(),12));

    });
}


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}
