$(document).ready(function() {

  module("Bindings");
  
  test("simple bindings", function() {
    
    // View Models
    
    var viewModel = {
      testVisible: ok.base(false)
    };
    viewModel.testHtml = ok.dependent(function() {
      if (this.testVisible()) {
        return 'visible';
      }
      return 'invisible';
    }, viewModel);
    
    strictEqual($('#testVisible').css('display'), 'block', 'no effect to visible before binding');
    strictEqual($('#testHtml').html(), 'html', 'no effect to html before binding');
    
    ok.bind(viewModel);
    
    strictEqual($('#testVisible').css('display'), 'none', 'bind visible to a base value');
    strictEqual($('#testHtml').html(), 'invisible', 'bind html to a dependent value');
    
    console.log("*** Changing visible...");
    viewModel.testVisible(true);
    console.log("*** Changed");
    
    strictEqual($('#testVisible').css('display'), 'block', 'base value binding autoupdates');
    strictEqual($('#testHtml').html(), 'visible', 'dependent value binding autoupdates');
    
    ok.unbind(viewModel);
    viewModel.testVisible(false);
    
    strictEqual($('#testVisible').css('display'), 'block', 'unbind base view model');
    strictEqual($('#testHtml').html(), 'visible', 'unbind dependent view model');
    
  });
  
  /*
  test("simple namespaced bindings", function() {
    strictEqual(obj.dependentTriple(), 3, 'bind visible to a base value');
    strictEqual(obj.dependentTriple(), 6, 'bind text to a dependent value');
  });
  
  test("bindings dependent on collections", function() {
    strictEqual(obj.dependentTriple(), 3, 'bind visible to a base value');
    strictEqual(obj.dependentTriple(), 6, 'bind visible to a dependent value');
    strictEqual(obj.dependentTriple(), 6, 'bind text to a base value');
    strictEqual(obj.dependentTriple(), 6, 'bind text to a dependent value');
  });
  */
  
});