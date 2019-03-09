var eventApp = angular.module('eventApp', [
    'ngRoute',
    'eventControllers',
    'ngMaterial',
    'angular-svg-round-progressbar'
]);
eventApp.constant("moment", moment);

eventApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'js/component/search.html',
      controller: 'searchController'
    });
}]);
