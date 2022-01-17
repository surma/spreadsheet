import { isEqual, range, clamp } from "./utils.ts";

globalThis.clamp = clamp;

interface Cell {
  x: number;
  y: number;
  idx: number;
  value: string;
  computedValue: any;
}

export function spreadsheetColumn(idx: number): string {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

function coordsToName(x: number, y: number): string {
  return `${spreadsheetColumn(x)}${y}`;
}

export interface Cell {
  x: number;
  y: number;
  idx: number;
  value: string;
  computedValue: any;
}

export class SpreadsheetData {
  // Cell idx -> Set of cell idx
  dependencies: Map<number, Set<number>> = new Map();
  cells: Array<Cell>;

  constructor(public rows, public cols) {
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

  getCell(x: number, y: number): Cell {
    return this.cells[this.coordsToIdx(x, y)];
  }

  getComputedValue(cell: Cell): any {
    return cell.computedValue;
  }

  setComputedValue(cell: Cell, value: any) {
    cell.computedValue = value;
  }

  coordsToIdx(x: number, y: number): number {
    return y * this.cols + x;
  }

  idxToCoords(idx: number): [number, number] {
    return [idx % this.cols, Math.floor(idx / this.cols)];
  }

  idxToName(idx: number): string {
    const [x, y] = this.idxToCoords(idx);
    return coordsToName(x, y);
  }

  addDependency(cellIdx: number, depIdx: number) {
    const name = this.idxToName(cellIdx);
    if (!this.dependencies.has(cellIdx)) {
      this.dependencies.set(cellIdx, new Set());
    }
    this.dependencies.get(cellIdx).add(depIdx);
  }

  generateCode(x: number, y: number): string {
    const currentIdx = this.coordsToIdx(x, y);
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
                data.addDependency(${currentIdx}, ${idx});
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
    this.dependencies.get(this.coordsToIdx(x, y))?.clear();
  }

  showError(x: number, y: number, e: Error) {
    this.setComputedValue(this.getCell(x, y), `#ERROR ${e.message}`);
  }

  computeCell(x: number, y: number): boolean {
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

  getDependencies(idx: number): number[] {
    return [...(this.dependencies.get(idx) ?? new Set()).values()];
  }

  getDependents(idx: number): number[] {
    const result = new Set<number>();
    for (const [dependent, dependencies] of this.dependencies.entries()) {
      if (dependencies.has(idx)) result.add(dependent);
    }
    return [...result];
  }

  propagateUpdates(changedCells: number[]) {
    // Copy, because we wanna push stuff into this.
    changedCells = changedCells.slice();
    for (const idx of changedCells) {
      const [x, y] = this.idxToCoords(idx);
      this.computeCell(x, y);
      for (const dep of this.getDependents(idx)) {
        changedCells.push(dep);
      }
    }
  }
}
