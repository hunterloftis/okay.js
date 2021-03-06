(function(ok) {

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
  
})(ok);