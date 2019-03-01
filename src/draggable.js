import $ from 'jquery';

import RefLineCanvas from './RefLineCanvas';
import SnapQueue from './SnapQueue';

import { pushRefLines, getMargins } from './helpers';

$.ui.plugin.add('draggable', 'snapRef', {
  start(event, ui, inst) {
    const { options: { snapRef, snapRefLineColor = 'red', snapCanvasZIndex = 10001 } = {} } = inst;

    inst.snapRefElements = [];
    inst.refLineCanvas = new RefLineCanvas(this.parent(), {
      lineColor:  snapRefLineColor,
      zIndex: snapCanvasZIndex,
    })

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
    const snapQueue = new SnapQueue();

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
        snapQueue.push('tcs', atc, (a) => {
          ui.position.top = inst._convertPositionTo('relative', {
            top: a - Math.round(inst.helperProportions.height / 2),
            left: 0,
          }).top;
        }, tc);
      }

      if (lcs && alc <= d) {
        snapQueue.push('lcs', alc, (a) => {
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
          snapQueue.push('ts', at, (a) => {
            ui.position.top = inst._convertPositionTo('relative', {
              top: a - inst.helperProportions.height,
              left: 0,
            }).top;
          }, t);
        }

        if (bs && ab <= d) {
          snapQueue.push('bs', ab, (a) => {
            ui.position.top = inst._convertPositionTo('relative', {
              top: a,
              left: 0,
            }).top;
          }, b);
        }

        if (ls && al <= d) {
          snapQueue.push('ls', al, (a) => {
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: a - inst.helperProportions.width,
            }).left;
          }, l);
        }

        if (rs && ar <= d) {
          snapQueue.push('rs', ar, (a) => {
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
          t, b, l, r, x1, x2, y1, y2, margins, snapMargins,
        };

        pushRefLines(lines, {
          ts, bs, ls, rs,
        }, args);

        if (ts && at <= d) {
          snapQueue.push('ts2', at, (a) => {
            ui.position.top = inst._convertPositionTo('relative', {
              top: a,
              left: 0,
            }).top;
          }, t);
        }

        if (bs && ab <= d) {
          snapQueue.push('bs2', ab, (a) => {
            ui.position.top = inst._convertPositionTo('relative', {
              top: a - inst.helperProportions.height,
              left: 0,
            }).top;
          }, b);
        }

        if (ls && al <= d) {
          snapQueue.push('ls2', al, (a) => {
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: a,
            }).left;
          }, l);
        }

        if (rs && ar <= d) {
          snapQueue.push('rs2', ar, (a) => {
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: a - inst.helperProportions.width,
            }).left;
          }, r);
        }
      }
    }

    snapQueue.execute();

    const { left: offsetParentLeft, top: offsetParentTop } = inst.offset.parent;
    inst.refLineCanvas.draw(lines.map(line => {
      const [start, end, margins_] = line;
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

  stop(event, ui, inst) {
    inst.refLineCanvas.destroy();
    delete inst.refLineCanvas;
  },
});
