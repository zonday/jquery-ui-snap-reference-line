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

export function queueSnap(queue, type, distance, cb, ...args) {
  if (!queue[type] || queue[type].distance > distance) {
    queue[type] = {
      distance,
      cb,
      args,
      snap: true,
    };
  }
}
