import { useReducer } from "preact/hooks";

import { range, clamp } from "./utils.js";

export function spreadsheetColumn(idx) {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

class SpreadsheetData {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = Array.from({ length: cols * rows }, (_, idx) => {
      const [x, y] = this.idxToCoords(idx);
      return {
        x,
        y,
        idx,
        value: 0,
        computedValue: 0,
      };
    });
    this.dependencies = new Map();
  }

  getCell(x, y) {
    return this.cells[y * this.cols + x];
  }

  idxToCoords(idx) {
    return [idx % this.cols, Math.floor(idx / this.cols)];
  }

  coordsToName(x, y) {
    return `${spreadsheetColumn(x)}${y}`;
  }

  idxToName(idx) {
    const [x, y] = this.idxToCoords(idx);
    return this.coordsToName(x, y);
  }

  addDependency(cell, dep) {
    if (!this.dependencies.has(cell)) {
      this.dependencies.set(cell, new Set());
    }
    this.dependencies.get(cell).add(dep);
  }

  generateCode(x, y) {
    const name = this.coordsToName(x, y);
    const cell = this.getCell(x, y);
    const code = `(function () {
      const spreadsheetData = this;
      const COLS=this.cols;
      const ROWS=this.rows;
      const X = ${x};
      const Y = ${y};
      ${this.cells
        .map((cell, idx) => {
          const cellName = this.idxToName(idx);
          return `Object.defineProperty(globalThis, ${JSON.stringify(
            cellName
          )}, {
            configurable: true,
            get() {
              spreadsheetData.addDependency(${JSON.stringify(
                name
              )}, ${JSON.stringify(cellName)});
              return ${JSON.stringify(cell.computedValue)};
            }
          });`;
        })
        .join("\n")}

      const rel = (dx, dy) => {
        const x = clamp(0, X + dx, COLS);
        const y = clamp(0, Y + dy, ROWS);
        return this.getCell(x, y).computedValue;
      };

      return ${cell.value};
    })`;
    return code;
  }

  resetDependencies(x, y) {
    this.dependencies.get(this.coordsToName(x, y))?.clear();
  }

  showError(x, y, e) {
    this.getCell(x, y).computedValue = `#ERROR ${e.message}`;
  }

  computeCell(x, y) {
    const cell = this.getCell(x, y);
    let result;
    try {
      result = eval(this.generateCode(x, y)).call(this);
    } catch (e) {
      data.showError(x, y, e);
    }
    const hasChanged = result != cell.computedValue;
    cell.computedValue = result;
    return hasChanged;
  }

  getDependencies(name) {
    return this.dependencies.get(name) ?? [];
  }

  checkCellForCycle(name, origin = name, visited = [origin]) {
    for (const dep of this.getDependencies(name)) {
      // Found a cycle back to origin!
      if (dep === origin) {
        return [...visited, dep];
      }
      if (visited.includes(dep)) continue;
      const cycle = this.checkCellForCycle(dep, origin, [...visited, dep]);
      if (cycle) return cycle;
    }
  }

  checkForCycles() {
    for (const y of range(this.rows)) {
      for (const x of range(this.cols)) {
        const name = this.coordsToName(x, y);
        const cycle = this.checkCellForCycle(name);
        if (cycle) return cycle;
      }
    }
  }

  computeAllCells() {
    let hasChanged = false;
    for (const y of range(this.rows)) {
      for (const x of range(this.cols)) {
        hasChanged = hasChanged || this.computeCell(x, y);
      }
    }
    const cycle = this.checkForCycles();
    if (cycle) {
      throw Error(`Found a cycle: ${cycle.join("->")}`);
    }
    return hasChanged;
  }

  propagateAllUpdates() {
    while (this.computeAllCells());
  }
}

export default function useSpreadsheetData(rows, cols) {
  const [{ data }, dispatch] = useReducer(
    ({ data }, { x, y, value }) => {
      const cell = data.getCell(x, y);
      cell.value = value;
      data.resetDependencies(x, y);
      try {
        data.propagateAllUpdates();
      } catch (e) {
        data.showError(x, y, e);
      }
      // Shallow copy so that preact doesn’t skip rendering.
      return { data };
    },
    { data: new SpreadsheetData(rows, cols) }
  );
  return [data, dispatch];
}
