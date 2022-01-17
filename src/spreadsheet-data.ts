import { isEqual, range, clamp } from "./utils.ts";

globalThis.clamp = clamp;

interface Cell {
  x: number;
  y: number;
  idx: number;
  value: string;
  computedValue: any;
}

export function spreadsheetColumn(idx: number) {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

function coordsToName(x: number, y: number) {
  return `${spreadsheetColumn(x)}${y}`;
}

export class SpreadsheetData {
  rows: number;
  cols: number;
  dependencies: Map<string, Set<string>>;
  cells: Cell[];

  constructor(rows: number, cols: number) {
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
        computedValue: 0,
      };
    });
  }

  getCell(x: number, y: number) {
    return this.cells[y * this.cols + x];
  }

  getComputedValue(cell: Cell) {
    return cell.computedValue;
  }

  setComputedValue(cell: Cell, value: any) {
    cell.computedValue = value;
  }

  idxToCoords(idx: number) {
    return [idx % this.cols, Math.floor(idx / this.cols)];
  }

  idxToName(idx: number) {
    const [x, y] = this.idxToCoords(idx);
    return coordsToName(x, y);
  }

  addDependency(name: string, depName: string) {
    let deps = this.dependencies.get(name);
    if (!deps) {
      deps = new Set([depName]);
      this.dependencies.set(name, deps);
    }
    deps.add(depName);
  }

  generateCode(x: number, y: number) {
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

  resetDependencies(x: number, y: number) {
    this.dependencies.get(coordsToName(x, y))?.clear();
  }

  showError(x: number, y: number, e: any) {
    this.setComputedValue(
      this.getCell(x, y),
      `#ERROR ${e?.message ?? String(e)}`
    );
  }

  computeCell(x: number, y: number) {
    const cell = this.getCell(x, y);
    let result: any;
    try {
      result = eval(this.generateCode(x, y))({
        data: this,
      });
    } catch (e: unknown) {
      this.showError(x, y, e);
      return false;
    }
    const hasChanged = !isEqual(result, this.getComputedValue(cell));
    this.setComputedValue(cell, result);
    return hasChanged;
  }

  getDependencies(name: string) {
    return this.dependencies.get(name) ?? new Set<string>([]);
  }

  checkCellForCycle(
    name: string,
    origin = name,
    visited = [origin]
  ): string[] | undefined {
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
