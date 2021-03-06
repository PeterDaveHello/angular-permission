(function () {
  'use strict';

  /**
   * Show/hide elements based on provided permissions
   *
   * @example
   * <div permission only="'USER'"></div>
   * <div permission only="['USER','ADMIN']" except="'MANAGER'"></div>
   * <div permission except="'MANAGER'"></div>
   */
  angular
    .module('permission')
    .directive('permission', function ($log, Authorization, PermissionMap) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          try {
            Authorization
              .authorize(new PermissionMap({
                only: scope.$eval(attrs.only),
                except: scope.$eval(attrs.except)
              }), null)
              .then(function () {
                element.removeClass('ng-hide');
              })
              .catch(function () {
                element.addClass('ng-hide');
              });
          } catch (e) {
            element.addClass('ng-hide');
            $log.error(e.message);
          }
        }
      };
    });
}());
