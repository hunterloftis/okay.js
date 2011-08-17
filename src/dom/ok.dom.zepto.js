(function(ok, $) {

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
  
})(window['ok'], window['Zepto']);