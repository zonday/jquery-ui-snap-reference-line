export function makeRefLine(type, {
  tc, lc, x1c, y1c, t, b, l, r, x1, x2, y1, y2, margins, snapMargins,
}) {
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
        lc - x1c < 0 ? snapMargins : margins,
      ];
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
        tc - y1c < 0 ? snapMargins : margins,
      ];
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
        l - x1 < 0 ? snapMargins : margins,
      ];
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
        l - x1 < 0 ? snapMargins : margins,
      ];
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
        t - y1 < 0 ? snapMargins : margins,
      ];
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
        t - y1 < 0 ? snapMargins : margins,
      ];
  }
}

export function pushRefLines(lines, conditions, args) {
  Object.keys(conditions).forEach((key) => {
    if (conditions[key]) {
      lines.push(makeRefLine(key, args));
    }
  });
}

export function getMargins($element) {
  return {
    left: (parseInt($element.css('marginLeft'), 10) || 0),
    top: (parseInt($element.css('marginTop'), 10) || 0),
    right: (parseInt($element.css('marginRight'), 10) || 0),
    bottom: (parseInt($element.css('marginBottom'), 10) || 0),
  };
}

export function calculateAxis(start, end, defaultAxis) {
  if (start.x === end.x) {
    if (start.y > end.y) {
      return 'n';
    }
    if (start.y < end.y) {
      return 's';
    }
  }
  if (start.y === end.y) {
    if (start.x > end.x) {
      return 'w';
    }
    if (start.x < end.x) {
      return 'e';
    }
  }
  if (start.x > end.x && start.y > end.y) {
    return 'nw';
  }

  if (start.x > end.x && start.y < end.y) {
    return 'sw';
  }

  if (start.x < end.x && start.y > end.y) {
    return 'ne';
  }

  if (start.x < end.x && start.y < end.y) {
    return 'se';
  }

  return defaultAxis;
}

export function calculateAlignment(distanceMap, tolerance, predicate = (a, b) => a <= b) {
  const result = {};
  Object.keys(distanceMap).forEach((key) => {
    result[key] = predicate.call(this, distanceMap[key], tolerance);
  });
  return result;
}

export function calculateDistance(source, target, mode) {
  const result = {};
  result.center = {
    horizontal: target.horizontal - source.horizontal, // 居中水平
    vertical: target.vertical - source.vertical, // 居中垂直
  };

  if (mode !== 'inner') {
    result.outer = {
      top: target.top - source.bottom, // 上
      bottom: target.bottom - source.top, // 下
      left: target.left - source.right, // 左
      right: target.right - source.left, // 右
    };
  }
  if (this.mode !== 'outer') {
    result.inner = {
      top: target.top - source.top, // 上
      bottom: target.bottom - source.bottom, // 下
      left: target.left - source.left, // 左
      right: target.right - source.right, // 右
    };
  }

  return result;
}

export function toNum(a) {
  return parseInt(a, 10) || 0;
}
