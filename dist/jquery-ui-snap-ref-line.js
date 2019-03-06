
/**
@version 1.0.3
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

  function makeRefLine(type, ref) {
    var tc = ref.tc;
    var lc = ref.lc;
    var x1c = ref.x1c;
    var y1c = ref.y1c;
    var t = ref.t;
    var b = ref.b;
    var l = ref.l;
    var r = ref.r;
    var x1 = ref.x1;
    var x2 = ref.x2;
    var y1 = ref.y1;
    var y2 = ref.y2;
    var margins = ref.margins;
    var snapMargins = ref.snapMargins;

    switch (type) {
      case 'tcs':
        return [
          {
            x: Math.min(lc, x1c),
            y: tc,
          },
          {
            x: Math.max(lc, x1c),
            y: tc,
          },
          lc - x1c < 0 ? snapMargins : margins ];
      case 'lcs':
        return [
          {
            x: lc,
            y: Math.min(tc, y1c),
          },
          {
            x: lc,
            y: Math.max(tc, y1c),
          },
          tc - y1c < 0 ? snapMargins : margins ];
      case 'ts':
        return [
          {
            x: Math.min(l, x1),
            y: t,
          },
          {
            x: Math.max(r, x2),
            y: t,
          },
          l - x1 < 0 ? snapMargins : margins ];
      case 'bs':
        return [
          {
            x: Math.min(l, x1),
            y: b,
          },
          {
            x: Math.max(r, x2),
            y: b,
          },
          l - x1 < 0 ? snapMargins : margins ];
      case 'ls':
        return [
          {
            x: l,
            y: Math.min(t, y1),
          },
          {
            x: l,
            y: Math.max(b, y2),
          },
          t - y1 < 0 ? snapMargins : margins ];
      case 'rs':
      default:
        return [
          {
            x: r,
            y: Math.min(t, y1),
          },
          {
            x: r,
            y: Math.max(b, y2),
          },
          t - y1 < 0 ? snapMargins : margins ];
    }
  }

  function pushRefLines(lines, conditions, args) {
    Object.keys(conditions).forEach(function (key) {
      if (conditions[key]) {
        lines.push(makeRefLine(key, args));
      }
    });
  }

  function getMargins($element) {
    return {
      left: (parseInt($element.css('marginLeft'), 10) || 0),
      top: (parseInt($element.css('marginTop'), 10) || 0),
      right: (parseInt($element.css('marginRight'), 10) || 0),
      bottom: (parseInt($element.css('marginBottom'), 10) || 0),
    };
  }

  $.ui.plugin.add('draggable', 'snapRef', {
    start: function start(event, ui, inst) {
      var inst_options = inst.options; if ( inst_options === void 0 ) inst_options = {};
      var inst_options$1 = inst_options;
      var snapRef = inst_options$1.snapRef;
      var snapRefLineColor = inst_options$1.snapRefLineColor; if ( snapRefLineColor === void 0 ) snapRefLineColor = 'red';
      var snapCanvasZIndex = inst_options$1.snapCanvasZIndex; if ( snapCanvasZIndex === void 0 ) snapCanvasZIndex = 10001;

      inst.snapRefElements = [];
      inst.refLineCanvas = new RefLineCanvas(this.parent(), {
        lineColor:  snapRefLineColor,
        zIndex: snapCanvasZIndex,
      });

      $(snapRef.constructor !== String ? (snapRef.items || ':data(ui-draggable)') : snapRef)
        .each(function cb() {
          var $this = $(this);
          var offset = $this.offset();
          if (this !== inst.element[0]) {
            inst.snapRefElements.push({
              item: this,
              width: $this.outerWidth(),
              height: $this.outerHeight(),
              top: offset.top,
              left: offset.left,
              margins: getMargins($this),
            });
          }
        });
    },

    drag: function drag(event, ui, inst) {
      var options = inst.options;
      var margins = inst.margins;
      var refD = options.snapRefTolerance; if ( refD === void 0 ) refD = 30;
      var d = options.snapTolerance || 20;
      if (d > refD) {
        d = refD;
      }

      var x1 = ui.offset.left;
      var x2 = x1 + inst.helperProportions.width;
      var y1 = ui.offset.top;
      var y2 = y1 + inst.helperProportions.height;
      var x1c = x1 + Math.round(inst.helperProportions.width / 2);
      var y1c = y1 + Math.round(inst.helperProportions.height / 2);

      var lines = [];
      var snapQueue = new SnapQueue();

      for (var i = inst.snapRefElements.length - 1; i >= 0; i -= 1) {
        var element = inst.snapRefElements[i];
        var l = element.left - margins.left;
        var r = l + element.width;
        var t = element.top - margins.top;
        var b = t + element.height;
        var tc = t + Math.round(element.height / 2);
        var lc = l + Math.round(element.width / 2);

        var snapMargins = element.margins;

        var ts = (void 0);
        var bs = (void 0);
        var ls = (void 0);
        var rs = (void 0);

        var at = (void 0);
        var ab = (void 0);
        var al = (void 0);
        var ar = (void 0);

        var atc = Math.abs(tc - y1c);
        var tcs = atc <= refD;

        var alc = Math.abs(lc - x1c);
        var lcs = alc <= refD;

        var args = (void 0);
        args = {
          tc: tc, lc: lc, x1c: x1c, y1c: y1c, margins: margins, snapMargins: snapMargins,
        };

        pushRefLines(lines, { tcs: tcs, lcs: lcs }, args);

        if (tcs && atc <= d) {
          snapQueue.push('tcs', atc, function (a) {
            ui.position.top = inst._convertPositionTo('relative', {
              top: a - Math.round(inst.helperProportions.height / 2),
              left: 0,
            }).top;
          }, tc);
        }

        if (lcs && alc <= d) {
          snapQueue.push('lcs', alc, function (a) {
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: a - Math.round(inst.helperProportions.width / 2),
            }).left;
          }, lc);
        }

        if (options.snapRefMode !== 'inner') {
          at = Math.abs(t - y2);
          ab = Math.abs(b - y1);
          al = Math.abs(l - x2);
          ar = Math.abs(r - x1);

          ts = at <= refD; // 参考线距离
          bs = ab <= refD;
          ls = al <= refD;
          rs = ar <= refD;

          args = {
            t: t, b: b, l: l, r: r, x1: x1, x2: x2, y1: y1, y2: y2, margins: margins, snapMargins: snapMargins,
          };

          pushRefLines(lines, {
            ts: ts, bs: bs, ls: ls, rs: rs,
          }, args);

          // 小于吸附距离
          if (ts && at <= d) {
            snapQueue.push('ts', at, function (a) {
              ui.position.top = inst._convertPositionTo('relative', {
                top: a - inst.helperProportions.height,
                left: 0,
              }).top;
            }, t);
          }

          if (bs && ab <= d) {
            snapQueue.push('bs', ab, function (a) {
              ui.position.top = inst._convertPositionTo('relative', {
                top: a,
                left: 0,
              }).top;
            }, b);
          }

          if (ls && al <= d) {
            snapQueue.push('ls', al, function (a) {
              ui.position.left = inst._convertPositionTo('relative', {
                top: 0,
                left: a - inst.helperProportions.width,
              }).left;
            }, l);
          }

          if (rs && ar <= d) {
            snapQueue.push('rs', ar, function (a) {
              ui.position.left = inst._convertPositionTo('relative', {
                top: 0,
                left: a,
              }).left;
            }, r);
          }
        }

        if (options.snapRefMode !== 'outer') {
          at = Math.abs(t - y1);
          ab = Math.abs(b - y2);
          al = Math.abs(l - x1);
          ar = Math.abs(r - x2);

          ts = at <= refD;
          bs = ab <= refD;
          ls = al <= refD;
          rs = ar <= refD;

          args = {
            t: t, b: b, l: l, r: r, x1: x1, x2: x2, y1: y1, y2: y2, margins: margins, snapMargins: snapMargins,
          };

          pushRefLines(lines, {
            ts: ts, bs: bs, ls: ls, rs: rs,
          }, args);

          if (ts && at <= d) {
            snapQueue.push('ts2', at, function (a) {
              ui.position.top = inst._convertPositionTo('relative', {
                top: a,
                left: 0,
              }).top;
            }, t);
          }

          if (bs && ab <= d) {
            snapQueue.push('bs2', ab, function (a) {
              ui.position.top = inst._convertPositionTo('relative', {
                top: a - inst.helperProportions.height,
                left: 0,
              }).top;
            }, b);
          }

          if (ls && al <= d) {
            snapQueue.push('ls2', al, function (a) {
              ui.position.left = inst._convertPositionTo('relative', {
                top: 0,
                left: a,
              }).left;
            }, l);
          }

          if (rs && ar <= d) {
            snapQueue.push('rs2', ar, function (a) {
              ui.position.left = inst._convertPositionTo('relative', {
                top: 0,
                left: a - inst.helperProportions.width,
              }).left;
            }, r);
          }
        }
      }

      snapQueue.execute();

      var ref = inst.offset.parent;
      var offsetParentLeft = ref.left;
      var offsetParentTop = ref.top;
      inst.refLineCanvas.draw(lines.map(function (line) {
        var start = line[0];
        var end = line[1];
        var margins_ = line[2];
        return [
          {
            x: start.x + margins_.left - offsetParentLeft,
            y: start.y + margins_.top - offsetParentTop,
          },
          {
            x: end.x + margins_.left - offsetParentLeft,
            y: end.y + margins_.top - offsetParentTop,
          }
        ]
      }));
    },

    stop: function stop(event, ui, inst) {
      inst.refLineCanvas.destroy();
      delete inst.refLineCanvas;
    },
  });

  function includes(array, value) {
    return array.indexOf(value) !== -1;
  }

  $.ui.plugin.add('resizable', 'snapRef', {
    start: function start() {
      var inst = $(this).resizable('instance');
      var inst_options = inst.options; if ( inst_options === void 0 ) inst_options = {};
      var inst_options$1 = inst_options;
      var snapRef = inst_options$1.snapRef;
      var snapRefLineColor = inst_options$1.snapRefLineColor; if ( snapRefLineColor === void 0 ) snapRefLineColor = 'red';
      var snapCanvasZIndex = inst_options$1.snapCanvasZIndex; if ( snapCanvasZIndex === void 0 ) snapCanvasZIndex = 100001;

      inst.snapRefElements = [];
      inst.refLineCanvas = new RefLineCanvas(this.parent(), {
        lineColor:  snapRefLineColor,
        zIndex: snapCanvasZIndex,
      });

      inst.margins = getMargins(inst.element);

      $(snapRef.constructor !== String ? (snapRef.items || ':data(ui-draggable)') : snapRef)
        .each(function cb() {
          var $this = $(this);
          if (this !== inst.element[0]) {
            inst.snapRefElements.push({
              item: this,
              width: $this.outerWidth(),
              height: $this.outerHeight(),
              top: inst._num($this.css('top')),
              left: inst._num($this.css('left')),
              margins: getMargins($this),
            });
          }
        });
    },

    resize: function resize(event, ui) {
      var inst = $(this).resizable('instance');
      var options = inst.options;
      var margins = inst.margins;
      var axis = inst.axis;
      var refD = options.snapRefTolerance; if ( refD === void 0 ) refD = 30;
      var d = options.snapTolerance || 20;

      if (d > refD) {
        d = refD;
      }

      var x1 = ui.position.left;
      var x2 = x1 + ui.size.width;
      var y1 = ui.position.top;
      var y2 = y1 + ui.size.height;
      var x1c = x1 + Math.round(ui.size.width / 2);
      var y1c = y1 + Math.round(ui.size.height / 2);

      var lines = [];
      var snapQueue = new SnapQueue();

      for (var i = inst.snapRefElements.length - 1; i >= 0; i -= 1) {
        var element = inst.snapRefElements[i];
        var l = element.left - margins.left;
        var r = l + element.width;
        var t = element.top - margins.top;
        var b = t + element.height;
        var tc = t + Math.round(element.height / 2);
        var lc = l + Math.round(element.width / 2);

        var snapMargins = element.margins;

        var ts = (void 0);
        var bs = (void 0);
        var ls = (void 0);
        var rs = (void 0);

        var at = (void 0);
        var ab = (void 0);
        var al = (void 0);
        var ar = (void 0);

        var atc = (void 0);
        var alc = (void 0);

        var tcs = (void 0);
        var lcs = (void 0);

        if (includes(['sw', 's', 'se', 'nw', 'n', 'ne'], axis)) {
          atc = Math.abs(tc - y1c);
          tcs = atc <= refD;
        }

        if (includes(['nw', 'w', 'sw', 'ne', 'e', 'se'], axis)) {
          alc = Math.abs(lc - x1c);
          lcs = alc <= refD;
        }

        pushRefLines(lines, { tcs: tcs, lcs: lcs }, {
          tc: tc, lc: lc, x1c: x1c, y1c: y1c, margins: margins, snapMargins: snapMargins,
        });

        if (tcs && atc <= d) {
          // 向下拖动 居中对齐
          if (includes(['sw', 's', 'se'], axis) && tc > y1c) {
            snapQueue.push('tcs', atc, function (a) {
              inst.size.height = (a - y1) * 2;
            }, tc);
          }

          // 向下拖动 居中对齐
          if (includes(['nw', 'n', 'ne'], axis) && tc < y1c) {
            snapQueue.push('tcs', atc, function (a) {
              inst.size.height = (y2 - a) * 2;
              inst.position.top = y2 - inst.size.height;
            }, tc);
          }
        }

        if (lcs && alc <= d) {
          // 向左拖动 居中对齐
          if (includes(['nw', 'w', 'sw'], axis) && lc < x1c) {
            snapQueue.push('lcs', alc, function (a) {
              inst.size.width = (x2 - a) * 2;
              inst.position.left = x2 - inst.size.width;
            }, lc);
          }

          // 向右拖动 居中对齐
          if (includes(['ne', 'e', 'se'], axis) && lc > x1c) {
            snapQueue.push('lcs', alc, function (a) {
              inst.size.width = (a - x1) * 2;
            }, lc);
          }
        }

        if (options.snapRefMode !== 'inner') {
          if (includes(['sw', 's', 'se'], axis)) {
            at = Math.abs(t - y2);
            ts = at <= refD;
          }

          if (includes(['nw', 'n', 'ne'], axis)) {
            ab = Math.abs(b - y1);
            bs = ab <= refD;
          }

          if (includes(['nw', 'w', 'sw'], axis)) {
            ar = Math.abs(r - x1);
            rs = ar <= refD;
          }

          if (includes(['ne', 'e', 'se'], axis)) {
            al = Math.abs(l - x2);
            ls = al <= refD;
          }

          pushRefLines(lines, {
            ts: ts, bs: bs, ls: ls, rs: rs,
          }, {
            t: t, b: b, l: l, r: r, x1: x1, x2: x2, y1: y1, y2: y2, margins: margins, snapMargins: snapMargins,
          });

          // 外部向下贴附
          if (ts && at <= d) {
            snapQueue.push('ts', at, function (a) {
              inst.size.height = a - y1;
            }, t);
          }

          // 外部向上贴附
          if (bs && ab <= d) {
            snapQueue.push('bs', ab, function (a) {
              inst.size.height = y2 - a;
              inst.position.top = y2 - inst.size.height;
            }, b);
          }

          // 外部向右贴附
          if (ls && al <= d) {
            snapQueue.push('ls', al, function (a) {
              inst.size.width = a - x1;
            }, l);
          }

          // 外部向左贴附
          if (rs && ar <= d) {
            snapQueue.push('rs', ar, function (a) {
              inst.size.width = x2 - a;
              inst.position.left = x2 - inst.size.width;
            }, r);
          }
        }

        if (options.snapRefMode !== 'outer') {
          ts = false;
          bs = false;
          ls = false;
          rs = false;

          if (includes(['sw', 's', 'se'], axis)) {
            ab = Math.abs(b - y2);
            bs = ab <= refD;
          }

          if (includes(['nw', 'n', 'ne'], axis)) {
            at = Math.abs(t - y1);
            ts = at <= refD;
          }

          if (includes(['nw', 'w', 'sw'], axis)) {
            al = Math.abs(l - x1);
            ls = al <= refD;
          }

          if (includes(['ne', 'e', 'se'], axis)) {
            ar = Math.abs(r - x2);
            rs = ar <= refD;
          }

          pushRefLines(lines, {
            ts: ts, bs: bs, ls: ls, rs: rs,
          }, {
            t: t, b: b, l: l, r: r, x1: x1, x2: x2, y1: y1, y2: y2, margins: margins, snapMargins: snapMargins,
          });

          // 内部向上贴附
          if (ts && at <= d) {
            snapQueue.push('ts2', at, function (a) {
              inst.size.height = y2 - a;
              inst.position.top = y2 - inst.size.height;
            }, t);
          }

          // 内部向下贴附
          if (bs && ab <= d) {
            snapQueue.push('bs2', ab, function (a) {
              inst.size.height = a - y1;
            }, b);
          }

          // 内部向左贴附
          if (ls && al <= d) {
            snapQueue.push('ls2', ab, function (a) {
              inst.size.width = x2 - a;
              inst.position.left = x2 - inst.size.width;
            }, l);
          }

          // 内部向右贴附
          if (rs && ar <= d) {
            snapQueue.push('rs2', ar, function (a) {
              inst.size.width = a - x1;
            }, r);
          }
        }

        snapQueue.execute();

        inst.refLineCanvas.draw(lines.map(function (line) {
          var start = line[0];
          var end = line[1];
          var margins_ = line[2];
          return [
            {
              x: start.x + margins_.left,
              y: start.y + margins_.top,
            },
            {
              x: end.x + margins_.left,
              y: end.y + margins_.top,
            }
          ]
        }));
      }
    },

    stop: function stop() {
      var inst = $(this).resizable('instance');
      inst.refLineCanvas.destroy();
      delete inst.refLineCanvas;
    },
  });

}));
