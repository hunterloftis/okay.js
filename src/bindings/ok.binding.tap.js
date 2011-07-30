(function(ok) {

  function has_touch() {
    return $.os.ios || $.os.android || $.os.webos || $.os.touchpad || $.os.iphone || $.os.ipad || $.os.blackberry;
  }
  
  function TapBinding(node, callback, vm) {
    this.node = node;
    this.callback = callback;
    this.vm = vm;
    
    if (has_touch()) {
      $(node).bind('tap', _.bind(this.activate, this));
      $(node).bind('touchstart', _.bind(this.btn_down, this));
      $(node).bind('touchend', _.bind(this.btn_up, this));
    }
    else {
      $(node).bind('click', _.bind(this.activate, this));
      $(node).bind('mousedown', _.bind(this.btn_down, this));
      $(node).bind('mouseup', _.bind(this.btn_up, this));
    }
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