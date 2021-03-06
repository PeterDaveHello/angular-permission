(function () {
  'use strict';

  angular
    .module('permission')
    .factory('PermissionMap', function ($q, $state) {

      /**
       * Constructs map object instructing authorization service how to handle authorizing
       *
       * @param permissionMap {Object} Map of permissions provided to authorization service
       * @param permissionMap.only {Array} List of exclusive permission/role names allowed for authorization
       * @param permissionMap.except {Array} List of exclusive permission/role names denied for authorization
       * @param permissionMap.redirectTo {String|Function|Object|promise} Handling redirection when rejected
       *   authorization
       * @param [toState] {Object} UI-Router transition state object
       * @param [toParams] {Object} UI-Router transition state params
       * @param [options] {Object} UI-Router transition state options
       * @constructor
       */
      function PermissionMap(permissionMap, toState, toParams, options) {
        this.only = resolvePermissionMapProperty(permissionMap.only, toState, toParams, options);
        this.except = resolvePermissionMapProperty(permissionMap.except, toState, toParams, options);
        this.redirectTo = permissionMap.redirectTo;
      }

      /**
       * Extends permission map by pushing to it state's permissions
       *
       * @param permissionMap {PermissionMap} Compensated permission map
       */
      PermissionMap.prototype.extendPermissionMap = function (permissionMap) {
        this.only = this.only.concat(permissionMap.only);
        this.except = this.except.concat(permissionMap.except);
      };


      /**
       * Redirects to fallback states when permissions fail
       *
       * @param rejectedPermissionName {String} Permission name
       */
      PermissionMap.prototype.redirectToState = function (rejectedPermissionName) {
        if (angular.isFunction(this.redirectTo)) {
          handleFunctionRedirect(this.redirectTo, rejectedPermissionName);
        }

        if (angular.isObject(this.redirectTo)) {
          handleObjectRedirect(this.redirectTo, rejectedPermissionName);
        }

        if (angular.isString(this.redirectTo)) {
          handleStringRedirect(this.redirectTo, this.toParams, this.options);
        }
      };

      /**
       * Handles function based redirection for rejected permissions
       *
       * @param redirectFunction {Function} Redirection function
       * @param permission {String} Rejected permission
       */
      function handleFunctionRedirect(redirectFunction, permission) {
        $q.when(redirectFunction.call(null, permission))
          .then(function (redirectState) {
            if (!angular.isString(redirectState)) {
              throw new TypeError('When used "redirectTo" as function, returned value must be string with state name');
            }
            handleStringRedirect(redirectState);
          });
      }

      /**
       * Handles object based redirection for rejected permissions
       *
       * @param redirectObject {Object} Redirection function
       * @param permission {String} Rejected permission
       */
      function handleObjectRedirect(redirectObject, permission) {
        if (!angular.isDefined(redirectObject['default'])) {
          throw new ReferenceError('When used "redirectTo" as object, property "default" must be defined');
        }

        var redirectState = redirectObject[permission];

        if (!angular.isDefined(redirectState)) {
          redirectState = redirectObject['default'];
        }

        if (angular.isFunction(redirectState)) {
          handleFunctionRedirect(redirectState, permission);
        }

        if (angular.isString(redirectState)) {
          handleStringRedirect(redirectState);
        }
      }

      /**
       * Handles string based redirection for rejected permissions
       */
      function handleStringRedirect(state, toParams, options) {
        $state.go(state, toParams, options);
      }

      /**
       * Handles extraction of permission map "only" and "except" properties
       * @private
       *
       * @param property {Array|Function|promise} Permission map property "only" or "except"
       * @param [toState] {Object} UI-Router transition state object
       * @param [toParams] {Object} UI-Router transition state params
       * @param [options] {Object} UI-Router transition state options
       * @returns {Array} Array of permission "only" or "except" names
       */
      function resolvePermissionMapProperty(property, toState, toParams, options) {
        if (angular.isString(property)) {
          return [property];
        }

        if (angular.isArray(property)) {
          return property;
        }

        if (angular.isFunction(property)) {
          return property.call(null, toState, toParams, options);
        }

        return [];
      }

      return PermissionMap;
    });
}());