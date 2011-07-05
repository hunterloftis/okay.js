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
  
  // Dependents
  
  ok['dependent'] = function(func, context) {
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
      
      // TODO: Make this configurable (so you can turn off live dependecy tracking)
      //      That would increase the speed of dependents (esp. for mobile)
      
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
        var binding = ok.binding[type](node, subscribable, viewModel);
        if (binding instanceof Array) {
          allBindings.concat(binding)
        }
        else {
          allBindings.push(binding);
        }
      });
    });
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
    if (mystery.subscribe) {
      mystery.subscribe(fn, context);
      fn.call(context, mystery());
      return;
    }
    fn.call(context, mystery);    // Just send value straightaway
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
    if (containerNode) {
      return $(containerNode).find('*[' + attr + ']');
    }
    return $('*[' + attr + ']');
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
  
})(window['ok'], window['Zepto']);(function(ok, _) {

  var template = ok['template'];
    
  template.render = function(html, object) {
    return _.template(html, object)
  }
  
})(window['ok'], window['_']);(function(ok) {

  function VisibleBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    ok.safeSubscribe(subscribable, this.update, this);
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
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding['visible'] = function(node, subscribable) {
    return new VisibleBinding(node, subscribable);
  };
  
})(ok);(function(ok) {
  
  function HtmlBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    ok.safeSubscribe(subscribable, this.update, this);
  }
  HtmlBinding.prototype = {
    update: function(newValue) {
      ok.dom.html(this.node, newValue);
    },
    release: function() {
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding['html'] = function(node, subscribable) {
    return new HtmlBinding(node, subscribable);
  };
  
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

  function TapBinding(node, callback, vm) {
    this.node = node;
    this.callback = callback;
    this.vm = vm;
    $(node).bind('tap', _.bind(this.activate, this));
    $(node).bind('touchstart', _.bind(this.btn_down, this));
    $(node).bind('touchend', _.bind(this.btn_up, this));
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
  
  function ValueBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    subscribable.subscribe(this.updateNode, this);
    this.updateNode(subscribable());
    this.keyup_handler = ok.dom.bind(node, 'keyup', this.updateSubscribable, this);
  }
  ValueBinding.prototype = {
    updateNode: function(newValue) {
      ok.dom.value(this.node, newValue);
    },
    updateSubscribable: function(event) {
      this.subscribable(ok.dom.value(this.node));
    },
    release: function() {
      this.subscribable.unsubscribe(this.updateNode);
      ok.dom.unbind(this.node, 'keyup', this.keyup_handler);
    }
  };
  
  ok.binding['value'] = function(node, subscribable) {
    return new ValueBinding(node, subscribable);
  };
  
})(ok);(function(ok) {
  
/**
 *   Binds a DOM node to an Okay.JS collection for template writing
 *
 *   @param {domNode} node
 *   @param {Object} options as { template: templateId, collection: collection }
 */

  function RepeatBinding(node, options, vm) {
    
    this.node = node;
    this.templateId = '#' + options.template;
    this.subscribable = options.collection;
    
    this._items = [];   // {node: domNode, data: array element}
    
    ok.dom.html(this.node, '');
    ok.safeSubscribe(this.subscribable, this.update, this);
  }
  
  RepeatBinding.prototype = {

/**
 *    Update the DOM node whenever the subscribable publishes a value change
 *
 *    @param {any} newValue the new value of the subscribable
 */
    update: function(array) {
            
      var self = this,
          html = '',
          templateHtml = ok.dom.html(this.templateId);
      
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
              new_node = ok.dom.createNode(ok.template.render(templateHtml, data_item));
              ok.bind(data_item, null, new_node);
              ok.dom.before(current_item.node, new_node);
              new_items.push({data: data_item, node: new_node});
            }
          }
        }
        else {
          
          // We've exhausted our list of existing, bound items so we just need to start adding at the end
          new_node = ok.dom.createNode(ok.template.render(templateHtml, data_item));
          ok.bind(data_item, null, new_node);
          ok.dom.append(self.node, new_node);
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
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding['repeat'] = function(node, subscribable, vm) {
    return new RepeatBinding(node, subscribable, vm);
  };
  
})(ok);(function(ok) {
  
  function CssBinding(node, className, subscribable) {
    this.node = node;
    this.className = className;
    this.subscribable = subscribable;
    ok.safeSubscribe(subscribable, this.update, this);
  }
  CssBinding.prototype = {
    update: function(newValue) {
      if (newValue) $(this.node).addClass(this.className);
      else $(this.node).removeClass(this.className);
    },
    release: function() {
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding['css'] = function(node, classes, vm) {
    var bindings = [];
    for (var className in classes) {
      bindings.push(new CssBinding(node, className, classes[className]));  
    };
    return bindings;
  };
  
})(ok);