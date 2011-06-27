(function(ok, _) {

  var template = ok['template'];
    
  template.render = function(html, object) {
    return _.template(html, object)
  }
  
})(window['ok'], window['_']);