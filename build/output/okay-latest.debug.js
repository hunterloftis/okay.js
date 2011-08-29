// Okay.JS
// by Hunter Loftis <hunter@hunterloftis.com>
//
// Version 0.1.0
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
  
  var _next_subscriber_hash = 1;
  function next_subscriber_hash() { return _next_subscriber_hash++; }
  
  function _makeSubscribable(object) {
    object['subscribe'] = subscribable.subscribe;
    object['publish'] = subscribable.publish;
    object['unsubscribe'] = subscribable.unsubscribe;
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
  
})(window['ok'], window['_']);(function(ok, _) {
  
  var utils = ok.utils = {};
  
  utils.toJSON = function toJSON(object) {
    if (typeof(object) === 'function') {
      if (object.__isSubscribable) {
        return toJSON(object());
      }
    }
    else if (typeof(object) === 'object') {
      var obj;
      if (object instanceof Array) obj = [];
      else obj = {};
      for (var key in object) {
        obj[key] = toJSON(object[key]);
      }
      return obj;
    }
    else {
      return object;  // Native types
    }
  };
  
})(ok, _);(function(ok, $) {

  var dom = ok.dom;
  
  var bindings = {};
  
  dom['nodesWithAttr'] = function(attr, containerNode) {
    var selector = '*[' + attr + ']';
    if (containerNode) {
      var children_matches = $(containerNode).find('*[' + attr + ']');  
      if ($(containerNode).is(selector)) return $(containerNode).add(children_matches);
      return children_matches;
    }
    return $(selector);
  };
  
  dom['createNode'] = function(html) {
    return $(html);
  }
  
  dom['append'] = function(parent, child) {
    $(parent).append(child);
  }
  
  dom['remove'] = function(node) {
    $(node).remove();
  }
  
  dom['after'] = function(first, second) {
    $(first).after(second);
  }
  
  dom['before'] = function(second, first) {
    $(second).before(first);
  }
  
  dom['attr'] = function(node, attr) {
    return $(node).attr(attr);
  }
  
  dom['show'] = function(node) {
    $(node).show();
  }
  
  dom['hide'] = function(node) {
    $(node).hide();
  }
  
  dom['text'] = function(node, value) {
    $(node).html(value);                // Zepto's .text() doesn't work here, check on that
  }

  dom['html'] = function(node, value) {
    return $(node).html(value);
  }
  
  dom['value'] = function(node, value) {
    return $(node).val(value);
  }
  
  dom['bind'] = function(node, event, callback, context) {
    var handler = function() {
      callback.call(context);
    }
    $(node).bind(event, handler);
    return handler;
  }
  
  dom['unbind'] = function(node, event, handler) {
    $(node).unbind(event, handler);
  }
  
  dom['attribute'] = function(node, attr, setter) {
    return $(node).attr(attr, setter);
  };
  
  dom['removeAttribute'] = function(node, attr) {
    $(node).removeAttr(attr);
  };
  
  dom['is'] = function(node, filter) {
    return $(node).is(filter);
  };
  
})(window['ok'], window['Zepto']);(function(ok, _) {

  var template = ok['template'];
    
  template.render = function(html, object) {
    return _.template(html, object)
  }
  
})(window['ok'], window['_']);(function(ok) {

  function VisibleBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    this.subscription = ok.safeSubscribe(subscribable, this.update, this);
  }
  VisibleBinding.prototype = {
    update: function(newValue) {
      if (newValue) {
        ok.dom.show(this.node);
      }
      else {
        ok.dom.hide(this.node);
      }
    },
    release: function() {
      this.subscribable.unsubscribe(this.subscription);
    }
  };
  
  ok.binding['visible'] = function(node, subscribable) {
    return new VisibleBinding(node, subscribable);
  };
  
})(ok);(function(ok) {
  
  function HtmlBinding(node, subscribable, vm, debounce) {
    this.update = debounce ? _(this._update).debounce(0) : this._update;
    this.node = node;
    this.subscribable = subscribable;
    this.subscription = ok.safeSubscribe(subscribable, this.update, this);
  }
  HtmlBinding.prototype = {
    _update: function(newValue) {
      ok.dom.html(this.node, newValue);
    },
    release: function() {
      this.subscribable.unsubscribe(this.subscription);
    }
  };
  
  ok.binding['html'] = function(node, subscribable, vm, debounce) {
    return new HtmlBinding(node, subscribable, vm, debounce);
  };
  
  ok.debug.HtmlBinding = HtmlBinding;
  
})(ok);(function(ok) {

  function ClickBinding(node, callback, vm) {
    this.node = node;
    this.callback = callback;
    this.vm = vm;
    $(node).bind('click', _.bind(this.activate, this));
  }
  ClickBinding.prototype = {
    activate: function(event) {
      if (!this.callback.call(this.vm, [event])) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    release: function() {
      $(node).unbind('click', this.callback);
    }
  };
  
  ok.binding['click'] = function(node, callback, vm) {
    return new ClickBinding(node, callback, vm);
  };
  
})(ok);(function(ok) {

  function SubmitBinding(node, callback, vm) {
    this.node = node;
    this.callback = callback;
    this.vm = vm;
    $(node).bind('submit', _.bind(this.activate, this));
  }
  SubmitBinding.prototype = {
    activate: function(event) {
      if (!this.callback.call(this.vm, [event])) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    release: function() {
      $(node).unbind('submit', this.callback);  // TODO: use the dom adapter
    }
  };
  
  ok.binding['submit'] = function(node, callback, vm) {
    return new SubmitBinding(node, callback, vm);
  };
  
})(ok);(function(ok) {

  function has_touch() {
    return $.os.ios || $.os.android || $.os.webos || $.os.touchpad || $.os.iphone || $.os.ipad || $.os.blackberry;
  }
  
  function TapBinding(node, callback, vm) {
    this.node = node;
    this.callback = callback;
    this.vm = vm;
    
    if (has_touch()) {
      $(node).bind('tap', _.bind(this.activate, this));
      $(node).bind('touchstart', _.bind(this.btn_down, this));
      $(node).bind('touchend', _.bind(this.btn_up, this));
    }
    else {
      $(node).bind('click', _.bind(this.activate, this));
      $(node).bind('mousedown', _.bind(this.btn_down, this));
      $(node).bind('mouseup', _.bind(this.btn_up, this));
    }
  }
  TapBinding.prototype = {
    activate: function(event) {
      if (!this.callback.call(this.vm, [event])) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    release: function() {
      //$(this.node).unbind('tap', this.callback);
    },
    btn_down: function(event) {
      $(this.node).addClass('ok_down');
    },
    btn_up: function(event) {
      $(this.node).removeClass('ok_down');
    }
  };
  
  ok.binding['tap'] = function(node, callback, vm) {
    return new TapBinding(node, callback, vm);
  };
  
})(ok);(function(ok) {
  
  function TextValueBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    _(this).bindAll(['updateNode']);            // TODO less kludgy context system
    subscribable.subscribe(this.updateNode);
    this.updateNode(subscribable());
    this.bindNode(node);
  }
  TextValueBinding.prototype = {
    bindNode: function(node) {
      this.handler = ok.dom.bind(node, 'keyup', this.updateSubscribable, this);
    },
    updateNode: function(newValue) {
      ok.dom.value(this.node, newValue);
    },
    updateSubscribable: function(event) {
      this.subscribable(ok.dom.value(this.node));  
    },
    release: function() {
      this.subscribable.unsubscribe(this.updateNode);
      ok.dom.unbind(this.node, 'keyup', this.handler);
    }
  };

  function CheckValueBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    _(this).bindAll(['updateNode']);          // TODO Figure out a better way to convey context in bindings
    subscribable.subscribe(this.updateNode);
    this.updateNode(subscribable());
    this.bindNode(node);
  }
  CheckValueBinding.prototype = {
    bindNode: function(node) {
      this.handler = ok.dom.bind(node, 'change', this.updateSubscribable, this);
    },
    updateNode: function(newValue) {
      if (newValue) {
        ok.dom.attribute(this.node, 'checked', true);
      }
      else {
        ok.dom.removeAttribute(this.node, 'checked');
      }
    },
    updateSubscribable: function(event) {
      var val = (ok.dom.is(this.node, ':checked') !== false);
      this.subscribable(val);
    },
    release: function() {
      ok.dom.unbind(this.node, 'change', this.handler);
    }
  };
  
  var ValueBinding = {
    'text': TextValueBinding,
    'checkbox': CheckValueBinding
  };
  
  ok.binding['value'] = function(node, subscribable) {
    var type = ok.dom.attribute(node, 'type'),
        binder = ValueBinding[type] || ValueBinding['text'];
    return new binder(node, subscribable);
  };
  
})(ok);(function(ok) {
  
  var all_templates = {};
  
/**
 *   Binds a DOM node to an Okay.JS collection for template writing
 *
 *   @param {domNode} node
 *   @param {Object} options as { template: templateId, collection: collection }
 */

  function RepeatBinding(node, options, vm, debounce) {
    
    this.update = debounce ? _(this._update).debounce(0) : this._update;
    
    this.node = node;
    this.templateId = '#' + options.template;
    this.subscribable = options.collection;
    
    this._items = [];   // {node: domNode, data: array element}
    
    ok.dom.html(this.node, '');
    this.subscription = ok.safeSubscribe(this.subscribable, this.update, this);
  }
  
  RepeatBinding.prototype = {

/**
 *    Update the DOM node whenever the subscribable publishes a value change
 *
 *    @param {any} newValue the new value of the subscribable
 */
    _update: function(array) {
      
      var self = this,
          html = '',
          compiledTemplate;
          
      if (typeof all_templates[this.templateId] === 'undefined') all_templates[this.templateId] = _.template(ok.dom.html(this.templateId));
      
      compiledTemplate = all_templates[this.templateId];
      
      var current_data_array = _(this._items).pluck('data'),
          current_item,
          new_node,
          new_items = [];
      
      // Loop through 'array' (the data)
      _(array).each(function(data_item, index) {
        if (self._items.length > index) {
          // There's an existing list of bound DOM nodes to compare against
          
          current_item = self._items[index];
          
          if (current_item.data === data_item) {
            // Data item at 'index' is in sync, leave it alone
            new_items.push(current_item);
          }
          else {
            // Currently displayed data is out of sync with viewmodel data; needs update
            
            var data_in_node = _(current_data_array).indexOf(data_item);
            if (data_in_node >= 0) {
              // The data has already been rendered onto a DOM Node, it's just out of order
              ok.dom.before(current_item.node, self._items[data_in_node].node);
              new_items.push(self._items[data_in_node]);
            }
            else {
              
              // This is a new node that needs to be created and inserted at [index]
              new_node = ok.dom.createNode(compiledTemplate(data_item));
              ok.dom.before(current_item.node, new_node);
              ok.bind(data_item, null, new_node);
              new_items.push({data: data_item, node: new_node});
            }
          }
        }
        else {
          
          // We've exhausted our list of existing, bound items so we just need to start adding at the end
          new_node = ok.dom.createNode(compiledTemplate(data_item));
          ok.dom.append(self.node, new_node);
          ok.bind(data_item, null, new_node);
          new_items.push({data: data_item, node: new_node});
        }
      });
      
      // Delete any bound DOM items that don't correspond to a current data item
      var to_delete = [];
      _(this._items).each(function(item) {
        if (!_(array).contains(item.data)) {
          to_delete.push(item);
        }
      });
      _(to_delete).each(function(item_to_delete) {
        ok.dom.remove(item_to_delete.node);
      });
      
      this._items = new_items;
    },
    
    release: function() {
      this.subscribable.unsubscribe(this.subscription);
    }
  };
  
  ok.binding['repeat'] = function(node, subscribable, vm, debounce) {
    return new RepeatBinding(node, subscribable, vm, debounce);
  };
  
  ok.debug.RepeatBinding = RepeatBinding;
  
})(ok);(function(ok) {
  
  function CssBinding(node, className, subscribable) {
    this.node = node;
    this.className = className;
    this.subscribable = subscribable;
    this.subscription = ok.safeSubscribe(subscribable, this.update, this);
  }
  CssBinding.prototype = {
    update: function(newValue) {
      if (newValue) $(this.node).addClass(this.className);
      else $(this.node).removeClass(this.className);
    },
    release: function() {
      this.subscribable.unsubscribe(this.subscription);
    }
  };
  
  ok.binding['css'] = function(node, classes, vm) {
    var bindings = [];
    for (var className in classes) {
      bindings.push(new CssBinding(node, className, classes[className]));  
    };
    return bindings;
  };
  
})(ok);(function(ok) {
  
  function AttrBinding(node, attrName, subscribable) {
    this.node = node;
    this.attrName = attrName;
    this.subscribable = subscribable;
    this.subscription = ok.safeSubscribe(subscribable, this.update, this);
  }
  AttrBinding.prototype = {
    update: function(newValue) {
      $(this.node).attr(this.attrName, newValue);
    },
    release: function() {
      this.subscribable.unsubscribe(this.subscription);
    }
  };
  
  ok.binding['attr'] = function(node, attributes, vm) {
    var bindings = [];
    for (var attrName in attributes) {
      bindings.push(new AttrBinding(node, attrName, attributes[attrName]));  
    };
    return bindings;
  };
  
})(ok);