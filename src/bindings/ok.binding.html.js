(function(ok) {
  
  function HtmlBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    subscribable.subscribe(_.bind(this.update, this));
    this.update(subscribable());
  }
  HtmlBinding.prototype = {
    update: function(newValue) {
      ok.dom.html(this.node, newValue);
    }
  };
  
  ok.binding.html = function(node, subscribable) {
    return new HtmlBinding(node, subscribable);
  };
  
})(ok);