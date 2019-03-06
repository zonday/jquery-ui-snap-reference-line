import $ from 'jquery';

export default class RefLineCanvas {
  constructor($container, options = {}) {
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
  }

  draw(lines) {
    this.ctx.clearRect(0, 0, this.$canvas[0].width, this.$canvas[0].height);
    this.ctx.beginPath();
    lines.forEach((line) => {
      const [start, end] = line;
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
    });
    this.ctx.stroke();
  }

  destroy() {
    this.$canvas.remove();
  }
}
