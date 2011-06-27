(function(ok) {

  function ClickBinding(node, callback) {
    this.node = node;
    this.callback = callback;
    $(node).bind('click', _.bind(this.activate, this));
  }
  ClickBinding.prototype = {
    activate: function(event) {
      if (!this.callback()) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    release: function() {
      $(node).unbind('click', this.callback);
    }
  };
  
  ok.binding['click'] = function(node, callback) {
    return new ClickBinding(node, callback);
  };
  
})(ok);