import $ from 'jquery';

import RefLineCanvas from './RefLineCanvas';
import SnapRefManager from './SnapRefManager';
import { getMargins, toNum } from './helpers';

if ($.ui && $.ui.draggable) {
  $.ui.plugin.add('draggable', 'snapRef', {
    start() {
      const inst = $(this).draggable('instance');
      const { options: {
        snapRef,
        snapRefLineColor = 'red',
        snapCanvasZIndex = 10001,
        snapRefTolerance = 30,
        snapTolerance = 20,
      } = {} } = inst;

      inst.refLineCanvas = new RefLineCanvas(this.parent(), {
        lineColor: snapRefLineColor,
        zIndex: snapCanvasZIndex,
      });

      const snapCallbacks = {
        center: {
          vertical(ui, s, t) {
            ui.position.top =  t.top - (s.height - t.height) / 2 - s.offset.top;
          },
          horizontal(ui, s, t) {
            ui.position.left = t.left - (s.width - t.width) / 2 - s.offset.left;
          }
        },
        inner: {
          top(ui, s, t) {
            ui.position.top = t.top - s.offset.top ;
          },
          left(ui, s, t) {
            ui.position.left = t.left - s.offset.left;
          },
          right(ui, s, t) {
            ui.position.left = t.right - s.width - s.offset.left;
          },
          bottom(ui, s, t) {
            ui.position.top = t.bottom - s.height - s.offset.top;
          },
        },
        outer: {
          top(ui, s, t) {
            ui.position.top = t.top - s.height - s.offset.top;
          },
          left(ui, s, t) {
            ui.position.left = t.left - s.width - s.offset.left;
          },
          right(ui, s, t) {
            ui.position.left = t.right - s.offset.left;
          },
          bottom(ui, s, t) {
            ui.position.top = t.bottom - s.offset.top;
          },
        },
      };

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

        inst.snapRefManager = new SnapRefManager(elements, snapCallbacks, {
          snapRefTolerance,
          snapTolerance,
        });
    },

    drag(event, ui) {
      const inst = $(this).draggable('instance');
      const { margins } = inst;

      const top = ui.position.top + margins.top;
      const left = ui.position.left + margins.left;
      const width = inst.helperProportions.width;
      const height = inst.helperProportions.height;

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
      });

      inst.refLineCanvas.draw(lines);
    },

    stop() {
      const inst = $(this).draggable('instance');
      inst.refLineCanvas.destroy();
      delete inst.refLineCanvas;
      delete inst.snapRefManager;
    },
  });
}
