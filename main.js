require(['d3', 'd4', 'underscore', 'jquery'], function(d3, d4, _, $) {

var seeds = _.range(3000);
var colors = d3.scale.category20().domain(seeds);
var shapes = seeds.map(function(n) {
  return {
    type: n % 3,
    center: [Math.random() * $(window).width(), Math.random() * $(window).height()],
    size: 3 + Math.random() * 5,
    color: colors(n)
  }
});

var svg = d3.select('body').append('svg')
  .attr('width', $(window).width())
  .attr('height', $(window).height());
var zoom = d3.behavior.zoom();
zoom(svg);

var diagram = svg.draw(chartSpec, [shapes]);

zoom.on('zoom', function() {
  diagram.redraw(false);
});

function chartSpec() {
  var rectSpec = d4('rect')
    .merge(function(rect, d) {
      return rect
        .classed('polymorph', true)
        .attr('x', -d.size)
        .attr('y', -d.size)
        .attr('width', 2 * d.size)
        .attr('height', 2 * d.size)
        ;
    })
    ;

  var circSpec = d4('circle')
    .merge(function(circle, d) {
      return circle
        .classed('polymorph', true)
        .attr('r', d.size)
        ;
    })
    ;

  var triangleSpec = d4('path')
    .merge(function(path, d) {
      return path
        .attr('d', d3.svg.line()
          .x(function(pair){return pair[0];})
          .y(function(pair){return pair[1];})
          .interpolate('linear')([
            [0,-d.size],
            [d.size,d.size],
            [-d.size,d.size]
          ]) + 'Z'
        )
        ;
    })

  var polySpec = d4('g')
    .enter(function(g, d) {
      return g
        .call(d3.behavior.drag()
          .on('dragstart', function() {
            d3.event.sourceEvent.stopPropagation();
          })
          .on('drag', function() {
            d.center = [d3.event.x, d3.event.y];
            g.redraw(false);
          })
        )
        .on('click', function() {
          if (d3.event.defaultPrevented) return;
          d.type = (d.type + 1) % 3;
          g.redraw();
        })
        ;
    })
    .merge(function(g, d, i) {
      return g
        .attr('transform',
          'translate(' + d.center[0] + ',' + d.center[1] + ')'
        )
        .attr('fill', d.color)
        .attr('opacity', 0.5)
        ;
    })
    .child(rectSpec, function(d) { if (d.type === 0) return d; })
    .child(circSpec, function(d) { if (d.type === 1) return d; })
    .child(triangleSpec, function(d) { if (d.type === 2) return d; })
    ;

  var chart = d4('g')
    .merge(function (g) {
      return g
        .attr('transform',
          'translate(' + zoom.translate()[0] + ', ' + zoom.translate()[1] + ') ' +
          'scale(' + zoom.scale() + ')'
        );
    })
    .children(polySpec)
    ;

  return chart;
}

});