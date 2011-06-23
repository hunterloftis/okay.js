(function(ok) {
  
  function ValueBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    subscribable.subscribe(this.updateNode, this);
    this.updateNode(subscribable());
    this.keyup_handler = ok.dom.bind(node, 'keyup', this.updateSubscribable, this);
  }
  ValueBinding.prototype = {
    updateNode: function(newValue) {
      ok.dom.value(this.node, newValue);
    },
    updateSubscribable: function(event) {
      this.subscribable(ok.dom.value(this.node));
    },
    release: function() {
      this.subscribable.unsubscribe(this.updateNode);
      ok.dom.unbind(this.node, 'keyup', this.keyup_handler);
    }
  };
  
  ok.binding.value = function(node, subscribable) {
    return new ValueBinding(node, subscribable);
  };
  
})(ok);