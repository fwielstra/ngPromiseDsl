'use strict';

describe('The Angular promise DSL', function () {

  var
    $location,
    $scope,
    $q;

  beforeEach(function () {
    $location = jasmine.createSpyObj('$location', ['path', 'replace']);

    module('ngPromiseDsl', function($provide) {
      $provide.value('$location', $location);
    });

    inject(function (_$q_, $rootScope) {
      $q = _$q_;
      $scope = $rootScope.$new();
    });
  });

  describe('The except method', function () {
    it('should be an alias for .then(null, fn)', function () {
      var deferred = $q.defer();
      var failureCallback = jasmine.createSpy('failure callback');
      deferred.promise.except(failureCallback);
      deferred.reject();
      $scope.$apply();
      expect(failureCallback).toHaveBeenCalled();
    });
  });

  describe('The thenSet method', function () {
    it('should set the resolved promise\'s value to the given object under the given key', function () {
      var obj = {};
      var key = 'test';
      var value = 'for great justice';

      var deferred = $q.defer();
      deferred.promise.thenSet(obj, key);
      deferred.resolve(value);

      $scope.$apply();

      expect(obj.test).toBe(value);
    });

    it('should set a fixed value when the promise resolves and a constant was provided', function () {
      var obj = {};
      var deferred = $q.defer();
      deferred.promise.thenSet(obj, 'test', 'teeest');
      deferred.resolve();
      $scope.$apply();
      expect(obj.test).toBe('teeest');
    });
  });

  describe('The exceptSet method', function () {
    it('should set the rejected promise\'s value to the given object under the given key', function () {
      var obj = {};
      var deferred = $q.defer();
      deferred.promise.exceptSet(obj, 'test');
      deferred.reject('for great justice');
      $scope.$apply();
      expect(obj.test).toBe('for great justice');
    });

    it('should set a fixed value when the promise resolves and a constant was provided', function () {
      var obj = {};
      var deferred = $q.defer();
      deferred.promise.exceptSet(obj, 'test', 'teeest');
      deferred.reject();
      $scope.$apply();
      expect(obj.test).toBe('teeest');
    });
  });

  describe('The thenTake method', function () {
    it('should take the value of the given key from the object returned by the promise and pass it to the next then in the chain', function () {
      var obj = {test: 'teeeest'};
      var deferred = $q.defer();
      var successCallback = jasmine.createSpy('success');
      deferred.promise
        .thenTake('test')
        .then(successCallback);

      deferred.resolve(obj);
      $scope.$apply();
      expect(successCallback).toHaveBeenCalledWith(obj.test);
    });
  });

  describe('The thenReturn method', function () {
    it('should pass the first argument to the next then in the chain when the promise resolves', function () {
      var deferred = $q.defer();
      var successCallback = jasmine.createSpy('success');
      deferred.promise
        .thenReturn('success')
        .then(successCallback);

      deferred.resolve();
      $scope.$apply();

      expect(successCallback).toHaveBeenCalledWith('success');
    });

    it('should pass the second argument to the next then in the chain when the promise rejects', function () {
      var deferred = $q.defer();
      var successCallback = jasmine.createSpy('success');
      deferred.promise
        .thenReturn('success', 'failure')
        .then(successCallback);

      deferred.reject();
      $scope.$apply();

      expect(successCallback).toHaveBeenCalledWith('failure');
    });
  });

  describe('The thenExec method', function () {
    it('should call the function with the promise value when the promise resolves', function () {
      var deferred = $q.defer();
      var successCallback = jasmine.createSpy('success');
      deferred.promise.thenExec(successCallback);
      deferred.resolve('argument');
      $scope.$apply();
      expect(successCallback).toHaveBeenCalledWith('argument');
    });

    it('should pass the resolved value to the next entry in the promise chain regardless of the return value of the first handler', function () {
      var deferred = $q.defer();
      var successCallback = jasmine.createSpy('success');

      deferred.promise
        .thenExec(function() {
          return 'another result';
        })
        .thenExec(successCallback);

      deferred.resolve('argument');
      $scope.$apply();
      expect(successCallback).toHaveBeenCalledWith('argument');
    });
  });

  describe('The thenApply method', function () {
    it('should call the given function name on the object returned by the project with the remaining parameters as arguments', function () {
      var deferred = $q.defer();
      var successCallback = jasmine.createSpy('success');

      deferred.promise.thenApply('run', 'first argument');

      deferred.resolve({ run: successCallback });
      $scope.$apply();

      expect(successCallback).toHaveBeenCalledWith('first argument');
    });
  });

  describe('The thenRedirectTo method', function () {
    it('should call $location.path with the given path argument', function () {
      var deferred = $q.defer();

      deferred.promise.thenRedirectTo('/path');
      deferred.resolve();
      $scope.$apply();

      expect($location.path).toHaveBeenCalledWith('/path');
      expect($location.replace).not.toHaveBeenCalled();
    });

    it('should call $location.replace if the second argument is true', function () {
      var deferred = $q.defer();

      deferred.promise.thenRedirectTo('/path', true);
      deferred.resolve();
      $scope.$apply();

      expect($location.path).toHaveBeenCalledWith('/path');
      expect($location.replace).toHaveBeenCalled();
    });
  });

  describe('the thenSetAll method', function () {
    it('should set the given promises to the given object under their respective object keys', function () {
      var promise1 = $q.when('value one');
      var promise2 = $q.when('value two');
      var obj = {};
      $q.all({one: promise1, two: promise2})
        .thenSetAll(obj);
      $scope.$apply();

      expect(obj.one).toBe('value one');
      expect(obj.two).toBe('value two');
    });
  });

});
