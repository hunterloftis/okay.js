(function(ok) {

  // Collections
  
  ok.Collection = function() {}
  ok.Collection.prototype = new ok.Datum({
    adapt: ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']
  });
  
  ok.collection = function(initializer) {
    var collection = new ok.Collection();
    
    collection.write(initializer);
    
    return collection.accessor;
  }
  
  // Collections
  
  ok.collection = function(initializer) {
    var _array = initializer;
    
    function collection() {
      if (arguments.length > 0) {
        _array = arguments[0];
        return this;
      }
      return _array;
    }
    
    function adapt(method) {
      return function() {
        return _array[method].apply(_array, arguments);
      }
    }
    
    _(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']).each(function(method) {
      collection[method] = adapt(method);
    });
    
    return collection;
  };

})(ok);