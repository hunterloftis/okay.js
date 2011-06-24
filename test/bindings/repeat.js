$(document).ready(function() {

  module("Binding - Repeat");
  
  test("binding a repeater", function() {
    
    var vm = {
      title: ok.base('The Title'),
      products: ok.collection([])
    };
    
    vm.subtitle = ok.dependent(function() {
      return 'Subtitle for ' + this.title();
    }, vm);
    
    vm.products.push({
      name: ok.base('Product name A'),
      price: ok.base(1)
    });
    
    vm.products.push({
      name: ok.base('Product name B'),
      price: ok.base(5)
    });
    
    ok.bind(vm, 'repeat');
    
    vm.products()[1].name('Updated product name');
    vm.products()[0].price(100);
    
  });
  
});