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

function Figure(spec) {

  var self = this;

  var figureId = 'figure-' + (idCounter++);

  spec = _.extend({}, defaultSpec(spec.type), spec);

  function draw(parent, data) {
    // If no data specified, use the same data as the parent
    data = data || function(data) { return [data]; };

    var sel = parent.selectAll(spec.type + '.' + figureId).data(data, spec.key);

    function doPhase(phase, sel) {
      return sel.each(function(d, i) {
        spec[phase].call(self, d3.select(this), d, i);
      });
    }

    doPhase('update', sel);
    var enter = sel.enter().append(spec.type).classed(figureId, true);
    doPhase('enter', enter);
    doPhase('merge', sel);
    doPhase('exit', sel.exit()).remove();

    spec.children.forEach(function (childGroup) {
      d4.build(childGroup.spec).draw(sel, childGroup.data);
    });
  };

  this.draw = draw;
}

return {
  build: function(spec) { return new Figure(spec); }
};

})();