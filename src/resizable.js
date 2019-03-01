import $ from 'jquery';

import { pushRefLines, getMargins, queueSnap } from './helpers';

function includes(array, value) {
  return array.indexOf(value) !== -1;
}

$.ui.plugin.add('resizable', 'snapRef', {
  start() {
    const inst = $(this).resizable('instance');
    const { options: { snapRef, snapRefLineColor = 'red' } = {} } = inst;
    if (!snapRef) {
      return;
    }

    inst.snapRefElements = [];
    const $parent = this.parent();
    const $canvas = $('<canvas />').attr({
      width: $parent.width(),
      height: $parent.height(),
    }).css({
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 10001,
      'pointer-events': 'none',
    });

    [inst.canvas] = $canvas;
    $parent.append(inst.canvas);

    const ctx = inst.canvas.getContext('2d');

    inst.refLineContext = ctx;
    ctx.strokeStyle = snapRefLineColor;

    inst.margins = getMargins(inst.element);
    inst.helperProportions = {
      width: inst.element.outerWidth(),
      height: inst.element.outerHeight(),
    };

    $(snapRef.constructor !== String ? (snapRef.items || ':data(ui-draggable)') : snapRef)
      .each(function cb() {
        const $this = $(this);
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

  resize(event, ui) {
    const inst = $(this).resizable('instance');
    const { options, margins, axis } = inst;
    const { snapRefTolerance: refD = 30 } = options;
    let d = options.snapTolerance || 20;

    if (d > refD) {
      d = refD;
    }

    const x1 = ui.position.left;
    const x2 = x1 + ui.size.width;
    const y1 = ui.position.top;
    const y2 = y1 + ui.size.height;
    const x1c = x1 + Math.round(ui.size.width / 2);
    const y1c = y1 + Math.round(ui.size.height / 2);

    const lines = [];
    const changeQueue = [];

    for (let i = inst.snapRefElements.length - 1; i >= 0; i -= 1) {
      const element = inst.snapRefElements[i];
      const l = element.left - margins.left;
      const r = l + element.width;
      const t = element.top - margins.top;
      const b = t + element.height;
      const tc = t + Math.round(element.height / 2);
      const lc = l + Math.round(element.width / 2);

      const snapMargins = element.margins;

      let ts;
      let bs;
      let ls;
      let rs;

      let at;
      let ab;
      let al;
      let ar;

      let atc;
      let alc;

      let tcs;
      let lcs;

      if (includes(['sw', 's', 'se', 'nw', 'n', 'ne'], axis)) {
        atc = Math.abs(tc - y1c);
        tcs = atc <= refD;
      }

      if (includes(['nw', 'w', 'sw', 'ne', 'e', 'se'], axis)) {
        alc = Math.abs(lc - x1c);
        lcs = alc <= refD;
      }

      pushRefLines(lines, { tcs, lcs }, {
        tc, lc, x1c, y1c, margins, snapMargins,
      });

      if (tcs && atc <= d) {
        // 向下拖动 居中对齐
        if (includes(['sw', 's', 'se'], axis) && tc > y1c) {
          queueSnap(changeQueue, 'tcs', atc, (a) => {
            inst.size.height = (a - y1) * 2;
          }, tc);
        }

        // 向下拖动 居中对齐
        if (includes(['nw', 'n', 'ne'], axis) && tc < y1c) {
          queueSnap(changeQueue, 'tcs', atc, (a) => {
            inst.size.height = (y2 - a) * 2;
            inst.position.top = y2 - inst.size.height;
          }, tc);
        }
      }

      if (lcs && alc <= d) {
        // 向左拖动 居中对齐
        if (includes(['nw', 'w', 'sw'], axis) && lc < x1c) {
          queueSnap(changeQueue, 'lcs', alc, (a) => {
            inst.size.width = (x2 - a) * 2;
            inst.position.left = x2 - inst.size.width;
          }, lc);
        }

        // 向右拖动 居中对齐
        if (includes(['ne', 'e', 'se'], axis) && lc > x1c) {
          queueSnap(changeQueue, 'lcs', alc, (a) => {
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
          ts, bs, ls, rs,
        }, {
          t, b, l, r, x1, x2, y1, y2, margins, snapMargins,
        });

        // 外部向下贴附
        if (ts && at <= d) {
          queueSnap(changeQueue, 'ts', at, (a) => {
            inst.size.height = a - y1;
          }, t);
        }

        // 外部向上贴附
        if (bs && ab <= d) {
          queueSnap(changeQueue, 'bs', ab, (a) => {
            inst.size.height = y2 - a;
            inst.position.top = y2 - inst.size.height;
          }, b);
        }

        // 外部向右贴附
        if (ls && al <= d) {
          queueSnap(changeQueue, 'ls', al, (a) => {
            inst.size.width = a - x1;
          }, l);
        }

        // 外部向左贴附
        if (rs && ar <= d) {
          queueSnap(changeQueue, 'rs', al, (a) => {
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
          ts, bs, ls, rs,
        }, {
          t, b, l, r, x1, x2, y1, y2, margins, snapMargins,
        });

        // 内部向上贴附
        if (ts && at <= d) {
          queueSnap(changeQueue, 'ts2', at, (a) => {
            inst.size.height = y2 - a;
            inst.position.top = y2 - inst.size.height;
          }, t);
        }

        // 内部向下贴附
        if (bs && ab <= d) {
          queueSnap(changeQueue, 'bs2', ab, (a) => {
            inst.size.height = a - y1;
          }, b);
        }

        // 内部向左贴附
        if (ls && al <= d) {
          queueSnap(changeQueue, 'ls2', ab, (a) => {
            inst.size.width = x2 - a;
            inst.position.left = x2 - inst.size.width;
          }, l);
        }

        // 内部向右贴附
        if (rs && ar <= d) {
          queueSnap(changeQueue, 'rs2', ab, (a) => {
            inst.size.width = a - x1;
          }, r);
        }
      }

      Object.keys(changeQueue).forEach((key) => {
        const item = changeQueue[key];
        item.cb(...item.args);
      });

      const ctx = inst.refLineContext;
      ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);
      ctx.beginPath();

      lines.forEach((line) => {
        const [start, end, margins_] = line;
        ctx.moveTo(
          start.x + margins_.left,
          start.y + margins_.top
        );
        ctx.lineTo(
          end.x + margins_.left,
          end.y + margins_.top
        );
      });
      ctx.stroke();
    }
  },

  stop() {
    const inst = $(this).resizable('instance');
    delete inst.refLineContext;
    $(inst.canvas).remove();
    delete inst.canvas;
  },
});
