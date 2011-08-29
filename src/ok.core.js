window['ok'] = window['ok'] || {};

(function(ok, _) {
    
  // Namespaces
  
  ok['dom'] = {};
  ok['template'] = {};
  ok['binding'] = {};
  ok['debug'] = {};
  
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
  
  var subscribable = {
    subscribe: function(callback, context) {
      
      if (_(this._subscriptions).any(function(s) {                // TODO: Make this faster/more efficient
        return s.callback === callback && s.context === context;
      })) return;
      ok.debug.SUBSCRIPTION_COUNT++;
      var subscription = {
        callback: callback,
        context: context || this
      };
      this._subscriptions.push(subscription);
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
      ok.debug.SUBSCRIPTION_COUNT--;
      
      var newstuff = true;
      
      if (!newstuff) {
        
        this._subscriptions = _(this._subscriptions).reject(function(subscription) {
          return (subscription.callback === callback);
        });
      
      }
      else {

        var i;
        var newsubs = [];
        i = this._subscriptions.length;
        var tosplice = [];
        while(i--) {
          console.log("Length at beginning of loop: " + this._subscriptions.length);
          if (this._subscriptions[i].callback === callback) {
            console.log("REMOVING 1");
            console.log("before: " + this._subscriptions.length);
            console.dir(this._subscriptions);
            console.log("Slicing at " + i);
            this._subscriptions.splice(i, 1);
            console.dir(this._subscriptions);
            console.log("after: " + this._subscriptions.length);
          }
          else {
            console.log("ADDING 1");
            newsubs.push(this._subscriptions[i]);
          }
          console.log("Length at end of loop: " + this._subscriptions.length);
          console.log("Length of newsubs at end: " + newsubs.length);
        }
        console.log("Length after loop: " + this._subscriptions.length);
        console.log("working")
        console.dir(newsubs);
        console.log("not working");
        console.dir(this._subscriptions);
        
        for(i = 0; i < this._subscriptions.length; i++) {
          if (!_.isEqual(this._subscriptions[i], newsubs[i])) {
            console.log("NOT EQUAL");
          }
        }
        
        console.log("-----------------------------");
        //this._subscriptions = newsubs;
      
      }
      
      /*
      callback._publishers = _(callback._publishers).without(this);
      */      
      
      i = callback._publishers.length;
      while(i--) {
        if (callback._publishers[i] === this) {
          callback._publishers.splice(i, 1);
        }
      }
      
    }
  };
  
  function _makeSubscribable(object) {
    object._subscriptions = [];
    object['subscribe'] = subscribable.subscribe;
    object['publish'] = subscribable.publish;
    object['unsubscribe'] = subscribable.unsubscribe;
    object.__isSubscribable = true;
  }
  
  // Bases
  
  ok['base'] = function(initializer) {
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
  
  ok['collection'] = function(initializer) {
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
      }
    }
    
    _(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']).each(function(method) {
      collection[method] = adapt(method);
    });
    
    _makeSubscribable(collection);
    return collection;
  }
  
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
  
  ok['dependent'] = function(func, context) {
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
      var boundDependencies = _update._publishers ? _update._publishers.slice() : [],
          trackedDependencies;
      
      _startTracking(); // Start tracking which bases, collections, and dependents this dependent depends on
      
      var _oldValue = _currentValue;
      _currentValue = func.call(context); // Run the function
      
      trackedDependencies = _stopTracking();  // Stop tracking
      
      // TODO: Make this configurable (so you can turn off live dependecy tracking)
      //      That would increase the speed of dependents (esp. for mobile)
      
      /*
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
      */
      
      _(boundDependencies).each(function(dependency) {
        dependency.unsubscribe(_update);
      });
      
      _(trackedDependencies).each(function(dependency) {
        dependency.subscribe(_update);
      });
      
      if (_currentValue !== _oldValue) dependent.publish(_currentValue);   // Publish an update for subscribers
      
      return;
    }
    
    _update();
    return dependent;
  };
  
  // TODO: Cross-browser test and replace with eval() if necessary
  
  ok['dep'] = function(str, context) {
    var fn = new Function('return ' + str);
    return ok['dependent'](fn, context);
  };
  
  // Binding a namespace to the DOM
  
  ok['bind'] = function(viewModel, namespace, containerNode) {
    
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
          allBindings.concat(binding)
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
          allBindings.concat(binding)
        }
        else {
          allBindings.push(binding);
        }
      });
    });
    
    return allBindings;
  };
  
  // Unbinding a namespace from the DOM
  
  ok['unbind'] = function(namespace) {
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
    if (mystery) {
      if (mystery.subscribe) {
        mystery.subscribe(fn, context);
        fn.call(context, mystery());
        return;
      }
      return fn.call(context, mystery);    // Just send value straightaway
    }
    return;   // TODO: Place some sort of notification here that your binding wasn't made
  };
  
})(window['ok'], window['_']);