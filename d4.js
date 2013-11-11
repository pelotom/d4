var d4 = (function () {

function noop(){}

function defaultSpec(type) {
  return {
    update: noop,
    merge: noop,
    enter: noop,
    exit: noop,
    children: []
  };
}

var idCounter = 0;

function Figure(parent, spec) {

  var self = this;

  var figureId = 'figure-' + (idCounter++);

  if (_.isFunction(spec))
    spec = spec();
  spec = _.extend({}, defaultSpec(spec.type), spec);

  function draw(data) {
    // If no data specified, use the same data as the parent
    data = data || function(data) { return [data]; };

    var sel = parent.selectAll(spec.type + '.' + figureId).data(data, spec.key);

    function doPhase(phase, sel) {
      return sel.each(function(d, i) {
        spec[phase].call(self, d3.select(this), d, i);
      });
    }

    doPhase('update', sel);
    doPhase('enter', sel.enter().append(spec.type).classed(figureId, true));
    doPhase('merge', sel);
    doPhase('exit', sel.exit()).remove();

    if (!sel.empty()) {
      spec.children.forEach(function (childGroup) {
        d4.build(sel, childGroup.spec).draw(childGroup.data);
      });
    }
  };

  this.draw = draw;
}

return {
  build: function(parent, spec) { return new Figure(parent, spec); }
};

})();