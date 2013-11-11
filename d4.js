var d4 = (function () {

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

function Figure(parent, spec, figureId) {

  var self = this;

  if (_.isFunction(spec))
    spec = spec();
  spec = _.extend({}, defaultSpec(spec.type), spec);

  function draw(data) {
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

    var sel = parent.selectAll(spec.type + '.' + figureId).data(data, spec.key);

    function doPhase(phase, sel) {
      var resultSels = [];
      sel.each(function(d, i) {
        resultSels.push(spec[phase].call(self, d3.select(this), d, i));
      });
      return resultSels;
    }

    doPhase('update', sel);
    doPhase('enter', sel.enter().append(spec.type).classed(figureId, true));
    doPhase('merge', sel);
    doPhase('exit', sel.exit()).forEach(function (sel) { sel.remove(); });

    if (!sel.empty()) {
      spec.children.forEach(function (childGroup, childIndex) {
        new Figure(sel, childGroup.spec, figureId + '-' + childIndex).draw(childGroup.data);
      });
    }
  };

  this.draw = draw;
}

return {
  build: function(parent, spec) { return new Figure(parent, spec, 'figure'); }
};

})();