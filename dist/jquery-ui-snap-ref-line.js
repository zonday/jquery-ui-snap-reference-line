
/**
@version 1.0.6-dev
*/
      
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('jquery')) :
  typeof define === 'function' && define.amd ? define(['jquery'], factory) :
  (global = global || self, factory(global.jQuery));
}(this, function ($) { 'use strict';

  $ = $ && $.hasOwnProperty('default') ? $['default'] : $;

  var RefLineCanvas = function RefLineCanvas($container, options) {
    if ( options === void 0 ) options = {};

    options = $.extend({
      lineColor: 'red',
      zIndex: 10001,
    }, options);

    this.$container = $container;
    this.$container.css('position', 'relative');
    this.$canvas = $('<canvas class="ui-ref-line-canvas" />');
    this.$canvas.attr({
      width: $container.width(),
      height: $container.height(),
    });
    this.$canvas.css({
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      zIndex: options.zIndex,
      'pointer-events': 'none',
    });
    this.$container.append(this.$canvas);

    this.ctx = this.$canvas[0].getContext('2d');
    this.ctx.strokeStyle = options.lineColor;
  };

  RefLineCanvas.prototype.draw = function draw (lines) {
      var this$1 = this;

    this.ctx.clearRect(0, 0, this.$canvas[0].width, this.$canvas[0].height);
    this.ctx.beginPath();
    lines.forEach(function (line) {
      var start = line[0];
        var end = line[1];
      this$1.ctx.moveTo(start.x, start.y);
      this$1.ctx.lineTo(end.x, end.y);
    });
    this.ctx.stroke();
  };

  RefLineCanvas.prototype.destroy = function destroy () {
    this.$canvas.remove();
  };

  function getMargins($element) {
    return {
      left: (parseInt($element.css('marginLeft'), 10) || 0),
      top: (parseInt($element.css('marginTop'), 10) || 0),
      right: (parseInt($element.css('marginRight'), 10) || 0),
      bottom: (parseInt($element.css('marginBottom'), 10) || 0),
    };
  }

  function toNum(a) {
    return parseInt(a, 10) || 0;
  }

  function includes(array, value) {
    return array.indexOf(value) !== -1;
  }

  var SnapQueue = function SnapQueue() {
    this.queue = {};
  };

  SnapQueue.prototype.push = function push (type, distance, cb) {
      var args = [], len = arguments.length - 3;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 3 ];

    if (!this.queue[type] || this.queue[type].distance > distance) {
      this.queue[type] = {
        distance: distance,
        cb: cb,
        args: args,
      };
    }
  };

  SnapQueue.prototype.execute = function execute () {
      var this$1 = this;

    Object.keys(this.queue).forEach(function (type) {
      var item = this$1.queue[type];
      item.cb.apply(item, item.args);
    });
  };

  var SnapRefManager = function SnapRefManager(elements, snapCallbacks, options) {
    this.elements = elements;
    this.snapCallbacks = snapCallbacks;
    this.options = options;
    this.refElements = [];
  };

  SnapRefManager.prototype.pushRefElement = function pushRefElement (element) {
    if (this.refElements.indexOf(element) !== -1) {
      this.refElements.push(element);
    }
  };

  SnapRefManager.prototype.snap = function snap (ui, source, axis) {
      var this$1 = this;

    this.refElements = [];
    var refLines = [];
    var snapQueue = new SnapQueue();
    this.elements.forEach(function (target) {
      var distanceResult = this$1.calculateDistance(source, target);
      Object.keys(distanceResult).forEach(function (type) {
        var tolerance = this$1.calculateTolerance(distanceResult[type], type, axis);
        Object.keys(tolerance).forEach(function (name) {
          var item = tolerance[name];
          if (item.ref) {
            refLines.push(this$1.makeRefLine(name, source, target));
            this$1.pushRefElement(target);
          }
          if (item.snap && this$1.snapCallbacks[type]) {
            var callback = this$1.snapCallbacks[type][name];
            if (callback) {
              snapQueue.push(("" + type + name), item.distance, function () {
                  var args = [], len = arguments.length;
                  while ( len-- ) args[ len ] = arguments[ len ];

                callback.apply(void 0, [ ui ].concat( args ));
              }, source, target, axis);
            }
          }
        });
      });
    });
    snapQueue.execute();
    return refLines;
  };

  SnapRefManager.prototype.makeRefLine = function makeRefLine (name, source, target) {
    switch (name) {
      case 'vertical':
        return [
          {
            x: Math.min(target.left + target.width / 2, source.left + source.width / 2),
            y: target.top + target.height / 2,
          },
          {
            x: Math.max(target.left + target.width / 2, source.left + source.width / 2),
            y: target.top + target.height / 2,
          } ];
      case 'horizontal':
        return [
          {
            x: target.left + target.width / 2,
            y: Math.min(target.top + target.height / 2, source.top + source.height / 2),
          },
          {
            x: target.left + target.width / 2,
            y: Math.max(target.top + target.height / 2, source.top + source.height / 2),
          } ];
      case 'top':
        return [
          {
            x: Math.min(target.left, source.left),
            y: target.top,
          },
          {
            x: Math.max(target.right, source.right),
            y: target.top,
          } ];
      case 'bottom':
        return [
          {
            x: Math.min(target.left, source.left),
            y: target.bottom,
          },
          {
            x: Math.max(target.right, source.right),
            y: target.bottom,
          } ];
      case 'left':
        return [
          {
            x: target.left,
            y: Math.min(target.top, source.top),
          },
          {
            x: target.left,
            y: Math.max(target.bottom, source.bottom),
          } ];
      case 'right':
      default:
        return [
          {
            x: target.right,
            y: Math.min(target.top, source.top),
          },
          {
            x: target.right,
            y: Math.max(target.bottom, source.bottom),
          } ];
    }
  };

  SnapRefManager.prototype.calculateTolerance = function calculateTolerance (distanceMap, type, axis) {
      var this$1 = this;

    var result = {};
    Object.keys(distanceMap).forEach(function (name) {
      var distance = Math.abs(distanceMap[name]);
      var pass = true;
      if (axis) {
        switch (name) {
          case 'horizontal':
            pass = includes(['nw', 'w', 'sw', 'ne', 'e', 'se'], axis);
            break;
          case 'vertical':
            pass = includes(['nw', 'n', 'ne', 'sw', 's', 'se'], axis);
            break;
          case 'top':
            if (type === 'outer') {
              pass = includes(['sw', 's', 'se'], axis);
            } else if (type === 'inner') {
              pass = includes(['nw', 'n', 'ne'], axis);
            }
            break;
          case 'bottom':
            if (type === 'outer') {
              pass = includes(['nw', 'n', 'ne'], axis);
            } else if (type === 'inner') {
              pass = includes(['sw', 's', 'se'], axis);
            }
            break;
          case 'left':
            if (type === 'outer') {
              pass = includes(['ne', 'e', 'se'], axis);
            } else if (type === 'inner') {
              pass = includes(['nw', 'w', 'sw'], axis);
            }
            break;
          case 'right':
            if (type === 'outer') {
              pass = includes(['nw', 'w', 'sw'], axis);
            } else if (type === 'inner') {
              pass = includes(['ne', 'e', 'se'], axis);
            }
            break;
        }
      }
      result[name] = {
        distance: distance,
        snap: pass && distance <= this$1.options.snapTolerance,
        ref: pass && distance <= this$1.options.snapRefTolerance,
      };
    });
    return result;
  };

  SnapRefManager.prototype.calculateDistance = function calculateDistance (source, target) {
    var result = {};
    result.center = {
      horizontal: (target.left + target.width / 2) - (source.left + source.width / 2), // 居中水平
      vertical: (target.top + target.height / 2) - (source.top + source.height / 2), // 居中垂直
    };

    result.outer = {
      bottom: target.bottom - source.top, // 下
      top: target.top - source.bottom, // 上
      left: target.left - source.right, // 右
      right: target.right - source.left, // 左
    };

    result.inner = {
      top: target.top - source.top, // 上
      bottom: target.bottom - source.bottom, // 下
      left: target.left - source.left, // 左
      right: target.right - source.right, // 右
    };

    return result;
  };

  if ($.ui && $.ui.draggable) {
    $.ui.plugin.add('draggable', 'snapRef', {
      start: function start() {
        var inst = $(this).draggable('instance');
        var inst_options = inst.options; if ( inst_options === void 0 ) inst_options = {};
        var inst_options$1 = inst_options;
        var snapRef = inst_options$1.snapRef;
        var snapRefLineColor = inst_options$1.snapRefLineColor; if ( snapRefLineColor === void 0 ) snapRefLineColor = 'red';
        var snapCanvasZIndex = inst_options$1.snapCanvasZIndex; if ( snapCanvasZIndex === void 0 ) snapCanvasZIndex = 10001;
        var snapRefTolerance = inst_options$1.snapRefTolerance; if ( snapRefTolerance === void 0 ) snapRefTolerance = 30;
        var snapTolerance = inst_options$1.snapTolerance; if ( snapTolerance === void 0 ) snapTolerance = 20;

        inst.refLineCanvas = new RefLineCanvas(this.parent(), {
          lineColor: snapRefLineColor,
          zIndex: snapCanvasZIndex,
        });

        var snapCallbacks = {
          center: {
            vertical: function vertical(ui, s, t) {
              ui.position.top =  t.top - (s.height - t.height) / 2 - s.offset.top;
            },
            horizontal: function horizontal(ui, s, t) {
              ui.position.left = t.left - (s.width - t.width) / 2 - s.offset.left;
            }
          },
          inner: {
            top: function top(ui, s, t) {
              ui.position.top = t.top - s.offset.top ;
            },
            left: function left(ui, s, t) {
              ui.position.left = t.left - s.offset.left;
            },
            right: function right(ui, s, t) {
              ui.position.left = t.right - s.width - s.offset.left;
            },
            bottom: function bottom(ui, s, t) {
              ui.position.top = t.bottom - s.height - s.offset.top;
            },
          },
          outer: {
            top: function top(ui, s, t) {
              ui.position.top = t.top - s.height - s.offset.top;
            },
            left: function left(ui, s, t) {
              ui.position.left = t.left - s.width - s.offset.left;
            },
            right: function right(ui, s, t) {
              ui.position.left = t.right - s.offset.left;
            },
            bottom: function bottom(ui, s, t) {
              ui.position.top = t.bottom - s.offset.top;
            },
          },
        };

        var elements = [];

        $(snapRef.constructor !== String ? (snapRef.items || ':data(ui-draggable)') : snapRef)
          .each(function cb() {
            if (this !== inst.element[0]) {
              var $this = $(this);

              var margins = getMargins($this);
              var top = toNum($this.css('top')) + margins.top;
              var left = toNum($this.css('left')) + margins.left;

              var width = $this.outerWidth();
              var height = $this.outerHeight();

              elements.push({
                item: this,
                width: width,
                height: height,
                top: top,
                left: left,
                bottom: top + height,
                right: left + width,
                offset: {
                  top: margins.top,
                  left: margins.left,
                },
              });
            }
          });

          inst.snapRefManager = new SnapRefManager(elements, snapCallbacks, {
            snapRefTolerance: snapRefTolerance,
            snapTolerance: snapTolerance,
          });
      },

      drag: function drag(event, ui) {
        var inst = $(this).draggable('instance');
        var margins = inst.margins;

        var top = ui.position.top + margins.top;
        var left = ui.position.left + margins.left;
        var width = inst.helperProportions.width;
        var height = inst.helperProportions.height;

        var lines = inst.snapRefManager.snap(ui, {
          top: top,
          left: left,
          width: width,
          height: height,
          right: left + width,
          bottom: top + height,
          offset: {
            left: margins.left,
            top: margins.top,
          },
        });

        inst.refLineCanvas.draw(lines);
      },

      stop: function stop() {
        var inst = $(this).draggable('instance');
        inst.refLineCanvas.destroy();
        delete inst.refLineCanvas;
        delete inst.snapRefManager;
      },
    });
  }

  $.ui.plugin.add('resizable', 'snapRef', {
    start: function start() {
      var inst = $(this).resizable('instance');
      var inst_options = inst.options; if ( inst_options === void 0 ) inst_options = {};
      var inst_options$1 = inst_options;
      var snapRef = inst_options$1.snapRef;
      var snapRefLineColor = inst_options$1.snapRefLineColor; if ( snapRefLineColor === void 0 ) snapRefLineColor = 'red';
      var snapCanvasZIndex = inst_options$1.snapCanvasZIndex; if ( snapCanvasZIndex === void 0 ) snapCanvasZIndex = 10001;
      var snapRefTolerance = inst_options$1.snapRefTolerance; if ( snapRefTolerance === void 0 ) snapRefTolerance = 30;
      var snapTolerance = inst_options$1.snapTolerance; if ( snapTolerance === void 0 ) snapTolerance = 20;

      inst.snapRefElements = [];
      inst.refLineCanvas = new RefLineCanvas(this.parent(), {
        lineColor:  snapRefLineColor,
        zIndex: snapCanvasZIndex,
      });

      inst.margins = getMargins(inst.element);

      var elements = [];

      $(snapRef.constructor !== String ? (snapRef.items || ':data(ui-draggable)') : snapRef)
        .each(function cb() {
          if (this !== inst.element[0]) {
            var $this = $(this);

            var margins = getMargins($this);
            var top = toNum($this.css('top')) + margins.top;
            var left = toNum($this.css('left')) + margins.left;

            var width = $this.outerWidth();
            var height = $this.outerHeight();

            elements.push({
              item: this,
              width: width,
              height: height,
              top: top,
              left: left,
              bottom: top + height,
              right: left + width,
              offset: {
                top: margins.top,
                left: margins.left,
              },
            });
        }
      });

      var snapCallbacks = {
        center: {
          horizontal: function horizontal(ui, s, t, axis) {
            var left = s.left + s.width / 2 < t.left + t.width / 2;
            if (includes(['nw', 'w', 'sw'], axis) && !left) {
              ui.size.width = (s.right - (t.left + t.width / 2)) * 2;
              ui.position.left = s.right - ui.size.width - s.offset.left;
            } else if (includes(['ne', 'e', 'se'], axis) && left) {
              ui.size.width = (t.left + t.width / 2 - s.left) * 2;
            }
          },
          vertical: function vertical(ui, s, t, axis) {
            var above = s.top + s.height / 2 < t.top + t.height / 2;
            if (includes(['sw', 's', 'se'], axis) && above) {
              ui.size.height = (t.top + t.height / 2 - s.top) * 2;
            } else if (includes(['nw', 'n', 'ne'], axis) && !above) {
              ui.size.height = (s.bottom - (t.top + t.height / 2)) * 2;
              ui.position.top = s.bottom - ui.size.height - s.offset.top;
            }
          }
        },
        inner: {
          top: function top(ui, s, t) {
            ui.size.height = s.bottom - t.top;
            ui.position.top = s.bottom - ui.size.height - s.offset.top;
          },
          bottom: function bottom(ui, s, t) {
            ui.size.height = t.bottom - s.top;
          },
          left: function left(ui, s, t) {
            ui.size.width = s.right - t.left;
            ui.position.left = s.right - ui.size.width - s.offset.left;
          },
          right: function right(ui, s, t) {
            ui.size.width = t.right - s.left;
          }
        },
        outer: {
          top: function top(ui, s, t) {
            ui.size.height = t.top - s.top;
          },
          bottom: function bottom(ui, s, t) {
            ui.size.height = s.bottom - t.bottom;
            ui.position.top = s.bottom - ui.size.height - s.offset.top;
          },
          left: function left(ui, s, t) {
            ui.size.width = t.left - s.left;
          },
          right: function right(ui, s, t) {
            ui.size.width = s.right - t.right;
            ui.position.left = s.right - ui.size.width - s.offset.left;
          }
        }
      };

      inst.snapRefManager = new SnapRefManager(elements, snapCallbacks, {
        snapRefTolerance: snapRefTolerance,
        snapTolerance: snapTolerance,
      });
    },

    resize: function resize(event, ui) {
        var inst = $(this).resizable('instance');
        var margins = inst.margins;

        var top = ui.position.top + margins.top;
        var left = ui.position.left + margins.left;
        var width = ui.size.width;
        var height = ui.size.height;

        var lines = inst.snapRefManager.snap(ui, {
          top: top,
          left: left,
          width: width,
          height: height,
          right: left + width,
          bottom: top + height,
          offset: {
            left: margins.left,
            top: margins.top,
          },
        }, inst.axis);

        inst.refLineCanvas.draw(lines);
    },

    stop: function stop() {
      var inst = $(this).resizable('instance');
      inst.refLineCanvas.destroy();
      delete inst.refLineCanvas;
    },
  });

}));
