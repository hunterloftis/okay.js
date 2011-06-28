(function(ok) {

  function TapBinding(node, callback, vm) {
    this.node = node;
    this.callback = callback;
    this.vm = vm;
    $(node).bind('touchstart click', _.bind(this.activate, this));
  }
  TapBinding.prototype = {
    activate: function(event) {
      if (!this.callback.call(this.vm, [event])) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    release: function() {
      $(node).unbind('touchstart click', this.callback);
    }
  };
  
  ok.binding['tap'] = function(node, callback, vm) {
    return new TapBinding(node, callback, vm);
  };
  
})(ok);