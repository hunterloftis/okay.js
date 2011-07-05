(function(ok) {

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
  
})(ok);