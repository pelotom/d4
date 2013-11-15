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

  // A convenience method for building a singleton child group
  self.child = function(childSpec, childData) {
    return self.children(childSpec, childData, true);
  }

  function render(sel, deep, renderId) {

    function doPhase(phase, sel) {
      var resultSels = [];
      sel.each(function(d, i) {
        resultSels.push(lastSetting(phase).call(self, d3.select(this), d, i));
      });
      return resultSels;
    }

    doPhase('update', sel);
    
    var enter = sel.enter().append(elemType)
      .classed(renderId, true)
      .each(function() {
        this['__d4_data__'] = {
          spec: self,
          renderId: renderId
        };
      })
      ;
    doPhase('enter', enter);

    doPhase('merge', sel);

    var exit = doPhase('exit', sel.exit());
    exit.forEach(function (sel) { sel.remove(); });

    if (deep && !sel.empty())
      renderChildren(sel, renderId);
  }

  function renderChildren(sel, renderId) {
    fields['children'].forEach(function (childGroup, childIndex) {
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
      
      if (isFunction(childSpec))
        // Force lazy specs here
        childSpec = childSpec();

      childSpec.render(sel, childData, renderId + '-' + childIndex)
    });
  }

  this.rerender = render;

  this.render = function(parent, data, renderId) {
    renderId = renderId || 'd4';
    var sel = parent.selectAll('.' + renderId).data(data, lastSetting('key'));
    render(sel, true, renderId);
  };
}

d3.selection.prototype.render = function(deep) {
  deep = isUndefined(deep) ? true : deep;

  var nodes = [];
  this.each(function() { nodes.push(this); });
  var sel = d3.selectAll(nodes);
  sel = sel.data(sel.data());

  var d4Data = sel.node()['__d4_data__'];

  d4Data.spec.rerender(sel, deep, d4Data.renderId);
};

return function(elemType) {
  return new Spec(elemType);
};

}));