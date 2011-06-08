(function(ok, $) {

  var dom = ok.dom;
  
  dom.nodesWithAttr = function(attr) {
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
  
})(ok, Zepto);