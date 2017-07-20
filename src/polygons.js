// This module defines functions for working with polygons.

export function getBoundingBoxOfOne(polygon) {
  if (polygon.length === 0) return [0, 0, 0, 0];

  let maxX, maxY, minX, minY;
  const [x, y] = polygon[0];
  maxX = minX = x;
  maxY = minY = y;
  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

/**
 * Gets the bounding box of a set of shapes.
 */
export function getBoundingBoxOfMany(polygons) {
  if (polygons.length === 0) return [0, 0, 0, 0];

  const firstPolygon = polygons[0];
  let [minX, minY, maxX, maxY] = getBoundingBoxOfOne(firstPolygon);

  for (const polygon of polygons) {
    if (polygon === firstPolygon) continue;

    const [x1, y1, x2, y2] = getBoundingBoxOfOne(polygon);
    if (x1 < minX) minX = x1;
    if (x2 > maxX) maxX = x2;
    if (y1 < minY) minY = y1;
    if (y2 > maxY) maxY = y2;
  }

  return [minX, minY, maxX, maxY];
}

export function getCenter(polygon) {
  const [minX, minY, maxX, maxY] = getBoundingBoxOfOne(polygon);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  return [centerX, centerY];
}

export function getCenterOfMany(polygons) {
  const [minX, minY, maxX, maxY] = getBoundingBoxOfMany(polygons);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  return [centerX, centerY];
}

export function getPoints(polygon, height) {
  // Using height - y instead of y flips the shape
  // to simulate the coordinate system origin being
  // in the lower-left instead of the upper-left.
  return polygon.reduce(
    (points, [x, y]) =>
      `${points} ${x},${height - y}`,
    '');
}

export function getRectangle(x, y, width, height) {
  return [
    [x, y],
    [x, y + height],
    [x + width, y + height],
    [x + width, y]
  ];
}

export function getTransform(angle, centerX, centerY, flipX, flipY, polygon) {
  const rotate = angle ? `rotate(${angle}, ${centerX}, ${centerY})` : '';

  let scale = '';
  if (flipX || flipY) {
    const [minX, minY, maxX, maxY] = getBoundingBoxOfOne(polygon);
    const dx = flipY ? minX + maxX : 0;
    const dy = flipX ? minY + maxY : 0;
    const sx = flipY ? -1 : 1;
    const sy = flipX ? -1 : 1;
    scale = `translate(${dx},${dy}) scale(${sx},${sy})`;
  }

  return `${rotate} ${scale}`;
}
