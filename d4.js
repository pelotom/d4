// UMD boilerplate
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['d3'], factory);
    } else {
        // Browser globals
        root.d4 = factory(root.d3);
    }
}(this, function (d3) {

var d4; // the module being defined

function identity(x) { return x; }

function constant(x) { return function() { return x; } }

function shallowCopy(obj) {
  var clone = {};
  for (var p in obj)
    clone[p] = obj[p];
  return clone;
}

function isFunction(f) { return typeof f === 'function'; }

function isUndefined(u) { return typeof u === 'undefined'; }

function Spec(elemType, fields) {
  var self = this;

  var addFields;
  if (!fields) {
    fields = {};
    addFields = true;
  } else
    addFields = false;

  function lastSetting(settings) {
    return settings.length === 0 ? undefined : settings[settings.length - 1];
  }

  function addBuilder(field, def, accessor) {
    if (addFields) {
      fields[field] = [];
      if (!isUndefined(def))
        fields[field].push([def]); 
    }
    if (isUndefined(accessor))
      accessor = function(settings) {
        var args = lastSetting(settings);
        return isUndefined(args) ? undefined : args[0];
      };
    self[field] = function() {
      if (arguments.length === 0) // invoked as an accessor
        return accessor(fields[field]);
      var newFields = shallowCopy(fields);
      newFields[field] = newFields[field].concat([Array.prototype.slice.call(arguments)]);
      return new Spec(elemType, newFields);
    };
  }

  // Add chainable setters for simple fields
  addBuilder('elemType', elemType);
  addBuilder('key');
  addBuilder('enter', identity);
  addBuilder('update', identity);
  addBuilder('merge', identity);
  addBuilder('exit', identity);
  addBuilder('children', undefined, identity);

  // A convenience method for building a singleton child group
  self.child = function(childSpec, childData) {
    return self.children(childSpec, childData, true);
  }
}

function render(spec, sel, deep, renderId) {

  function doPhase(phase, sel) {
    var resultSels = [];
    sel.each(function(d, i) {
      resultSels.push(spec[phase]().call(spec, d3.select(this), d, i));
    });
    return resultSels;
  }

  doPhase('update', sel);
  
  var enter = sel.enter().append(spec.elemType())
    .classed(renderId, true)
    .each(function() {
      this['__d4_data__'] = {
        spec: spec,
        renderId: renderId
      };
    })
    ;
  doPhase('enter', enter);

  doPhase('merge', sel);

  var exit = doPhase('exit', sel.exit());
  exit.forEach(function (sel) { sel.remove(); });

  if (deep && !sel.empty())
    renderChildren(spec, sel, renderId);
}

function renderChildren(spec, sel, renderId) {
  return spec.children().map(function (childGroup, childIndex) {
    var childSpec = childGroup[0];
    var childData = childGroup[1];
    var singleton = childGroup.length > 2 ? childGroup[2] : false;

    if (isFunction(childData)) {
      var f = childData;
      childData = function(d) {
        if (isUndefined(d = f(d)))
          // Allow data functions to be partial, treating undefined as []
          return [];
        return singleton ? [d] : d;
      };
    } else if (isUndefined(childData)) {
      // No data specified -- inherit data from the parent
      childData = function(data) { return singleton ? [data] : data; };
    }

    return d4.render(childSpec, sel, childData, renderId + '-' + childIndex);
  });
}

// The module itself is a function for building specs
d4 = function (elemType) {
  return new Spec(elemType);
};

d4.render = function(spec, parentSel, data, renderId) {
  renderId = renderId || 'd4';

  // Force lazy specs
  if (isFunction(spec))
    spec = spec();

  var sel = parentSel.selectAll('.' + renderId).data(data, spec.key());
  render(spec, sel, true, renderId);
  return sel;
};

// Add a render method to d3 selections that allows them to re-render themselves
// based on a previously-assigned spec
d3.selection.prototype.render = function(deep) {
  deep = isUndefined(deep) ? true : deep;

  var nodes = [];
  this.each(function() { nodes.push(this); });
  var sel = d3.selectAll(nodes);
  sel = sel.data(sel.data());

  var d4Data = sel.node()['__d4_data__'];

  render(d4Data.spec, sel, deep, d4Data.renderId);

  return this;
};

return d4;

}));