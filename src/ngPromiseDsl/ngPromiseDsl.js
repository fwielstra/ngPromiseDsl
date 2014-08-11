angular.module('ngPromiseDsl', [])
  .config(function ($provide) {
    'use strict';

    $provide.decorator('$q', function ($delegate, $location) {

      function decoratePromise(promise) {
        promise._then = promise.then;

        promise.then = function (thenFn, errFn, notifyFn) {
          return decoratePromise(promise._then(thenFn, errFn, notifyFn));
        };

        /**
         * Sets the value returned by the promise or the specified `constant` onto the `obj` under
         * the given `varName` when the promise resolves.
         */
        promise.thenSet = function (obj, varName, constant) {
          return promise.then(function (value) {
            obj[varName] = constant !== undefined ? constant : value;
            return value;
          });
        };

        /**
         * For an object passed to a promise resolver by $q.all, sets all of those keys onto the
         * given object. Useful to set a number of promise results onto the scope in one go.
         */
        promise.thenSetAll = function (obj) {
          return promise.then(function(values) {
            for (var prop in values) {
              obj[prop] = values[prop];
            }
            return values;
          });
        };

        /**
         * Alias for `.catch()`, safe to use in ES3 / IE 8
         */
        promise.except = function (errFn) {
          return promise.then(null, errFn);
        };

        /**
         * Like .thenSet(), only when something goes wrong.
         */
        promise.exceptSet = function (obj, varName, constant) {
          return promise.except(function (value) {
            obj[varName] = constant !== undefined ? constant : value;
            return value;
          });
        };

        /**
         * Returns the given `varName` property value of the promise's result.
         * This is mainly useful for passing it to the next step in the promise chain.
         */
        promise.thenTake = function (varName) {
          return promise.then(function (value) {
            return value[varName];
          });
        };

        /**
         * Returns the given valueSuccess or valueFailure property as the
         * promise resolves or rejects.
         */
        promise.thenReturn = function (valueSuccess, valueFailure) {
          function constant(value) {
            return function () {
              return value;
            };
          }

          return promise.then(constant(valueSuccess), constant(valueFailure));
        };

        /**
         * Returns a function that, when the promise resolves, executes the given function, passing
         * the promise result as argument.
         * TODO: partially apply callback with extra arguments
         */
        promise.thenExec = function (fn) {
          return promise.then(function () {
            fn.apply(this, arguments);
            return arguments[0];
          });
        };

        /**
         * Calls the method named by the first argument on the object returned by the promise with the given arguments.
         * Useful for Restangular-returned promises, for chaining calls.
         */
        promise.thenApply = function () {
          var args = Array.prototype.slice.call(arguments, 0);
          return promise.then(function (object) {
            return object[args.shift()].apply(null, args);
          });
        };

        /**
         * Redirects the user to the given path using the `$location` service.
         * Has an optional `replace` boolean argument, which will call `$location.replace()` if true.
         */
        promise.thenRedirectTo = function redirectTo(path, replace) {
          return promise.then(function (value) {
            $location.path(path);
            if (replace) {
              $location.replace();
            }
            return value;
          });
        };

        return promise;
      }

      var defer = $delegate.defer,
        when = $delegate.when,
        reject = $delegate.reject,
        all = $delegate.all;

      $delegate.defer = function () {
        var deferred = defer();
        decoratePromise(deferred.promise);
        return deferred;
      };

      $delegate.when = function () {
        return decoratePromise(when.apply(this, arguments));
      };

      $delegate.reject = function () {
        return decoratePromise(reject.apply(this, arguments));
      };

      $delegate.all = function () {
        return decoratePromise(all.apply(this, arguments));
      };

      return $delegate;
    });

  });
