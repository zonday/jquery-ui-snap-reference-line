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

export function toNum(a) {
  return parseInt(a, 10) || 0;
}

export function includes(array, value) {
  return array.indexOf(value) !== -1;
}
