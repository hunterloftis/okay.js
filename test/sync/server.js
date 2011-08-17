/*

Writing an Okay.sync system (for client-server sync)
using a plan of our node knockout game object model to see what using it will look like...


** Dependent (ok.dependent)

User
  name
  client_id

Path
  tiles[]:Tile
  progress:Number
  current_tile:Dependent:Tile
  
Game
  map:Map
    tiles[]:Tile
      type:String
  players[]:Player
    user:User
    path:Path
  items[]:Item
    type:String
    attachment:Tile|Player
    
  
*/

var UserModel, PathModel, GameModel

UserModel = ok.Model.extend({
  defaults: {
    name: 'Unnamed',
    client_id: undefined
  }
});

PathModel = ok.Model.extend({
  defaults: {
    tiles: [],
    
  }
});

/*
 
 Well shit, hold on - what's really special about Knockout?

 It certainly isn't the ability to listen to change events on model properties.
 In fact, all model properties being implemented as their own function can be limiting for flexibility
 (you can't listen to the whole Model for any change, there's no way for the Model object to know if you create a new property on the fly that wasn't in the schema)
 (but with .set() on Backbone, the Model always knows when you're adding properties... ditto with .unset() for deleting...)
 So anyway, what do I love about KO? What makes my work faster & more enjoyable?
 
  Dependency tracking & UI Binding
  
  Can I add dependency tracking & UI Binding to Backbone?
  I think so.
  Is it simpler to add dependency tracking & UI Binding to Backbone than to add smart Models & fetch/save etc to KO?
  Probably.
  
  Knockback?
  Backout?

  What would this look like?
  
*/

var UserModel = Backbone.Model.extend({
  defaults: {
    'first_name': 'First',
    'last_name': 'Last',
    'full_name': new Backbone.Dependent(function() {
      var fname = this.get('first_name'),
          lname = this.get('last_name');
      return fname + ' ' + lname;
    })
  }
});

// Or would this be better?

var UserModel = Backbone.Model.extend({
  defaults: {
    'first_name': 'First',
    'last_name': 'Last'
  },
  dependents: {
    'full_name': function() {
      var fname = this.get('first_name'),
          lname = this.get('last_name');
      return fname + ' ' + lname;
    }
  }
});

var user = new UserModel({
  first_name: 'Bill',
  last_name: 'Smith'
});

user.bind("change:full_name", function(model, name) {
  alert("Changed name from " + this.previous('full_name') + " to " + name);
}, user);

user.set({first_name : 'Hunter'});
user.set({last_name : 'Loftis'});

// Ok but what about View Models? They save tons of time and allow a nice separation of work...

var UserViewModel = Backbone.ViewModel.extend({
  proxy: ['first_name', 'last_name', 'full_name']
});

// Or this?

var UserViewModel = Backbone.ViewModel.extend({
  proxies: {
    first_name: 'first_name',
    last_name: 'last_name',
    full_name: 'full_name'
  }
});

// ViewModel would have 'utility' methods just like Model,
// for example .save() would copy data from the proxies into referenced model

var userVM = new UserViewModel({
  model: user
});

// <form data-bind-user='submit: save' />
// <input data-bind-user='value: first_name' />
// <input data-bind-user='value: last_name' />
// <span data-bind-user='text: full_name'></span>

Backbone.bindView(userVM, 'user')