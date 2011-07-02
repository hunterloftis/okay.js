(function(ok, _) {
  
  var utils = ok.utils = {};
  
  utils.toJSON = function toJSON(object) {
    if (typeof(object) === 'function') {
      if (object.__isSubscribable) {
        return toJSON(object());
      }
    }
    else if (typeof(object) === 'object') {
      var obj;
      if (object instanceof Array) obj = [];
      else obj = {};
      for (var key in object) {
        obj[key] = toJSON(object[key]);
      }
      return obj;
    }
    else {
      return object;  // Native types
    }
  }
  
})(ok, _);