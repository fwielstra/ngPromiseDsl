/**
 * Angular Promise DSL
 *
 * Extends Angular's $q's promise objects with several commonly used operations on promises, such as
 * setting values on an object, getting properties, executing a (partially applied) method,
 * redirecting, etc.
 */
angular.module('ngPromiseDsl', [])
  .config(function ($provide) {

    // http://stackoverflow.com/questions/16797209/how-can-i-extend-q-promise-in-angularjs-with-a-succes-and-error
    // http://dorp.io/blog/extending-q-promises.html
    $provide.decorator('$q', function ($delegate, $location) {
      // Extend promises with non-returning handlers
      function decoratePromise(promise) {
        promise._then = promise.then;

        promise.then = function (thenFn, errFn, notifyFn) {
          return decoratePromise(promise._then(thenFn, errFn, notifyFn));
        };

        // Internet Explorer 8 save alias for .catch
        // As IE8 considers that property a reserved keyword.
        promise.except = function (errFn) {
          return promise.then(null, errFn);
        };

        // Internet Explorer 8 save alias for .finally
        // As IE8 considers that property a reserved keyword.
        promise.always = function (cb) {
          return promise['finally'](cb);
        };

        /**
         * @ngdoc method
         * @name promise#reject
         * @function
         *
         * @description
         * Returns a function that, when the promise resolves, sets the value returned by the promise, or specified `constant`
         * onto the `obj` under the given `varName`.
         *
         * ```js
         *   promise.thenSet($scope, 'value'); // $scope.value = promise result
         * ```
         *
         * This is equivalent to the following:
         *
         * ```js
         *   promise
         *     .then(function (value) {
         *       $scope.value = value;
         *       return value;
         *     });
         * ```
         *
         * In case a constant is specified:
         *
         * ```js
         *   promise.thenSet($scope, 'value', 'constant'); // $scope.value = 'constant'
         * ```
         *
         * @param {Object} obj The object on which a key should be assigned to
         * @param {String} varName The name of the variable to assign the value to
         * @param {Object} constant Optional constant to set obj.varName to, rather than the promise result
         * @returns {Promise} A promise that resolves to the same value as the original promise
         * resolved to.
         */
        function set(obj, varName, constant) {
          return function (value) {
            var schema = obj;  // a moving reference to internal objects within obj
            var varNameParts = varName.split('.');
            var lastPart = varNameParts.pop();
            _.each(varNameParts, function (varNamePart) {
              if (!schema[varNamePart]) {
                schema[varNamePart] = {};
              }
              schema = schema[varNamePart];

            });
            schema[lastPart] = constant !== undefined ? constant : value;

            return value;
          };
        }

        promise.thenSet = function () {
          return promise.then(set.apply(this, arguments));
        };

        promise.exceptSet = function () {
          return promise.except(set.apply(this, arguments));
        };

        promise.alwaysSet = function () {
          return promise.always(set.apply(this, arguments));
        };

        /**
         * @ngdoc method
         * @name promise#setResult
         * @function
         *
         * @description
         * Returns a function that, when the promise resolves, sets `obj`[`varname`] = `cb`(result)
         * where result is the returnvalue of the promise.
         *
         * ```js
         *   promise.thenSetResult($scope, 'value', _.partial(Math.max, 5)); // $scope.value = Math.max(5, promise result)
         * ```
         *
         * This is equivalent to the following:
         *
         * ```js
         *   promise
         *     .then(function (value) {
         *       $scope.value = Math.max(5, value);
         *       return value;
         *     });
         * ```
         *
         * @param {Object} obj The object on which a key should be assigned to
         * @param {String} varName The name of the variable to assign the value to
         * @param {Function} cb The function to be invoked with the promise result as argument
         * @returns {Promise} A promise that resolves to the same value as the original promise
         * resolved to.
         */
        function setResult(obj, varName, cb) {
          return function (value) {
            obj[varName] = cb.apply(this, arguments);
            return value;
          };
        }

        promise.thenSetResult = function () {
          return promise.then(setResult.apply(this, arguments));
        };

        promise.exceptSetResult = function () {
          return promise.except(setResult.apply(this, arguments));
        };

        promise.alwaysSetResult = function () {
          return promise.always(setResult.apply(this, arguments));
        };

        /**
         * @ngdoc method
         * @name promise#reject
         * @function
         *
         * @description
         * Returns a promise that, when the promise resolves, extends the given obj with the return value
         * of the previous promise
         *
         * @param {Object} obj The object to extend with the result of the resolved promise
         * @returns {Promise} a promise that resolve to the original promise resolved to
         */
        promise.thenSetAll = function (obj) {
          return promise.then(function (values) {
            _.extend(obj, values);
            return values;
          });
        };

        // takes a, possibly nested, property from the value the promise resolves with.
        // can be called with a string 'property', 'nested.property', or an array ['nested', 'property']
        // will return null if any property cannot be found.
        // If you want to select an element from an array, just pass the index as string or wrapped in array,
        // e.g. .thenTake('0') or .thenTake([0])
        promise.thenTake = function (keys) {
          return promise.then(function (value) {
            function take(object, key) {
              return object ? object[key] : null;
            }
            return _.reduce(_.isString(keys) ? keys.split('.') : keys, take, value);
          });
        };

        /**
         * @ngdoc method
         * @name promise#thenReturn
         * @function
         *
         * @description
         * Returns a function that returns the given valueSuccess or valueFailure property as the promise resolves or rejects.
         * example:
         *
         * ```js
         *   promise
         .thenReturn(true, false)
         .thenSet($scope, 'result');
         *   // result: $scope.result === true if the promise was resolved, $scope.result === false when rejected
         * ```
         *
         * @param {Object} valueSuccess The value returned by the then function if the promise is resolved
         * @param {Object} valueFailure The value returned by the then function if the promise is rejected
         * @returns {Promise} A promise that resolves one of the given values
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
         * @ngdoc method
         * @name promise#thenExec
         * @function
         *
         * @description
         * Returns a function that, when the promise resolves, executes the given (partially applied)
         * function, passing the promise result as argument. This is particularly useful if one of
         * the params of the method that need to be called is already known.
         *
         * ```js
         *   function doStuff(someValue, someOtherValue) {
         *     console.log(someValue, someOtherValue);
         *   }
         *
         *   promise.thenExec(doStuff, 'fixed value') // will put 'fixed value' and the promise's resolved value in the console once the promise resolves.
         * ```
         *
         * This is equivalent to the following:
         *
         * ```js
         *   function applyPartial(someValue) {
         *      return function (someOtherValue) {
         *        doStuff(someValue, someOtherValue);
         *        return someOtherValue;
         *      };
         *   }
         *   promise
         *     .then(applyPartial('fixed value'));
         * ```
         *
         * @param {Function} fn The function that should be executed fully once the promise resolves
         * @returns {Promise} A promise that resolves to the original promise result value.
         */
        promise.thenExec = function (fn) {
          // partially apply all optional arguments
          _.each(arguments, function (arg, i) {
            if (i) {
              fn = _.partial(fn, arg);
            }
          });

          return promise.then(function () {
            fn.apply(this, arguments);
            return arguments[0];
          });
        };

        promise.thenApply = function () {
          var args = Array.prototype.slice.call(arguments, 0);
          return promise.then(function (object) {
            return object[args.shift()].apply(null, args);
          });
        };

        /**
         * @ngdoc method
         * @name promise#thenRedirectTo
         * @function
         *
         * @description
         * Returns a function that, when the promise resolves, redirects the user to the given path
         * using the $location service.
         * Has an optional Replace boolean argument, which will call $location.replace if truthy.
         *
         * ```js
         *   promise.thenRedirectTo('/some/path', true);
         * ```
         *
         * This is equivalent to the following:
         *
         * ```js
         *   promise.then(function () {
         *     $location.redirectTo('/some/path').replace();
         *   });
         * ```
         *
         * @param {String} path The path to redirect the user to
         * @param {Boolean} [replace=false] Whether or not to replace the URL in the browser (disables history)
         * @returns {Promise} A promise that resolves to the original promise result value.
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
