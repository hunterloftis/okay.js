(function(ok) {

  // Dependents
  
  ok.Dependent = function(func, context) {
    this._func = func;
    this._context = context;
  }
  ok.Dependent.prototype = new ok.Datum({
    write: function(val) {
      return this._val;
    },
    calc: function() {
      this._func.call(this._context);
    }
  });
  
  ok.dependent = function(func, context) {  
    var dependent = new ok.Dependent(func, context);
    
    dependent.calc();
    
    return dependent.accessor;
  }
  
    // Dependents
  
  ok.dependent = function(func, context) {
    var _currentValue;
    
    function dependent() {
      if (_tracking) _track(dependent);
      return _currentValue;
    }

    _makeSubscribable(dependent);
    
    function _update() {    
      var boundDependencies = _update._publishers ? _update._publishers.slice() : [],
          trackedDependencies;
      
      _startTracking(); // Start tracking which bases, collections, and dependents this dependent depends on
      
      _currentValue = func.call(context); // Run the function
      
      trackedDependencies = _stopTracking();  // Stop tracking
      
      var unbindFrom = _(boundDependencies).select(function(dependency) {   // Find expired dependencies
        return !_(trackedDependencies).contains(dependency);
      });
      
      var bindTo = _(trackedDependencies).select(function(dependency) {   // Find new dependencies
        return !_(boundDependencies).contains(dependency);
      });
      
      _(unbindFrom).each(function(subscribable) {   // Unbind expired dependencies
        subscribable.unsubscribe(_update);
      });
    
      _(bindTo).each(function(subscribable) {   // Bind new dependencies
        subscribable.subscribe(_update);
      });
      
      dependent.publish(_currentValue);   // Publish an update for subscribers
    }
    
    _update();
    return dependent;
  }

})(ok);