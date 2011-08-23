(function(ok) {
  
  function HtmlBinding(node, subscribable, vm, debounce) {
    this.update = debounce ? _(this._update).debounce(0) : this._update;
    this.node = node;
    this.subscribable = subscribable;
    console.dir(subscribable);
    ok.safeSubscribe(subscribable, this.update, this);
  }
  HtmlBinding.prototype = {
    _update: function(newValue) {
      ok.dom.html(this.node, newValue);
    },
    release: function() {
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding['html'] = function(node, subscribable, vm, debounce) {
    return new HtmlBinding(node, subscribable, vm, debounce);
  };
  
  ok.debug.HtmlBinding = HtmlBinding;
  
})(ok);