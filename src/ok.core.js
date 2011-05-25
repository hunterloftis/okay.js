// TODO - rename 'value' and 'result' to:
// base and dependent

(function() {
  
  // Create namespace
  
  var ok = window.ok = window.ok || {};
  
  // Tracking
  
  var _tracking, _tracked;
  
  // Begin recording subscribable requests (dependencies)
  function _startTracking() {
    _tracking = true;
    _tracked = [];
  }
  
  // Record a subscribable request
  function _track(subscribable) {
    _tracked.push(subscribable);
  }
  
  // Stop recording requests and return a list of the unique requests
  function _stopTracking() {
    _tracking = false;
    _tracked = _.uniq(_tracked);
    return _tracked;
  }
  
  // Subscribable Mixin
  
  var subscribable = {
    subscribe: function(callback) {
      this._subscriptions.push(callback);
      callback._publishers = callback._publishers || [];
      if (!_(callback._publishers).contains(this)) {
        callback._publishers.push(this);
      }
    },
    publish: function(val) {
      _(this._subscriptions).each(function(subscription) {
        subscription.call(this, val);
      }, this);
    },
    unsubscribe: function(callback) {
      this._subscriptions = _(this._subscriptions).without(callback);
      callback._publishers = _(callback._publishers).without(this);
    }
  };
  
  // Allow an object to publish changes to itself
  function _makeSubscribable(object) {
    object._subscriptions = [];
    object.subscribe = subscribable.subscribe;
    object.publish = subscribable.publish;
    object.unsubscribe = subscribable.unsubscribe;
  }
  
  // Bases
  
  ok.base = function(initializer) {
    var _currentValue = initializer;
    
    function base() {
      if (arguments.length > 0) {
        // Is the value actually new?
        if (_currentValue !== arguments[0]) {
          _currentValue = arguments[0];
          base.publish(_currentValue);
        }
        return this;
      }
      
      if (_tracking) _track(base);
      
      return _currentValue;
    }

    _makeSubscribable(base);
    
    return base;
  }
  
  // Collections
  
  ok.collection = function(initializer) {
    var _array = initializer;
    
    function collection() {
      if (arguments.length > 0) {
        _array = arguments[0];
        return this;
      }
      return _array;
    }
    
    function adapt(method) {
      return function() {
        return _array[method].apply(_array, arguments);
      }
    }
    
    collection.pop = adapt('pop');
    collection.push = adapt('push');
    collection.reverse = adapt('reverse');
    collection.shift = adapt('shift');
    collection.sort = adapt('sort');
    collection.splice = adapt('splice');
    collection.unshift = adapt('unshift');
    
    return collection;
  }
  
  // Dependents
  
  ok.dependent = function(func, context) {
    var _currentValue;
    
    function dependent() {
      if (_tracking) _track(dependent);
      return _currentValue;
    }
    
    _makeSubscribable(dependent);
    
    function _update() {    
      var boundDependencies = _update._publishers ? _update._publishers.slice() : [],
          trackedDependencies;
      
      // Start tracking which bases, collections, and dependents this dependent depends on
      _startTracking();
      
      // Run the function
      _currentValue = func.call(context);
      
      // Stop tracking
      trackedDependencies = _stopTracking();
      
      // Find expired dependencies
      var unbindFrom = _(boundDependencies).select(function(dependency) {
        return !_(trackedDependencies).contains(dependency);
      });
      
      // Find new dependencies
      var bindTo = _(trackedDependencies).select(function(dependency) {
        return !_(boundDependencies).contains(dependency);
      });
    
      // Unbind and bind to keep dependencies current
      
      _(unbindFrom).each(function(subscribable) {
        subscribable.unsubscribe(_update);
      });
    
      _(bindTo).each(function(subscribable) {
        subscribable.subscribe(_update);
      });
      
      // Publish an update for subscribers
      dependent.publish(_currentValue);
    }
    
    _update();
    
    return dependent;
  }
  
  ok.bind = function(viewModel, namespace) {
    // Find all elements with a data-bind attribute
    var boundNodes = ok.dom.nodesWithAttr('data-bind');
    
    _(boundNodes).each(function(node) {
      // extract the attribute as a string
      var bindingString = ok.dom.attr(node, 'data-bind');
      
      // convert the attribute to a JSON object
      bindingString = 'var bindingObject = {' + bindingString + '}';
      eval(bindingString);
      console.dir(bindingObject);
      
      _.each(bindingObject, function(value, binding) {
        console.log("Binding on " + binding);
      });
    });
  };
  
})();