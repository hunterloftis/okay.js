(function(ok) {

  function VisibleBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    subscribable.subscribe(_.bind(this.update, this));
    this.update(subscribable());
  }
  VisibleBinding.prototype = {
    update: function(newValue) {
      console.log("VisibleBinding.update: " + newValue);
      if (newValue) {
        console.log("Showing " + this.node);
        console.dir(this);
        ok.dom.show(this.node);
      }
      else {
        console.log("Hiding");
        ok.dom.hide(this.node);
      }
    }
  };
  
  ok.binding.visible = function(node, subscribable) {
    return new VisibleBinding(node, subscribable);
  };
  
})(ok);