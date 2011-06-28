(function(ok) {
  
  function CssBinding(node, className, subscribable) {
    this.node = node;
    this.className = className;
    this.subscribable = subscribable;
    ok.safeSubscribe(subscribable, this.update, this);
  }
  CssBinding.prototype = {
    update: function(newValue) {
      if (newValue) $(this.node).addClass(this.className);
      else $(this.node).removeClass(this.className);
    },
    release: function() {
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding['css'] = function(node, classes, vm) {
    var bindings = [];
    for (var className in classes) {
      bindings.push(new CssBinding(node, className, classes[className]));  
    };
    return bindings;
  };
  
})(ok);