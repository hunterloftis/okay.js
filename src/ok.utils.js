(function(exports, _) {
  
  var ok = exports.ok;

  var utils = ok.utils = {};

  utils.toJSON = function toJSON(object, level) {
    if (typeof(level) === 'undefined') level = 0;
    level++;
    if (level > 5) return undefined;
    if (typeof(object) === 'function') {
      if (object._isSubscribable) {
        return toJSON(object(), level);
      }
    }
    else if (typeof(object) === 'object') {
      var obj;
      if (object instanceof Array) obj = [];
      else obj = {};
      var i = 0;
      for (var key in object) {
        obj[key] = toJSON(object[key], level);
      }
      return obj;
    }
    else {
      return object;  // Native types
    }
  };
  
})(typeof exports === 'undefined' ? this : exports, _);