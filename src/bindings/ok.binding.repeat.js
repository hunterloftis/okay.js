(function(ok) {
  
/**
 *   Binds a DOM node to an Okay.JS collection for template writing
 *
 *   @param {domNode} node
 *   @param {Object} options as { template: templateId, collection: collection }
 */

  function RepeatBinding(node, options, vm) {
    console.log("Collection:");
    console.dir(options.collection());
    
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
          templateHtml = $(this.templateId).html(); //ok.dom.html(this.templateId);
      
      _(array).each(function(item) {
        console.log("rendering item: " + item.name());
        var newNode = $(_.template(templateHtml, item));
        console.dir(item);
        ok.bind(item, null, newNode);
        $(self.node).append(newNode);
      });
      
      //ok.dom.html(this.node, html);
    },
    
    release: function() {
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding.repeat = function(node, subscribable, vm) {
    return new RepeatBinding(node, subscribable, vm);
  };
  
})(ok);