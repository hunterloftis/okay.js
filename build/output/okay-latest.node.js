// Okay.JS
// by Hunter Loftis <hunter@hunterloftis.com>
//
// Version 0.1.0
(function(exports, _) {
    
  // Namespaces
  
  var ok = exports.ok = {};

  ok.dom = {};
  ok.template = {};
  ok.binding = {};
  ok.debug = {};
  
  // Debug
  
  ok.debug.SUBSCRIPTION_COUNT = 0;
  ok.debug.UPDATE_COUNT = 0;
  
  // Private members
  
  var _tracking = false;
  var _track_layers = [];
  var _layer_dependencies = null;
  
  var _allBindings = {};    // Bindings by namespace dictionary
  var _dataAttr = 'data-bind';
  var _watchAttr = 'data-watch';
  
  // Begin recording subscribable requests (dependencies)
  
  function _startTracking() {
    _tracking = true;
    _layer_dependencies = [];
    _track_layers.push(_layer_dependencies);
  }
  
  // Record a subscribable request
  
  function _track(subscribable) {
    _layer_dependencies.push(subscribable);
  }
  
  // Stop recording requests and return a list of the unique requests
  
  function _stopTracking() {
    var finished_dependencies = _.uniq(_track_layers.pop());
    if (_track_layers.length === 0) _tracking = false;
    _layer_dependencies = _(_track_layers).last();
    return finished_dependencies;
  }
  
  // Subscribable Mixin
  
  var _next_subscriber_hash = 1;
  function next_subscriber_hash() { return _next_subscriber_hash++; }
  
  function _makeSubscribable(object) {
    object.subscribe = subscribable.subscribe;
    object.publish = subscribable.publish;
    object.unsubscribe = subscribable.unsubscribe;
    object._publishesToHash = {};
    object._subscribesTo = {};
    object._isSubscribable = true;
    object._subscriber_hash = next_subscriber_hash();
  }
  
  var subscribable = {
    
    // Adds a callback function to the list of listeners for this subscribable
    subscribe: function(callback) {
      
      // All subscriber callbacks must be identified by a hash
      var hash = callback._subscriber_hash = callback._subscriber_hash || next_subscriber_hash();

      // Don't re-subscribe to something we've already got
      if (this._publishesToHash[hash]) return;
      
      // Add this callback to this subscriber's list of listeners
      this._publishesToHash[hash] = callback;
      
      ok.debug.SUBSCRIPTION_COUNT++;
    
      // All subscribers must keep a list of the subscribables they listen to
      callback._subscribesTo = callback._subscribesTo || {};
      callback._subscribesTo[this._subscriber_hash] = this;
    },
    
    // Publishes a value to all listeners of this subscribable
    publish: function(val) {
      _(this._publishesToHash).each(function(listener) {
        listener(val);
      }, this);
    },
    
    unsubscribe: function(callback) {
      
      ok.debug.SUBSCRIPTION_COUNT--;
      
      // TODO: Consider changing this to a slower (but safer) (callback._subscriber_hash && callback._subscribesTo[this._subscriber_hash])
      if (true) {
        // Remove this from the callback's list of subscribables
        delete callback._subscribesTo[this._subscriber_hash];
        
        // Remove the callback from this subscriber's list of listeners
        delete this._publishesToHash[callback._subscriber_hash];
      }
      
    }
  };
  
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
  };
  
  // Collections
  
  ok.collection = function(initializer) {
    var _array = initializer;
    
    function collection() {
      if (arguments.length > 0) {
        _array = arguments[0];
        collection.publish(_array);
        return this;
      }
      if (_tracking) _track(collection);
      return _array;
    }
    
    function adapt(method) {
      return function() {
        if (typeof(_array) === 'undefined') _array = [];        // TODO: Evaluate whether or not this is the best behavior
        var result = _array[method].apply(_array, arguments);
        collection.publish(_array);
        return result;
      };
    }
    
    _(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']).each(function(method) {
      collection[method] = adapt(method);
    });
    
    _makeSubscribable(collection);
    return collection;
  };
  
  // Update Queue
  
  function UpdateQueue() {
    this.functions = [];
    this.running = false;
  }
  UpdateQueue.prototype = {
    push: function(fn) {
      if (_(this.functions).indexOf(fn) !== -1) return; // Abort the push if this function is already queued up
      this.functions.push(fn);
      if (!this.running) this.run();
    },
    run: function() {
      this.running = true;
      var remaining = this.functions.length;
      var process = remaining > 3 ? 3 : remaining;
      
      while(process--) {
        
      }
      var fn = this.functions.shift();
      if (fn) fn(this.complete);
      else this.running = false;
    },
    complete: function(err, result) {
      setTimeout(function() {
        update_queue.run();   // TODO: Figure out why self won't work here
      }, 1);
    }
  };
  
  var update_queue = new UpdateQueue();
  
  // Dependents
  
  ok.dependent = function(func, context) {
    var _currentValue;
    
    function dependent() {
      if (_tracking) _track(dependent);
      return _currentValue;
    }

    _makeSubscribable(dependent);
    
    /*
    function _update() {
      //update_queue.push(_process_update);
      _process_update();
    }
    */
    
    function _update() {
      
      ok.debug.UPDATE_COUNT++;
      
      var boundDependencies = _update._subscribesTo, trackedDependencies;
      
      _startTracking(); // Start tracking which bases, collections, and dependents this dependent depends on
      
      var _oldValue = _currentValue;
      _currentValue = func.call(context); // Run the function
      
      trackedDependencies = _stopTracking();  // Stop tracking
      
      var i;
      
      i = boundDependencies.length;
      while(i--) {
        boundDependencies[i].unsubscribe(_update);
      }
      
      i = trackedDependencies.length;
      while(i--) {
        trackedDependencies[i].subscribe(_update);
      }
      
      if (_currentValue !== _oldValue) dependent.publish(_currentValue);   // Publish an update for subscribers
      
      return;
    }
    
    _makeSubscribable(_update);
    
    _update();
    return dependent;
  };
  
  // TODO: Cross-browser test and replace with eval() if necessary
  
  ok.dep = function(str, context) {
    var fn = new Function('return ' + str);
    return ok.dependent(fn, context);
  };
  
  // Binding a namespace to the DOM
  
  ok.bind = function(viewModel, namespace, containerNode) {
    
    namespace = namespace || '';
    
    var dataAttr = _dataAttr + (namespace.length > 0 ? '-' + namespace : '');
    var watchAttr = _watchAttr + (namespace.length > 0 ? '-' + namespace : '');
    
    // Find all elements with a data-bind(-namespace) attribute
    var boundNodes = ok.dom.nodesWithAttr(dataAttr, containerNode),
        allBindings = _allBindings[namespace] = [];
    
    _(boundNodes).each(function(node) {
      
      var bindingString = ok.dom.attr(node, dataAttr);   // extract the attribute as a string
      
      bindingString = 'var bindingObject = {' + bindingString + '}';   // convert the attribute to an object
      with(viewModel) {
        eval(bindingString);
      }
      
      _.each(bindingObject, function(subscribable, type) {        // register subscribables for each binding
        var binding = ok.binding[type](node, subscribable, viewModel, false);  // figure out the type of binding (html, value, click, etc) and create the binding
        if (binding instanceof Array) {
          allBindings.concat(binding);
        }
        else {
          allBindings.push(binding);
        }
      });
    });
    
    // Find all elements with a data-bind(-namespace) attribute
    var watchNodes = ok.dom.nodesWithAttr(watchAttr, containerNode);
    
    _(watchNodes).each(function(node) {
  
      var bindingString = ok.dom.attr(node, watchAttr);   // extract the attribute as a string
      
      bindingString = 'var bindingObject = {' + bindingString + '}';   // convert the attribute to an object
      with(viewModel) {
        eval(bindingString);
      }
      
      _.each(bindingObject, function(subscribable, type) {        // register subscribables for each binding
        var binding = ok.binding[type](node, subscribable, viewModel, true);  // figure out the type of binding (html, value, click, etc) and create the binding
        if (binding instanceof Array) {
          allBindings.concat(binding);
        }
        else {
          allBindings.push(binding);
        }
      });
    });
    
    return allBindings;
  };
  
  // Unbinding a namespace from the DOM
  
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
  
  // Safe way for bindings to subscribe
  
  ok['safeSubscribe'] = function(mystery, fn, context) {
    fn = _(fn).bind(context);
    if (mystery) {
      if (mystery.subscribe) {
        mystery.subscribe(fn);
        fn(mystery());
        return fn;
      }
      fn(mystery);    // Just send value straightaway
      return fn;
    }
    return;   // TODO: Place some sort of notification here that your binding wasn't made
  };

})(typeof exports === 'undefined' ? this : exports, _);(function(exports, _) {
  
  var ok = exports.ok;

  var utils = ok.utils = {};

  utils.toJSON = function toJSON(object, level) {
    if (typeof(level) === 'undefined') level = 0;
    level++;
    if (level > 5) return undefined;
    if (typeof(object) === 'function') {
      if (object._isSubscribable) {
        return toJSON(object(), level);
      }
    }
    else if (typeof(object) === 'object') {
      var obj;
      if (object instanceof Array) obj = [];
      else obj = {};
      var i = 0;
      for (var key in object) {
        obj[key] = toJSON(object[key], level);
      }
      return obj;
    }
    else {
      return object;  // Native types
    }
  };
  
})(typeof exports === 'undefined' ? this : exports, _);