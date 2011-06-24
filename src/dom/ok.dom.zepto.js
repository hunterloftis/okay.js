(function($) {

  var dom = ok.dom;
  
  var bindings = {};
  
  dom.nodesWithAttr = function(attr, containerNode) {
    if (containerNode) {
      return $(containerNode).find('*[' + attr + ']');
    }
    return $('*[' + attr + ']');
  };
  
  dom.attr = function(node, attr) {
    return $(node).attr(attr);
  }
  
  dom.show = function(node) {
    $(node).show();
  }
  
  dom.hide = function(node) {
    $(node).hide();
  }
  
  dom.text = function(node, value) {
    $(node).html(value);                // Zepto's .text() doesn't work here, check on that
  }

  dom.html = function(node, value) {
    $(node).html(value);
  }
  
  dom.value = function(node, value) {
    return $(node).val(value);
  }
  
  dom.bind = function(node, event, callback, context) {
    var handler = function() {
      callback.call(context);
    }
    $(node).bind(event, handler);
    return handler;
  }
  
  dom.unbind = function(node, event, handler) {
    $(node).unbind(event, handler);
  }
  
})(Zepto);