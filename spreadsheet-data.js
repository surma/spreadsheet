import { useReducer } from "preact/hooks";

import { range } from "./utils.js";

export function spreadsheetColumn(idx) {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

class SpreadsheetData {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = Array.from({ length: cols * rows }, () => ({
      value: 0,
      computedValue: 0,
    }));
  }

  getCell(x, y) {
    return this.cells[y * this.cols + x];
  }

  idxToCoords(idx) {
    return [idx % this.cols, Math.floor(idx / this.cols)];
  }

  generateCode(x, y) {
    const cell = this.getCell(x, y);
    return `(function () {
      ${this.cells
        .map((cell, idx) => {
          const [x, y] = this.idxToCoords(idx);
          const cellName = `${spreadsheetColumn(x)}${y}`;
          return `const ${cellName} = ${JSON.stringify(cell.computedValue)};`;
        })
        .join("\n")}
      return ${cell.value};
    })();`;
  }

  computeCell(x, y) {
    const cell = this.getCell(x, y);
    let result;
    try {
      result = eval(this.generateCode(x, y));
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
