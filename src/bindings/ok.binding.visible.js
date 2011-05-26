(function(ok) {

  function VisibleBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    subscribable.subscribe(this.update, this);
    this.update(subscribable());
  }
  VisibleBinding.prototype = {
    update: function(newValue) {
      if (newValue) {
        ok.dom.show(this.node);
      }
      else {
        ok.dom.hide(this.node);
      }
    },
    release: function() {
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding.visible = function(node, subscribable) {
    return new VisibleBinding(node, subscribable);
  };
  
})(ok);