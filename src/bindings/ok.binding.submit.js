(function(ok) {

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
  
})(ok);