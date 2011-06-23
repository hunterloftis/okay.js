(function(ok) {

  // Bases
    
  ok.Base = function() {}
  
  ok.Base.prototype = new ok.Datum({});
  
  ok.base = function(initializer) {
    var base = new ok.Base();
    
    base.write(initializer);
    
    return new Datum.accessor(base);    // needs GET (), SET (val), and .subscribe(fn)
  }

})(ok);