var d4 = (function () {

function copy(obj) {
  var clone = {};
  for (var p in obj)
    clone[p] = obj[p];
  return clone;
}

function Figure(fields) {

  var self = this;

  function addBuilder(field, multiArg, append) {
    if (arguments.length < 2)
      multiArg = false;
    if (arguments.length < 3)
      append = false;

    self[field] = function(value) {
      if (arguments.length === 0)
        return fields[field];

      var newFields = copy(fields);
      if (value === undefined)
        delete newFields[field];
      else {
        var newVal = multiArg ? Array.prototype.slice.call(arguments) : value;
        if (append) {
          if (!(field in newFields))
            newFields[field] = [];
          newFields[field].push(newVal);
        } else
          newFields[field] = newVal;
      }

      return new Figure(newFields);
    };
  }

  // Add chainable setters for simple fields
  addBuilder('id');
  addBuilder('enter');
  addBuilder('update');
  addBuilder('merge');
  addBuilder('exit');
  addBuilder('children', true, true);

  self.fields = function() {
    return copy(fields);
  };
}


return {
  figure: function(elemType) { return new Figure({'elemType': elemType}); }
};

})();