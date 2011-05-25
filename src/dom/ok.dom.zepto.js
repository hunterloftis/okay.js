(function($) {

  window.ok = window.ok || {};

  var dom = ok.dom = {};
  
  dom.nodesWithAttr = function(attr) {
    return $('*[data-bind]');
  };
  
  dom.attr = function(node, attr) {
    return $(node).attr(attr);
  }

})(Zepto);