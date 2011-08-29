(function(ok) {
  
  function AttrBinding(node, attrName, subscribable) {
    this.node = node;
    this.attrName = attrName;
    this.subscribable = subscribable;
    this.subscription = ok.safeSubscribe(subscribable, this.update, this);
  }
  AttrBinding.prototype = {
    update: function(newValue) {
      $(this.node).attr(this.attrName, newValue);
    },
    release: function() {
      this.subscribable.unsubscribe(this.subscription);
    }
  };
  
  ok.binding['attr'] = function(node, attributes, vm) {
    var bindings = [];
    for (var attrName in attributes) {
      bindings.push(new AttrBinding(node, attrName, attributes[attrName]));  
    };
    return bindings;
  };
  
})(ok);