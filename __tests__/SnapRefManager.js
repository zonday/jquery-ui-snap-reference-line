/* eslint-env jest */

import SnapRefManager from "../src/SnapRefManager";

function moveInnerTopOrLeft(sourceBox, targetBox, dx = 0, dy = 0) {
  sourceBox.left = targetBox.left + dx;
  sourceBox.top = targetBox.top + dy;
  sourceBox.right = sourceBox.left + sourceBox.width;
  sourceBox.bottom = sourceBox.top + sourceBox.height;
}

function moveInnerBottom(sourceBox, targetBox, dx = 0, dy = 0) {
  sourceBox.left = targetBox.left + dx;
  sourceBox.top = targetBox.bottom + dy - sourceBox.height;
  sourceBox.right = sourceBox.left + sourceBox.width;
  sourceBox.bottom = sourceBox.top + sourceBox.height;
}

function moveInnerRight(sourceBox, targetBox, dx = 0, dy = 0) {
  sourceBox.left = targetBox.right + dx - sourceBox.width;
  sourceBox.top = targetBox.top + dy;
  sourceBox.right = sourceBox.left + sourceBox.width;
  sourceBox.bottom = sourceBox.top + sourceBox.height;
}

function moveOuterTop(sourceBox, targetBox, dx = 0, dy = 0) {
  sourceBox.left = targetBox.left + dx;
  sourceBox.top = targetBox.top + dy - sourceBox.height;
  sourceBox.right = sourceBox.left + sourceBox.width;
  sourceBox.bottom = sourceBox.top + sourceBox.height;
}

function moveOuterBottom(sourceBox, targetBox, dx = 0, dy = 0) {
  sourceBox.left = targetBox.left + dx;
  sourceBox.top = targetBox.bottom + dy;
  sourceBox.right = sourceBox.left + sourceBox.width;
  sourceBox.bottom = sourceBox.top + sourceBox.height;
}

function moveOuterLeft(sourceBox, targetBox, dx = 0, dy = 0) {
  sourceBox.left = targetBox.left + dx - sourceBox.width;
  sourceBox.top = targetBox.top + dy;
  sourceBox.right = sourceBox.left + sourceBox.width;
  sourceBox.bottom = sourceBox.top + sourceBox.height;
}

function moveOuterRight(sourceBox, targetBox, dx = 0, dy = 0) {
  sourceBox.left = targetBox.right + dx;
  sourceBox.top = targetBox.bottom + dy;
  sourceBox.right = sourceBox.left + sourceBox.width;
  sourceBox.bottom = sourceBox.top + sourceBox.height;
}

describe('Snap Ref Manager', () => {
  let box1;
  let box2;
  let box3;

  beforeEach(() => {
    box1 = {
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      right: 200,
      bottom: 200,
      offset: {
        top: 0,
        left: 0,
      },
    };
    box2 = {
      width: 200,
      height: 200,
      top: 200,
      left: 200,
      right: 400,
      bottom: 400,
      offset: {
        top: 0,
        left: 0,
      },
    };
    box3 = {
      width: 200,
      height: 200,
      top: 400,
      left: 400,
      right: 600,
      bottom: 600,
      offset: {
        top: 0,
        left: 0,
      },
    };
  });


  test('drag inner', () => {
    const snapRefManage = new SnapRefManager([box2], {}, {
      snapTolerance: 20,
      snapRefTolerance: 30,
    });
    const sourceBox = Object.assign({}, box3);
    let distanceResult;
    let tolerance;
    sourceBox.height = 600;
    sourceBox.width = 600;
    moveInnerTopOrLeft(sourceBox, box2, 90, 30);
    distanceResult = snapRefManage.calculateDistance(sourceBox, box2);
    tolerance = snapRefManage.calculateTolerance(distanceResult.inner, 'inner');
    expect(tolerance.top.ref).toBe(true);

    moveInnerTopOrLeft(sourceBox, box2, 30, 90);
    distanceResult = snapRefManage.calculateDistance(sourceBox, box2);
    tolerance = snapRefManage.calculateTolerance(distanceResult.inner, 'inner');
    expect(tolerance.left.ref).toBe(true);

    moveInnerBottom(sourceBox, box2, 90, 30);
    distanceResult = snapRefManage.calculateDistance(sourceBox, box2);
    tolerance = snapRefManage.calculateTolerance(distanceResult.inner, 'inner');
    expect(tolerance.bottom.ref).toBe(true);

    moveInnerRight(sourceBox, box2, 30, 90);
    distanceResult = snapRefManage.calculateDistance(sourceBox, box2);
    tolerance = snapRefManage.calculateTolerance(distanceResult.inner, 'inner');
    expect(tolerance.right.ref).toBe(true);
  });

  test('drag outer', () => {
    const snapRefManage = new SnapRefManager([box2], {}, {
      snapTolerance: 20,
      snapRefTolerance: 30,
    });
    const sourceBox = Object.assign({}, box3);
    let distanceResult;
    let tolerance;
    moveOuterTop(sourceBox, box2, 30, 30);
    distanceResult = snapRefManage.calculateDistance(sourceBox, box2);
    tolerance = snapRefManage.calculateTolerance(distanceResult.outer, 'outer');
    expect(tolerance.top.ref).toBe(true);

    moveOuterLeft(sourceBox, box2, 30, 30);
    distanceResult = snapRefManage.calculateDistance(sourceBox, box2);

    tolerance = snapRefManage.calculateTolerance(distanceResult.outer, 'outer');
    expect(tolerance.left.ref).toBe(true);

    moveOuterBottom(sourceBox, box2, 30, 30);
    distanceResult = snapRefManage.calculateDistance(sourceBox, box2);
    tolerance = snapRefManage.calculateTolerance(distanceResult.outer, 'outer');
    expect(tolerance.bottom.ref).toBe(true);

    moveOuterRight(sourceBox, box2, 30, 30);
    distanceResult = snapRefManage.calculateDistance(sourceBox, box2);
    tolerance = snapRefManage.calculateTolerance(distanceResult.outer, 'outer');
    expect(tolerance.right.ref).toBe(true);
  });
});
