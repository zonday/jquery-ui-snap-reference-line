import $ from 'jquery';

import { pushRefLines, getMargins, queueSnap } from './helpers';

$.ui.plugin.add('draggable', 'snapRef', {
  start(event, ui, inst) {
    const { options: { snapRef, snapRefLineColor = 'red', snapCanvasZIndex = 10001 } = {} } = inst;
    if (!snapRef) {
      return;
    }

    inst.snapRefElements = [];

    const $parent = this.parent();
    const $canvas = $('<canvas />').attr({
      width: $parent.width(),
      height: $parent.height(),
    }).addClass('ui-snap-ref-canvas')
    .css({
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: snapCanvasZIndex,
      'pointer-events': 'none',
    });

    [inst.canvas] = $canvas;
    $parent.append(inst.canvas);

    const ctx = inst.canvas.getContext('2d');

    inst.refLineContext = ctx;
    ctx.strokeStyle = snapRefLineColor;

    $(snapRef.constructor !== String ? (snapRef.items || ':data(ui-draggable)') : snapRef)
      .each(function cb() {
        const $this = $(this);
        const offset = $this.offset();
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

  drag(event, ui, inst) {
    const { options, margins } = inst;
    const { snapRefTolerance: refD = 30 } = options;
    let d = options.snapTolerance || 20;
    if (d > refD) {
      d = refD;
    }

    const x1 = ui.offset.left;
    const x2 = x1 + inst.helperProportions.width;
    const y1 = ui.offset.top;
    const y2 = y1 + inst.helperProportions.height;
    const x1c = x1 + Math.round(inst.helperProportions.width / 2);
    const y1c = y1 + Math.round(inst.helperProportions.height / 2);

    const lines = [];
    const changeQueue = {};

    for (let i = inst.snapRefElements.length - 1; i >= 0; i -= 1) {
      const element = inst.snapRefElements[i];
      const l = element.left - margins.left;
      const r = l + element.width;
      const t = element.top - margins.top;
      const b = t + element.height;
      const tc = t + Math.round(element.height / 2);
      const lc = l + Math.round(element.width / 2);

      const snapMargins = element.margins;

      /*
      if (x2 < l - refD
        || x1 > r + refD
        || y2 < t - refD
        || y1 > b + refD
        || !$.contains(
          inst.snapRefElements[i].item.ownerDocument,
          inst.snapRefElements[i].item,
        )) {
        if (inst.snapRefElements[i].snapping) {
          if (inst.options.snapRef.release) {
            inst.options.snapRef.release.call(
              inst.element,
              event,
              $.extend(inst._uiHash(), { snapItem: inst.snapRefElements[i].item }),
            );
          }
        }
        inst.snapRefElements[i].snapping = false;
        continue;
      }
      */

      let ts;
      let bs;
      let ls;
      let rs;

      let at;
      let ab;
      let al;
      let ar;

      const atc = Math.abs(tc - y1c);
      const tcs = atc <= refD;

      const alc = Math.abs(lc - x1c);
      const lcs = alc <= refD;

      let args;
      args = {
        tc, lc, x1c, y1c, margins, snapMargins,
      };

      pushRefLines(lines, { tcs, lcs }, args);

      if (tcs && atc <= d) {
        queueSnap(changeQueue, 'tcs', atc, (a) => {
          ui.position.top = inst._convertPositionTo('relative', {
            top: a - Math.round(inst.helperProportions.height / 2),
            left: 0,
          }).top;
        }, tc);
      }

      if (lcs && alc <= d) {
        queueSnap(changeQueue, 'lcs', alc, (a) => {
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
          t, b, l, r, x1, x2, y1, y2, margins, snapMargins,
        };

        pushRefLines(lines, {
          ts, bs, ls, rs,
        }, args);

        // 小于吸附距离
        if (ts && at <= d) {
          queueSnap(changeQueue, 'ts', at, (a) => {
            ui.position.top = inst._convertPositionTo('relative', {
              top: a - inst.helperProportions.height,
              left: 0,
            }).top;
          }, t);
        }

        if (bs && ab <= d) {
          queueSnap(changeQueue, 'bs', ab, (a) => {
            ui.position.top = inst._convertPositionTo('relative', {
              top: a,
              left: 0,
            }).top;
          }, b);
        }

        if (ls && al <= d) {
          queueSnap(changeQueue, 'ls', al, (a) => {
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: a - inst.helperProportions.width,
            }).left;
          }, l);
        }

        if (rs && ar <= d) {
          queueSnap(changeQueue, 'rs', ar, (a) => {
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: a,
            }).left;
          }, r);
        }
      }

      // const first = (ts || bs || ls || rs);

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
          t, b, l, r, x1, x2, y1, y2, margins, snapMargins,
        };

        pushRefLines(lines, {
          ts, bs, ls, rs,
        }, args);

        if (ts && at <= d) {
          queueSnap(changeQueue, 'ts2', at, (a) => {
            ui.position.top = inst._convertPositionTo('relative', {
              top: a,
              left: 0,
            }).top;
          }, t);
        }

        if (bs && ab <= d) {
          queueSnap(changeQueue, 'bs2', ab, (a) => {
            ui.position.top = inst._convertPositionTo('relative', {
              top: a - inst.helperProportions.height,
              left: 0,
            }).top;
          }, b);
        }

        if (ls && al <= d) {
          queueSnap(changeQueue, 'ls2', al, (a) => {
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: a,
            }).left;
          }, l);
        }

        if (rs && ar <= d) {
          queueSnap(changeQueue, 'rs2', ar, (a) => {
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: a - inst.helperProportions.width,
            }).left;
          }, r);
        }
      }

      /*
      if (!inst.snapRefElements[i].snapping && (ts || bs || ls || rs || first)) {
        if (inst.options.snapRef.snap) {
          inst.options.snapRef.snap.call(
            inst.element,
            event,
            $.extend(inst._uiHash(), {
              snapItem: inst.snapRefElements[i].item,
            }),
          );
        }
      }

      inst.snapRefElements[i].snapping = (ts || bs || ls || rs || first);
      */
    }

    Object.keys(changeQueue).forEach((key) => {
      const item = changeQueue[key];
      item.cb(...item.args);
    });

    const ctx = inst.refLineContext;
    const offsetParent = inst.offset.parent;
    ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);
    ctx.beginPath();

    lines.forEach((line) => {
      const [start, end, margins_] = line;
      ctx.moveTo(
        start.x + margins_.left - offsetParent.left,
        start.y + margins_.top - offsetParent.top
      );
      ctx.lineTo(
        end.x + margins_.left - offsetParent.left,
        end.y + margins_.top - offsetParent.top
      );
    });

    ctx.stroke();
  },

  stop(event, ui, inst) {
    delete inst.refLineContext;
    $(inst.canvas).remove();
    delete inst.canvas;
  },
});
