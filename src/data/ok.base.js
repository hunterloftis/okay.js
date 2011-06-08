(function(ok) {

  // Bases
    
  ok.Base = function() {}
  ok.Base.prototype = new ok.Datum({});
  
  ok.base = function(initializer) {
    var base = new ok.Base();
    
    base.write(initializer);
    
    return base.accessor;
  }
  
  // Bases
  
  ok.base = function(initializer) {
    var _currentValue = initializer;
    
    function base() {
      if (arguments.length > 0) {
        // Is the value actually new?
        if (_currentValue !== arguments[0]) {
          _currentValue = arguments[0];
          base.publish(_currentValue);
        }
        return this;
      }
      if (_tracking) _track(base);
      return _currentValue;
    }
    _makeSubscribable(base);
    return base;
  };

})(ok);