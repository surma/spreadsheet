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
  }

  getCell(x, y) {
    return this.cells[y * this.cols + x];
  }

  idxToCoords(idx) {
    return [idx % this.cols, Math.floor(idx / this.cols)];
  }

  generateCode(x, y) {
    const cell = this.getCell(x, y);
    const code = `(function () {
      const COLS=this.cols;
      const ROWS=this.rows;
      const X = ${x};
      const Y = ${y};
      ${this.cells
        .map((cell, idx) => {
          const [x, y] = this.idxToCoords(idx);
          const cellName = `${spreadsheetColumn(x)}${y}`;
          return `const ${cellName} = ${JSON.stringify(cell.computedValue)};`;
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

  computeCell(x, y) {
    const cell = this.getCell(x, y);
    let result;
    try {
      result = eval(this.generateCode(x, y)).call(this);
    } catch (e) {
      result = `#ERROR ${e.message}`;
    }
    const hasChanged = result != cell.computedValue;
    cell.computedValue = result;
    return hasChanged;
  }

  computeAllCells() {
    let hasChanged = false;
    for (const y of range(this.rows)) {
      for (const x of range(this.cols)) {
        hasChanged = hasChanged || this.computeCell(x, y);
      }
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
      data.propagateAllUpdates();
      // Shallow copy so that preact doesn’t skip rendering.
      return { data };
    },
    { data: new SpreadsheetData(rows, cols) }
  );
  return [data, dispatch];
}
