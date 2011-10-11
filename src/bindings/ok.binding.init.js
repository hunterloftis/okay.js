(function(ok) {

  function InitBinding(node, callback, vm) {
    this.node = node;
    this.callback = callback;
    this.vm = vm;
    this.activate();
  }
  InitBinding.prototype = {
    activate: function() {
      this.callback(this.node);
    },
    release: function() {
      
    }
  };
  
  ok.binding.init = function(node, callback, vm) {
    return new InitBinding(node, callback, vm);
  };
  
})(ok);