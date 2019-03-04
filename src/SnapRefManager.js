import SnapQueue from "./SnapQueue";

export default class SnapRefManager {
  constructor(elements, snapCallbacks, options) {
    this.elements = elements;
    this.snapCallbacks = snapCallbacks;
    this.options = options;
  }

  snap(ui, source) {
    const refLines = [];
    const snapQueue = new SnapQueue();
    this.elements.forEach((target) => {
      const distanceResult = this.calculateDistance(source, target);
      Object.keys(distanceResult).forEach((key) => {
        const tolerance = this.calculateTolerance(distanceResult[key]);
        Object.keys(tolerance).forEach((type) => {
          const item = tolerance[type];
          if (item.ref) {
            refLines.push(this.makeRefLine(type, source, target));
          }
          if (item.snap && this.snapCallbacks[key]) {
            const callback = this.snapCallbacks[key][type];
            if (callback) {
              snapQueue.push(`${key}${type}`, item.distance, (...args) => {
                callback(ui, ...args);
              }, source, target);
            }
          }
        });
      });
    });
    snapQueue.execute();
    return refLines;
  }

  makeRefLine(type, source, target) {
    switch (type) {
      case 'vertical':
        return [
          {
            x: Math.min(target.left + target.width / 2, source.left + source.width / 2),
            y: target.top + target.height / 2,
          },
          {
            x: Math.max(target.left + target.width / 2, source.left + source.width / 2),
            y: target.top + target.height / 2,
          },
        ];
      case 'horizontal':
        return [
          {
            x: target.left + target.width / 2,
            y: Math.min(target.top + target.height / 2, source.top + source.height / 2),
          },
          {
            x: target.left + target.width / 2,
            y: Math.max(target.top + target.height / 2, source.top + source.height / 2),
          },
        ];
      case 'top':
        return [
          {
            x: Math.min(target.left, source.left),
            y: target.top,
          },
          {
            x: Math.max(target.right, source.right),
            y: target.top,
          },
        ];
      case 'bottom':
        return [
          {
            x: Math.min(target.left, source.left),
            y: target.bottom,
          },
          {
            x: Math.max(target.right, source.right),
            y: target.bottom,
          },
        ];
      case 'left':
        return [
          {
            x: target.left,
            y: Math.min(target.top, source.top),
          },
          {
            x: target.left,
            y: Math.max(target.bottom, source.bottom),
          },
        ];
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
          },
        ];
    }
  }

  calculateTolerance(distanceMap) {
    const result = {};
    Object.keys(distanceMap).forEach((name) => {
      const distance = Math.abs(distanceMap[name]);
      result[name] = {
        distance,
        snap: distance <= this.options.snapTolerance,
        ref: distance <= this.options.snapRefTolerance,
      };
    });
    return result;
  }

  calculateDistance(target, source) {
    const result = {};
    result.center = {
      horizontal: (target.left + target.width / 2) - (source.left + source.width / 2), // 居中水平
      vertical: (target.top + target.height / 2) - (source.top + source.height / 2), // 居中垂直
    };

    result.outer = {
      bottom: target.top - source.bottom, // 下
      top: target.bottom - source.top, // 上
      right: target.left - source.right, // 右
      left: target.right - source.left, // 左
    };

    result.inner = {
      top: target.top - source.top, // 上
      bottom: target.bottom - source.bottom, // 下
      left: target.left - source.left, // 左
      right: target.right - source.right, // 右
    };

    return result;
  }
}
