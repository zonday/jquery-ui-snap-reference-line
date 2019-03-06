import $ from 'jquery';

import RefLineCanvas from './RefLineCanvas';
import SnapRefManager from './SnapRefManager';

import { getMargins, toNum, includes } from './helpers';

$.ui.plugin.add('resizable', 'snapRef', {
  start() {
    const inst = $(this).resizable('instance');
    const { options: {
      snapRef,
      snapRefLineColor = 'red',
      snapCanvasZIndex = 10001,
      snapRefTolerance = 30,
      snapTolerance = 20,
    } = {} } = inst;

    inst.snapRefElements = [];
    inst.refLineCanvas = new RefLineCanvas(this.parent(), {
      lineColor:  snapRefLineColor,
      zIndex: snapCanvasZIndex,
    });

    inst.margins = getMargins(inst.element);

    const elements = [];

    $(snapRef.constructor !== String ? (snapRef.items || ':data(ui-draggable)') : snapRef)
      .each(function cb() {
        if (this !== inst.element[0]) {
          const $this = $(this);

          const margins = getMargins($this);
          const top = toNum($this.css('top')) + margins.top;
          const left = toNum($this.css('left')) + margins.left;

          const width = $this.outerWidth();
          const height = $this.outerHeight();

          elements.push({
            item: this,
            width,
            height,
            top,
            left,
            bottom: top + height,
            right: left + width,
            offset: {
              top: margins.top,
              left: margins.left,
            },
          });
      }
    });

    const snapCallbacks = {
      center: {
        horizontal(ui, s, t, axis) {
          let left = s.left + s.width / 2 < t.left + t.width / 2;
          if (includes(['nw', 'w', 'sw'], axis) && !left) {
            ui.size.width = (s.right - (t.left + t.width / 2)) * 2;
            ui.position.left = s.right - ui.size.width - s.offset.left;
          } else if (includes(['ne', 'e', 'se'], axis) && left) {
            ui.size.width = (t.left + t.width / 2 - s.left) * 2;
          }
        },
        vertical(ui, s, t, axis) {
          let above = s.top + s.height / 2 < t.top + t.height / 2;
          if (includes(['sw', 's', 'se'], axis) && above) {
            ui.size.height = (t.top + t.height / 2 - s.top) * 2;
          } else if (includes(['nw', 'n', 'ne'], axis) && !above) {
            ui.size.height = (s.bottom - (t.top + t.height / 2)) * 2;
            ui.position.top = s.bottom - ui.size.height - s.offset.top;
          }
        }
      },
      inner: {
        top(ui, s, t) {
          ui.size.height = s.bottom - t.top;
          ui.position.top = s.bottom - ui.size.height - s.offset.top;
        },
        bottom(ui, s, t) {
          ui.size.height = t.bottom - s.top;
        },
        left(ui, s, t) {
          ui.size.width = s.right - t.left;
          ui.position.left = s.right - ui.size.width - s.offset.left;
        },
        right(ui, s, t) {
          ui.size.width = t.right - s.left;
        }
      },
      outer: {
        top(ui, s, t) {
          ui.size.height = t.top - s.top;
        },
        bottom(ui, s, t) {
          ui.size.height = s.bottom - t.bottom;
          ui.position.top = s.bottom - ui.size.height - s.offset.top;
        },
        left(ui, s, t) {
          ui.size.width = t.left - s.left;
        },
        right(ui, s, t) {
          ui.size.width = s.right - t.right;
          ui.position.left = s.right - ui.size.width - s.offset.left;
        }
      }
    };

    inst.snapRefManager = new SnapRefManager(elements, snapCallbacks, {
      snapRefTolerance,
      snapTolerance,
    });
  },

  resize(event, ui) {
      const inst = $(this).resizable('instance');
      const { margins } = inst;

      const top = ui.position.top + margins.top;
      const left = ui.position.left + margins.left;
      const width = ui.size.width;
      const height = ui.size.height;

      const lines = inst.snapRefManager.snap(ui, {
        top,
        left,
        width,
        height,
        right: left + width,
        bottom: top + height,
        offset: {
          left: margins.left,
          top: margins.top,
        },
      }, inst.axis);

      inst.refLineCanvas.draw(lines);
  },

  stop() {
    const inst = $(this).resizable('instance');
    inst.refLineCanvas.destroy();
    delete inst.refLineCanvas;
  },
});
