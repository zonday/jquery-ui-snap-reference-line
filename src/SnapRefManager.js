import { includes } from './helpers';
import SnapQueue from "./SnapQueue";

export default class SnapRefManager {
  constructor(elements, snapCallbacks, options) {
    this.elements = elements;
    this.snapCallbacks = snapCallbacks;
    this.options = options;
    this.refElements = [];
  }

  pushRefElement(element) {
    if (this.refElements.indexOf(element) === -1) {
      this.refElements.push(element);
    }
  }

  snap(ui, source, axis) {
    this.refElements = [];
    const refLines = [];
    const snapQueue = new SnapQueue();
    this.elements.forEach((target) => {
      const distanceResult = this.calculateDistance(source, target);
      Object.keys(distanceResult).forEach((type) => {
        const tolerance = this.calculateTolerance(distanceResult[type], type, axis);
        Object.keys(tolerance).forEach((name) => {
          const item = tolerance[name];
          if (item.ref) {
            refLines.push(this.makeRefLine(name, source, target));
            this.pushRefElement(target);
          }
          if (item.snap && this.snapCallbacks[type]) {
            const callback = this.snapCallbacks[type][name];
            if (callback) {
              snapQueue.push(`${type}${name}`, item.distance, (...args) => {
                callback(ui, ...args);
              }, source, target, axis);
            }
          }
        });
      });
    });
    snapQueue.execute();
    return refLines;
  }

  makeRefLine(name, source, target) {
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

  calculateTolerance(distanceMap, type, axis) {
    const result = {};
    Object.keys(distanceMap).forEach((name) => {
      const distance = Math.abs(distanceMap[name]);
      let pass = true;
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
        distance,
        snap: pass && distance <= this.options.snapTolerance,
        ref: pass && distance <= this.options.snapRefTolerance,
      };
    });
    return result;
  }

  calculateDistance(source, target) {
    const result = {};
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
  }
}
