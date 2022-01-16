import { isEqual, range, clamp } from "./utils.ts";

globalThis.clamp = clamp;

export function spreadsheetColumn(idx) {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

function coordsToName(x, y) {
  return `${spreadsheetColumn(x)}${y}`;
}

export class SpreadsheetData {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.dependencies = new Map();
    this.cells = Array.from({ length: cols * rows }, (_, idx) => {
      const [x, y] = this.idxToCoords(idx);
      return {
        x,
        y,
        idx,
        value: "0",
        computedValue: "0",
      };
    });
  }

  getCell(x, y) {
    return this.cells[y * this.cols + x];
  }

  getComputedValue(cell) {
    return cell.computedValue;
  }

  setComputedValue(cell, value) {
    cell.computedValue = value;
  }

  idxToCoords(idx) {
    return [idx % this.cols, Math.floor(idx / this.cols)];
  }

  idxToName(idx) {
    const [x, y] = this.idxToCoords(idx);
    return coordsToName(x, y);
  }

  addDependency(cell, dep) {
    if (!this.dependencies.has(cell)) {
      this.dependencies.set(cell, new Set());
    }
    this.dependencies.get(cell).add(dep);
  }

  generateCode(x, y) {
    const name = coordsToName(x, y);
    const cell = this.getCell(x, y);
    const code = `(function ({data}) {
      const COLS=data.cols;
      const ROWS=data.rows;
      const X = ${x};
      const Y = ${y};
      ${this.cells
        .map((cell, idx) => {
          const cellName = this.idxToName(idx);
          const x = JSON.stringify(cell.x);
          const y = JSON.stringify(cell.y);
          return `
            Object.defineProperty(globalThis, ${JSON.stringify(cellName)}, {
              configurable: true,
              get() {
                data.addDependency(${JSON.stringify(name)}, ${JSON.stringify(
            cellName
          )});
                return data.getComputedValue(data.getCell(${x}, ${y}));
              }
            });
          `;
        })
        .join("\n")}

      const rel = (dx, dy) => {
        const x = clamp(0, X + dx, COLS);
        const y = clamp(0, Y + dy, ROWS);
        return data.getComputedValue(data.getCell(x, y));
      };

      return ${cell.value};
    })`;
    return code;
  }

  resetDependencies(x, y) {
    this.dependencies.get(coordsToName(x, y))?.clear();
  }

  showError(x, y, e) {
    this.setComputedValue(this.getCell(x, y), `#ERROR ${e.message}`);
  }

  computeCell(x, y) {
    const cell = this.getCell(x, y);
    let result;
    try {
      result = eval(this.generateCode(x, y))({
        data: this,
      });
    } catch (e) {
      this.showError(x, y, e);
      return false;
    }
    const hasChanged = !isEqual(result, this.getComputedValue(cell));
    this.setComputedValue(cell, result);
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
        const name = coordsToName(x, y);
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
