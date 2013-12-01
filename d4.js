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

  self.draw = function (sel, data, renderId) {
    renderId = renderId || 'd4';

    var sel = sel.selectAll('.' + renderId).data(data, self.key());
    draw(self, sel, renderId);
    return sel;
  };
}

function doPhaseForNode(spec, phase, node, d, i) {
  return spec[phase]().call(spec, d3.select(node), d, i);
}

function draw(spec, sel, renderId) {

  function doPhase(phase, sel) {
    var resultSels = [];
    sel.each(function(d, i) {
      resultSels.push(doPhaseForNode(spec, phase, this, d, i));
    });
    return resultSels;
  }

  doPhase('update', sel);
  
  var enter = sel.enter().append(spec.elemType())
    .classed(renderId, true)
    .each(function(_, i) {
      this['__d4_data__'] = {
        spec: spec,
        renderId: renderId,
        index: i
      };
    })
    ;
  doPhase('enter', enter);

  doPhase('merge', sel);

  var exit = doPhase('exit', sel.exit());
  exit.forEach(function (sel) { sel.remove(); });

  if (!sel.empty())
    drawChildren(spec, sel, renderId);
}

function drawChildren(spec, sel, renderId) {
  spec.children().forEach(function (childGroup, childIndex) {
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

    // Force lazy specs
    if (isFunction(childSpec))
      childSpec = childSpec();

    return childSpec.draw(sel, childData, renderId + '-' + childIndex);
  });
}

// Get all nodes in a selection... annoying that d3 doesn't have this already
d3.selection.prototype.nodes = function() {
  var nodes = [];
  this.each(function() {
    nodes.push(this);
  });
  return nodes;
};

// Redraw all existing nodes in a selection via their spec, using currently-assigned
// data. The `deep` argument determines whether to also redraw descendents. Only the
// `update` and `merge` phases are processed for the nodes in the top-level selection.
// Therefore, it's ok to change the data associated with a selection before calling
// `redraw`, but one should not change the cardinality of the data. If children are
// redrawn as well, all phases are processed for them.
d3.selection.prototype.redraw = function(deep) {
  deep = isUndefined(deep) ? true : deep;

  this.each(function() {
    var self = this;
    var d4Data = self['__d4_data__'];
    ['update', 'merge'].forEach(function(phase) {
      doPhaseForNode(d4Data.spec, phase, self, self['__data__'], d4Data.index);
    });
    if (deep)
      drawChildren(d4Data.spec, d3.selectAll([this]), d4Data.renderId);
  });

  return this;
};

// The module itself is a function for building specs
return function (elemType) {
  return new Spec(elemType);
};

}));