(function() {
  
  // Create namespace
  
  var ok = window.ok = window.ok || {};
  
  ok.dom = {};
  ok.binding = {};
  
  // Private members
  
  var _tracking, _tracked;
  var _allBindings = {};    // Bindings by namespace dictionary
  var _dataAttr = 'data-bind';
  
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
  
  // Datum, the basis for all Okay data types

  ok.Datum = function(definition) {
    this._val;
    this._subscriptions = [];
    _(this).extend(definition);
  }
  ok.Datum.prototype = {
    accessor: function() {
      if (arguments.length > 0) {
        return this.write(arguments[0]);
      }
      if (_tracking) _track(this);
      return this.read();
    },
    read: function() {
      return this._val;
    },
    write: function(val) {
      this._val = val;
      this.publish();
      return this._val;
    },
    calc: function() {},
    adapt: [],
    publish: function() {
      _(this._subscriptions).each(function(subscription) {
        subscription.callback.call(subscription.context, this._val);
      }, this);
    },
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
    unsubscribe: function(callback) {
      this._subscriptions = _(this._subscriptions).reject(function(subscription) {
        return (subscription.callback === callback);
      });
      callback._publishers = _(callback._publishers).without(this);
    }
  };  
  
  // Binding to DOM nodes
  
  ok.bind = function(viewModel, namespace) {
    namespace = namespace || '';
    var dataAttr = _dataAttr + (namespace.length > 0 ? '-' + namespace : '');
    var boundNodes = ok.dom.nodesWithAttr(dataAttr);   // Find all elements with a data-bind attribute
    
    _(boundNodes).each(function(node) {
      
      var bindingString = ok.dom.attr(node, dataAttr);   // extract the attribute as a string
      
      bindingString = 'var bindingObject = {' + bindingString + '}';   // convert the attribute to an object
      with(viewModel) {
        eval(bindingString);
      }
      
      var allBindings = _allBindings[namespace] = [];
      _.each(bindingObject, function(subscribable, type) {        // register subscribables for each binding
        allBindings.push(ok.binding[type](node, subscribable));
      });
    });
  };
  
  // Unbinding a namespace
  
  ok.unbind = function(namespace) {
    namespace = namespace || '';
    var allBindings = _allBindings[namespace];
    if(allBindings) {
      _(allBindings).each(function(binding) {
        binding.release();
      });
      _allBindings[namespace] = [];
    }
    else {
      throw new Error("Nothing is bound to namespace '" + namespace + "'");
    }
  };
  
})();