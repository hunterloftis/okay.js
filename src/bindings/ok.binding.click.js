(function(ok) {

  function ClickBinding(node, callback) {
    this.node = node;
    this.callback = callback;
    $(node).bind('click', this.activate)
  }
  ClickBinding.prototype = {
    activate: function(event) {
      if (!this.callback()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  };
  
  ok.binding.click = function(node, callback) {
    return new ClickBinding(node, callback);
  };
  
})(ok);