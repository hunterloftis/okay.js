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
    
    this._items = [];   // {node: domNode, data: array element}
    
    ok.dom.html(this.node, '');
    ok.safeSubscribe(this.subscribable, this.update, this);
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
      
      var current_data_array = _(this._items).pluck('data'),
          current_item,
          new_node,
          new_items = [];
      
      // Loop through 'array' (the data)
      _(array).each(function(data_item, index) {
        if (self._items.length > index) {
          // There's an existing list of bound DOM nodes to compare against
          
          current_item = self._items[index];
          
          if (current_item.data === data_item) {
            // Data item at 'index' is in sync, leave it alone
            new_items.push(current_item);
          }
          else {
            // Currently displayed data is out of sync with viewmodel data; needs update
            
            var data_in_node = _(current_data_array).indexOf(data_item);
            if (data_in_node >= 0) {
              // The data has already been rendered onto a DOM Node, it's just out of order
              ok.dom.before(current_item.node, self._items[data_in_node].node);
              new_items.push(self._items[data_in_node]);
            }
            else {
              
              // This is a new node that needs to be created and inserted at [index]
              new_node = ok.dom.createNode(ok.template.render(templateHtml, data_item));
              ok.bind(data_item, null, new_node);
              ok.dom.before(current_item.node, new_node);
              new_items.push({data: data_item, node: new_node});
            }
          }
        }
        else {
          
          // We've exhausted our list of existing, bound items so we just need to start adding at the end
          new_node = ok.dom.createNode(ok.template.render(templateHtml, data_item));
          ok.bind(data_item, null, new_node);
          ok.dom.append(self.node, new_node);
          new_items.push({data: data_item, node: new_node});
        }
      });
      
      // Delete any bound DOM items that don't correspond to a current data item
      var to_delete = [];
      _(this._items).each(function(item) {
        if (!_(array).contains(item.data)) {
          to_delete.push(item);
        }
      });
      _(to_delete).each(function(item_to_delete) {
        ok.dom.remove(item_to_delete.node);
      });
      
      this._items = new_items;
    },
    
    release: function() {
      this.subscribable.unsubscribe(this.update);
    }
  };
  
  ok.binding.repeat = function(node, subscribable, vm) {
    return new RepeatBinding(node, subscribable, vm);
  };
  
})(ok);