(function(ok) {

  // Dependents
  
  ok.Dependent = function(func, context) {
    this.calc = func;
    this.context = context;
  }
  ok.Dependent.prototype = new ok.Datum({
    write: function(val) {
      return this._val;
    }
  });
  
  ok.dependent = function(func, context) {  
    var dependent = new ok.Dependent(func, context);
    
    dependent.update_calc();
    
    return dependent.accessor;
  }

})(ok);