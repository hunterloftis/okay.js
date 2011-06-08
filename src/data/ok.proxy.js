(function(ok) {

  // Proxies
  
  ok.Proxy = function(original) {
    this._original = original;
  }
  ok.Proxy.prototype = new ok.Datum({
    calc: function() {
      this._val = this._original();
    }
  });
  
  ok.proxy = function(original) {
    var proxy = new ok.Proxy(original);
    
    proxy.calc();
    
    return proxy.accessor;
  }

})(ok);