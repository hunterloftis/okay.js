(function(ok) {
  
  function TextValueBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    subscribable.subscribe(this.updateNode, this);
    this.updateNode(subscribable());
    this.bindNode(node);
  }
  TextValueBinding.prototype = {
    bindNode: function(node) {
      this.handler = ok.dom.bind(node, 'keyup', this.updateSubscribable, this);
    },
    updateNode: function(newValue) {
      ok.dom.value(this.node, newValue);
    },
    updateSubscribable: function(event) {
      this.subscribable(ok.dom.value(this.node));  
    },
    release: function() {
      this.subscribable.unsubscribe(this.updateNode);
      ok.dom.unbind(this.node, 'keyup', this.handler);
    }
  };

  function CheckValueBinding(node, subscribable) {
    this.node = node;
    this.subscribable = subscribable;
    subscribable.subscribe(this.updateNode, this);
    this.updateNode(subscribable());
    this.bindNode(node);
  }
  CheckValueBinding.prototype = {
    bindNode: function(node) {
      this.handler = ok.dom.bind(node, 'change', this.updateSubscribable, this);
    },
    updateNode: function(newValue) {
      if (newValue) {
        ok.dom.attribute(this.node, 'checked', true);
      }
      else {
        ok.dom.removeAttribute(this.node, 'checked');
      }
    },
    updateSubscribable: function(event) {
      var val = (ok.dom.is(this.node, ':checked') !== false);
      console.log("UPDATING WITH VALUE " + val);
      console.log("(" + ok.dom.is(this.node, ':checked') + ")");
      this.subscribable(val);
    },
    release: function() {
      ok.dom.unbind(this.node, 'change', this.handler);
    }
  };
  
  var ValueBinding = {
    'text': TextValueBinding,
    'checkbox': CheckValueBinding
  };
  
  ok.binding['value'] = function(node, subscribable) {
    var type = ok.dom.attribute(node, 'type'),
        binder = ValueBinding[type] || ValueBinding['text'];
    return new binder(node, subscribable);
  };
  
})(ok);