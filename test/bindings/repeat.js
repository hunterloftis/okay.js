$(document).ready(function() {

  module("Binding - Repeat");
  
  test("binding a repeater", function() {
    
    var vm = {
      products: ok.collection([])
    };
    
    var ul = $('#testRepeat ul');
    
    strictEqual(ul.children().size(), 3, 'Container node has 3 elements before binding');
    
    ok.bind(vm, 'repeat');
    
    strictEqual(ul.children().size(), 0, 'Container node is empty while collection is empty');
    
    vm.products.push({
      name: 'Product name A',
      price: ok.base(1)
    });
    
    strictEqual(ul.children().size(), 1, 'Container successfully updates after first item is added');
    
    vm.products.push({
      name: ok.base('Product name B'),
      price: ok.base(5)
    });
    
    strictEqual(ul.children().size(), 2, 'Container successfully updates after second item is added');
    strictEqual(ul.children().last().find('h3').html(), 'Product name B', 'H3 of second item is accurate');
    strictEqual(ul.children().first().find('span').html(), '1', 'price of first item is accurate');
    
    vm.products()[1].name('Updated product name');
    vm.products()[0].price(100);
    
    strictEqual(ul.children().last().find('h3').html(), 'Updated product name', 'Updated H3 of second item is accurate');
    strictEqual(ul.children().first().find('span').html(), '100', 'updated price of first item is accurate');
    
  });
  
});