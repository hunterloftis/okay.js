(function(_) {
  
  // Create namespace
  
  var ok = window.ok = window.ok || {};
  
  ok.dom = {};
  ok.binding = {};
  
  // Private members
  
  var _all_bindings = {};    // Bindings by namespace dictionary
  var _data_attr = 'data-bind';  
  
  // Tracking
  
  var _tracking = false,
      _tracked = [];
  
  function _startTracking() {
    _tracked = [];
    _tracking = true;
  };
    
  function _stopTracking() {
    _tracking = false;
    _tracked = _.uniq(_tracked);
  };
  
  // Datum, the basis for all Okay data types

  ok.Datum = function(definition) {
    this._val;
    this._subscriptions = [];
    _(this).extend(definition);
  }
  
  /**
   * Datum Accessor
   *
   * must be accessible like this:
   *
   * var accessor = ok.base(10);
   * console.log(accessor());   // "10"
   * accessor.subscribe(function(val) { console.log(val); });
   * accessor(20);              // "20"
   *
   */
  
  ok.Datum.accessor = function(base) {      // TODO: Make this work
    this.base = base;
    if (arguments.length > 0) {
      return this.write(arguments[0]);
    }
    if (_tracking) _track(this);
    return this.read();
  };

  ok.Datum.prototype = {
    
    read: function() {
      return this._val;
    },
    
    write: function(val) {
      this._val = val;
      this.publish();
      return this._val;
    },
    
    calc: null,
    
    context: null,
    
    adapt: [],
        
    // Overwrite the above to change Datum behavior
        
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
    },
    
    manage_subscriptions: function(trackedDependencies) {
      var boundDependencies = this.update_calc._publishers;
      
      var unbindFrom = _(boundDependencies).select(function(dependency) {   // Find expired dependencies
        return !_(trackedDependencies).contains(dependency);
      });
      
      var bindTo = _(trackedDependencies).select(function(dependency) {   // Find new dependencies
        return !_(boundDependencies).contains(dependency);
      });
      
      _(unbindFrom).each(function(datum) {   // Unbind expired dependencies
        datum.unsubscribe(this.update_calc);
      });
    
      _(bindTo).each(function(datum) {   // Bind new dependencies
        datum.subscribe(this.update_calc);
      });
    },
    
    update_calc: function() {
      var _oldVal = this._val;
      _startTracking();
      this._val = this.calc.call(this.context);
      _stopTracking();
      this.manage_subscriptions(_tracked);
      if (this._val !== _oldVal) this.publish();
    },
    
    track: function(datum) {
      _tracked.push(datum);
    }
  };  
  
  // Binding to DOM nodes
  
  ok.bind = function(viewModel, namespace) {
    namespace = namespace || '';
    var data_attr = _data_attr + (namespace.length > 0 ? '-' + namespace : '');
    var boundNodes = ok.dom.nodesWithAttr(data_attr);   // Find all elements with a data-bind attribute
    
    _(boundNodes).each(function(node) {
      
      var bindingString = ok.dom.attr(node, data_attr);   // extract the attribute as a string
      
      bindingString = 'var bindingObject = {' + bindingString + '}';   // convert the attribute to an object
      with(viewModel) {
        eval(bindingString);
      }
      
      var all_bindings = _all_bindings[namespace] = [];
      _.each(bindingObject, function(subscribable, type) {        // register subscribables for each binding
        all_bindings.push(ok.binding[type](node, subscribable));
      });
    });
  };
  
  // Unbinding a namespace
  
  ok.unbind = function(namespace) {
    namespace = namespace || '';
    var all_bindings = _all_bindings[namespace];
    if(all_bindings) {
      _(all_bindings).each(function(binding) {
        binding.release();
      });
      _all_bindings[namespace] = [];
    }
    else {
      throw new Error("Nothing is bound to namespace '" + namespace + "'");
    }
  };
  
})(_);