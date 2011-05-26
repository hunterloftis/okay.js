(function(ok) {
  
  function HtmlBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    subscribable.subscribe(this.update, this);
    this.update(subscribable());
  }
  HtmlBinding.prototype = {
    update: function(newValue) {
      ok.dom.html(this.node, newValue);
    },
    release: function() {
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding.html = function(node, subscribable) {
    return new HtmlBinding(node, subscribable);
  };
  
})(ok);