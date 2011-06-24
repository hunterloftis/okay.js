(function(_) {

  var template = ok.template;
  
  console.log("creating ok.template");
  
  template.render = function(html, object) {
    return _.template(html, object)
  }
  
})(_);