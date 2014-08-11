# Angular Promise DSL

A small library that adds a number of utility methods to Angular's $q promises.

## Usage

Simply add ngPromseDsl as a dependency in your module definition

angular.module('myAwesomeApp', ['ngPromiseDsl'])

## Methods

### thenSet()

Sets the value the promise resolves to onto the given object under the given property name.

    promise.thenSet($scope, 'myValue');

Alternatively, sets a constant value when the promise resolves:

    promise.thenSet($scope, 'showSpinner', false);

### thenSetAll()

Sets all keys from a `$q.all()` call to the given object under those same keys. Do note that this
will wait for *all* promises to resolve before setting them, which may appear slower than setting
the values individually

    $q.all([myPromise, myOtherPromise])
      .thenSetAll($scope);

### except()

Alias for `.catch()`, so it can be used with ES 3 (IE 8)

   promise.except(function(error) {
     $log.error(error);
   });

### exceptSet()

Similar to `.thenSet()`, only for error cases

    promise.exceptSet($scope, 'showError', true);

### thenTake()

Picks a given property from the resolved value and passes it to the next callback in the promise chain

    promise
      .thenTake('subValue')
      .thenSet($scope, 'value');

### thenReturn()

Returns a fixed value on success or failure; useful for converting promises that contain business
logic (resolves when successful, rejects when failed) to booleans that can be put on the scope

    promise
      .thenReturn(true, false)
      .thenSet($scope, 'wasSuccessful')

### thenExec()

Calls the given method with the promise value when it resolves, returning the original value.
Useful for chaining and not having to declare an explicit return for the callback

    promise.thenExec(calculateTotals);

### thenApply()

Calls the given method (by name) on the object the promise resolves to. Useful in combination with
Restangular

    promise.thenApply('get', 'sub-resource');

### thenRedirectTo()

Redirects the user to the given path on success using `$location`, optionally replacing the url.

    promise.thenRedirectTo('/success');
    promise.thenRedirectTo('/success', true); // calls $location.replace()


## TODO

 * Publish on bower / npm repositories
 * Write installation instructions once there
 * `thenLog(logLevel)` method that calls $log with the promise result or a constant value

## Links

[Extending AngularJS services with the decorate method](http://blog.xebia.com/2014/08/08/extending-angularjs-services-with-the-decorate-method/) (blog.xebia.com)
[http://dorp.io/blog/extending-q-promises.html](Extending Q promises) (dorp.io)

## Contributors
 * [@fwielstra](https://github.com/fwielstra)
 * [@jbnicolai](https://github.com/jbnicolai)

## License

MIT
