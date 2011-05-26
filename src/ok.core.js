(function() {
  
  // Create namespace
  
  var ok = window.ok = window.ok || {};
  
  ok.dom = {};
  ok.binding = {};
  
  // Private members
  
  var _tracking, _tracked;
  var _allBindings = [];
  
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
    subscribe: function(callback, context) {
      var subscription = {
        callback: callback,
        context: context || this
      };
      this._subscriptions.push(subscription);             // TODO: Check that it doesn't already exist in _subscriptions
      callback._publishers = callback._publishers || [];
      if (!_(callback._publishers).contains(this)) {
        callback._publishers.push(this);
      }
    },
    publish: function(val) {
      _(this._subscriptions).each(function(subscription) {
        subscription.callback.call(subscription.context, val);
      }, this);
    },
    unsubscribe: function(callback) {
      this._subscriptions = _(this._subscriptions).reject(function(subscription) {
        return (subscription.callback === callback);
      });
      callback._publishers = _(callback._publishers).without(this);
    }
  };
  
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
    
    _(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']).each(function(method) {
      collection[method] = adapt(method);
    });
    
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
      
      _startTracking(); // Start tracking which bases, collections, and dependents this dependent depends on
      
      _currentValue = func.call(context); // Run the function
      
      trackedDependencies = _stopTracking();  // Stop tracking
      
      var unbindFrom = _(boundDependencies).select(function(dependency) {   // Find expired dependencies
        return !_(trackedDependencies).contains(dependency);
      });
      
      var bindTo = _(trackedDependencies).select(function(dependency) {   // Find new dependencies
        return !_(boundDependencies).contains(dependency);
      });
      
      _(unbindFrom).each(function(subscribable) {   // Unbind expired dependencies
        subscribable.unsubscribe(_update);
      });
    
      _(bindTo).each(function(subscribable) {   // Bind new dependencies
        subscribable.subscribe(_update);
      });
      
      dependent.publish(_currentValue);   // Publish an update for subscribers
    }
    
    _update();
    return dependent;
  }
  
  // Binding to DOM nodes
  
  ok.bind = function(viewModel, namespace) {
    var boundNodes = ok.dom.nodesWithAttr('data-bind');   // Find all elements with a data-bind attribute
    
    _(boundNodes).each(function(node) {
      var bindingString = ok.dom.attr(node, 'data-bind');   // extract the attribute as a string
      
      bindingString = 'var bindingObject = {' + bindingString + '}';   // convert the attribute to an object
      with(viewModel) {
        eval(bindingString);
      }
      
      _.each(bindingObject, function(subscribable, type) {        // register subscribables for each binding
        _allBindings.push(ok.binding[type](node, subscribable));
      });
    });
  };
  
  // Unbinding a viewModel
  
  ok.unbind = function(viewModel, namespace) {
    _(_allBindings).each(function(binding) {
      binding.release();
    });
    _allBindings = [];
  };
  
})();