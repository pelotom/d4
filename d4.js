var d4 = (function () {

function shallowCopy(obj) {
  var clone = {};
  for (var p in obj)
    clone[p] = obj[p];
  return clone;
}

function Spec(fields) {
  var self = this;

  function addBuilder(field) {
    self[field] = function() {
      var newFields = shallowCopy(fields);
      newFields[field] = (newFields[field] || []).concat([Array.prototype.slice.call(arguments)]);
      return new Spec(newFields);
    };
  }

  // Add chainable setters for simple fields
  addBuilder('id');
  addBuilder('enter');
  addBuilder('update');
  addBuilder('merge');
  addBuilder('exit');
  addBuilder('children');

  this.fields = function() {
    return fields;
  };
}

function identity(x) { return x; }

function defaultSpec(type) {
  return {
    update: identity,
    merge: identity,
    enter: identity,
    exit: identity,
    children: []
  };
}

function draw(parent, spec, data, path) {

  if (_.isFunction(spec))
    spec = spec();
  spec = _.extend({}, defaultSpec(spec.type), spec);

  // If no data specified, use the same data as the parent
  if (_.isFunction(data)) {
    // allow data functions to be partial, treating undefined as []
    var f = data;
    data = function(d) {
      if (_.isUndefined(d = f(d)))
        return [];
      return d;
    };
  } else
    data = data || function(data) { return [data]; };

  var sel = parent.selectAll(spec.type + '.' + path).data(data, spec.key);

  function doPhase(phase, sel) {
    var resultSels = [];
    sel.each(function(d, i) {
      resultSels.push(spec[phase].call(self, d3.select(this), d, i));
    });
    return resultSels;
  }

  doPhase('update', sel);
  doPhase('enter', sel.enter().append(spec.type).classed(path, true));
  doPhase('merge', sel);
  doPhase('exit', sel.exit()).forEach(function (sel) { sel.remove(); });

  if (!sel.empty()) {
    spec.children.forEach(function (childGroup, childIndex) {
      draw(sel, childGroup.spec, childGroup.data, path + '-' + childIndex)
    });
  }
}

return {
  draw: function(parent, spec, data) { draw(parent, spec, data, 'd4'); },
  spec: function(elemType) {
    return new Spec({
      type: [[elemType]],
      // defaults
      update: [[identity]],
      merge: [[identity]],
      enter: [[identity]],
      exit: [[identity]]
    });
  }
};

})();