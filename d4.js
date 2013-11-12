var d4 = (function () {

function identity(x) { return x; }

function shallowCopy(obj) {
  var clone = {};
  for (var p in obj)
    clone[p] = obj[p];
  return clone;
}

function isFunction(f) { return typeof f === 'function'; }

function isUndefined(u) { return typeof u === 'undefined;'; }

function Spec(elemType, fields) {
  var self = this;

  var addFields;
  if (!fields) {
    fields = {};
    addFields = true;
  } else
    addFields = false;

  function addBuilder(field, def) {
    if (addFields) {
      fields[field] = [];
      if (arguments.length > 1)
        fields[field].push([def]); 
    }
    self[field] = function() {
      var newFields = shallowCopy(fields);
      newFields[field] = newFields[field].concat([Array.prototype.slice.call(arguments)]);
      return new Spec(elemType, newFields);
    };
  }

  function lastSetting(field) {
    var settings = fields[field];
    return settings.length === 0 ? undefined : settings[settings.length - 1][0];
  }

  // Add chainable setters for simple fields
  addBuilder('key');
  addBuilder('enter', identity);
  addBuilder('update', identity);
  addBuilder('merge', identity);
  addBuilder('exit', identity);
  addBuilder('children');

  function render(parent, data, path) {

    // If no data specified, use the same data as the parent
    if (isFunction(data)) {
      // allow data functions to be partial, treating undefined as []
      var f = data;
      data = function(d) {
        if (isUndefined(d = f(d)))
          return [];
        return d;
      };
    } else
      data = data || function(data) { return [data]; };

    var sel = parent.selectAll(elemType + '.' + path).data(data, lastSetting('key'));

    function doPhase(phase, sel) {
      var resultSels = [];
      sel.each(function(d, i) {
        resultSels.push(lastSetting(phase).call(self, d3.select(this), d, i));
      });
      return resultSels;
    }

    doPhase('update', sel);
    doPhase('enter', sel.enter().append(elemType).classed(path, true));
    doPhase('merge', sel);
    doPhase('exit', sel.exit()).forEach(function (sel) { sel.remove(); });

    if (!sel.empty()) {
      fields['children'].forEach(function (childGroup, childIndex) {
        var childSpec = childGroup[0];
        var childData = childGroup[1];
        
        if (isFunction(childSpec))
          // force lazy specs here
          childSpec = childSpec();

        childSpec.render(sel, childData, path + '-' + childIndex)
      });
    }
  }

  this.render = function(parent, data, path) {
    render(parent, data, path || 'd4');
  };
}

return {
  spec: function(elemType) { return new Spec(elemType); }
};

})();