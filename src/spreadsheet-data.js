import { isEqual, range } from "./utils.js";

export function spreadsheetColumn(idx) {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

export function newSpreadsheetData(rows, cols) {
  const data = {
    rows,
    cols,
    dependencies: new Map(),
  };
  data.cells = Array.from({ length: cols * rows }, (_, idx) => {
    const [x, y] = idxToCoords(data, idx);
    return {
      x,
      y,
      idx,
      value: 0,
      computedValue: 0,
    };
  });
  return data;
}

export function getCell(data, x, y) {
  return data.cells[y * data.cols + x];
}

function idxToCoords(data, idx) {
  return [idx % data.cols, Math.floor(idx / data.cols)];
}

function coordsToName(x, y) {
  return `${spreadsheetColumn(x)}${y}`;
}

function idxToName(data, idx) {
  const [x, y] = idxToCoords(data, idx);
  return coordsToName(x, y);
}

export function addDependency(data, cell, dep) {
  if (!data.dependencies.has(cell)) {
    data.dependencies.set(cell, new Set());
  }
  data.dependencies.get(cell).add(dep);
}

function generateCode(data, x, y) {
  const name = coordsToName(x, y);
  const cell = getCell(data, x, y);
  const code = `(function ({data, getCell, addDependency}) {
      const COLS=data.cols;
      const ROWS=data.rows;
      const X = ${x};
      const Y = ${y};
      ${data.cells
        .map((cell, idx) => {
          const cellName = idxToName(data, idx);
          const x = JSON.stringify(cell.x);
          const y = JSON.stringify(cell.y);
          return `Object.defineProperty(globalThis, ${JSON.stringify(
            cellName
          )}, {
            configurable: true,
            get() {
              addDependency(data, ${JSON.stringify(name)}, ${JSON.stringify(
            cellName
          )});
              return getCell(data, ${x}, ${y}).computedValue;
            }
          });`;
        })
        .join("\n")}

      const rel = (dx, dy) => {
        const x = clamp(0, X + dx, COLS);
        const y = clamp(0, Y + dy, ROWS);
        return getCell(data, x, y).computedValue;
      };

      return ${cell.value};
    })`;
  return code;
}

export function resetDependencies(data, x, y) {
  data.dependencies.get(coordsToName(x, y))?.clear();
}

export function showError(data, x, y, e) {
  getCell(data, x, y).computedValue = `#ERROR ${e.message}`;
}

function computeCell(data, x, y) {
  const cell = getCell(data, x, y);
  let result;
  try {
    result = eval(generateCode(data, x, y))({ data, getCell, addDependency });
  } catch (e) {
    showError(data, x, y, e);
    return false;
  }
  const hasChanged = !isEqual(result, cell.computedValue);
  cell.computedValue = result;
  return hasChanged;
}

function getDependencies(data, name) {
  return data.dependencies.get(name) ?? [];
}

function checkCellForCycle(data, name, origin = name, visited = [origin]) {
  for (const dep of getDependencies(data, name)) {
    // Found a cycle back to origin!
    if (dep === origin) {
      return [...visited, dep];
    }
    if (visited.includes(dep)) continue;
    const cycle = checkCellForCycle(data, dep, origin, [...visited, dep]);
    if (cycle) return cycle;
  }
}

function checkForCycles(data) {
  for (const y of range(data.rows)) {
    for (const x of range(data.cols)) {
      const name = coordsToName(x, y);
      const cycle = checkCellForCycle(data, name);
      if (cycle) return cycle;
    }
  }
}

function computeAllCells(data) {
  let hasChanged = false;
  for (const y of range(data.rows)) {
    for (const x of range(data.cols)) {
      hasChanged = hasChanged || computeCell(data, x, y);
    }
  }
  const cycle = checkForCycles(data);
  if (cycle) {
    throw Error(`Found a cycle: ${cycle.join("->")}`);
  }
  return hasChanged;
}

export function propagateAllUpdates(data) {
  while (computeAllCells(data));
}
