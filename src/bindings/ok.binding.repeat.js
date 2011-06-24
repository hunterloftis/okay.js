(function(ok) {
  
/**
 *   Binds a DOM node to an Okay.JS collection for template writing
 *
 *   @param {domNode} node
 *   @param {Object} options as { template: templateId, collection: collection }
 */

  function RepeatBinding(node, options, vm) {
    
    this.node = node;
    this.templateId = '#' + options.template;
    this.subscribable = options.collection;
    
    this.subscribable.subscribe(this.update, this);
    this.update(this.subscribable());
  }
  
  RepeatBinding.prototype = {

/**
 *    Update the DOM node whenever the subscribable publishes a value change
 *
 *    @param {any} newValue the new value of the subscribable
 */
    update: function(array) {
      var self = this,
          html = '',
          templateHtml = ok.dom.html(this.templateId);
      
      // For now, clear everything and refresh the whole repeater every time the collection changes
      // TODO: Add/remove repeated nodes intelligently
      ok.dom.html(self.node, '');
      
      _(array).each(function(item) {
        var newNode = ok.dom.createNode(_.template(templateHtml, item));
        ok.bind(item, null, newNode);
        ok.dom.append(self.node, newNode);
      });
    },
    
    release: function() {
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding.repeat = function(node, subscribable, vm) {
    return new RepeatBinding(node, subscribable, vm);
  };
  
})(ok);