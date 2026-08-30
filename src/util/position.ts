/**
 * Get element width based on start and end
 * @param start Startime of the element to position
 * @param end Endtime of the elemen to position
 * @param cellWidth Width in pixels of one cell in the grid
 * @param scale How many minutes are displayed in one cell
 * @returns {number} Width of the element
 */
function getElemWidth(
  start: Date,
  end: Date,
  cellWidth: number,
  scale: number,
): number {
  const duration = (end.getTime() - start.getTime()) / 60000;
  if (!cellWidth) return 0;

  return (duration / 60 / scale) * cellWidth;
}

/**
 * Get element absolute left based on start date
 * @param start Starttime of the timeline being displayed
 * @param elemStart Startime of the element to position
 * @param cellWidth Width in pixels of one cell in the grid
 * @param scale How many minutes are displayed in one cell
 * @returns {number} Left position of the element
 */
function getElemLeft(
  start: Date,
  elemStart: Date,
  cellWidth: number,
  scale: number,
): number {
  if (!cellWidth) return 0;
  const timeDifference = (elemStart.getTime() - start.getTime()) / 60000;
  const left = (timeDifference / 60 / scale) * cellWidth;
  return left;
}

/**
 * Get element row based on timeline index
 * @param identiferIdx
 * @returns {number} Top position of the element
 */
function getElemRow(identiferIdx: number, rowHeight: number): number {
  return identiferIdx * rowHeight;
}

export { getElemLeft, getElemRow, getElemWidth };
