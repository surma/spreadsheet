import { initWorkerizedReducer } from "use-workerized-reducer/preact";

import { SpreadsheetData } from "./spreadsheet-data.js";

function calcDisplayValue(cell) {
  if (typeof cell.computedValue === "function") {
    return "<func>";
  } else {
    return JSON.stringify(cell.computedValue);
  }
}

initWorkerizedReducer(
  "spreadsheetData",
  (data, newValues, localState) => {
    if (!localState.spreadsheet) {
      localState.spreadsheet = new SpreadsheetData(data.cols, data.rows);
    }

    // Update changed cells
    const { spreadsheet } = localState;
    for (const { x, y, value } of newValues) {
      const cell = spreadsheet.getCell(x, y);
      cell.value = value;
      spreadsheet.resetDependencies(x, y);
    }

    try {
      spreadsheet.propagateAllUpdates();
    } catch (e) {
      spreadsheet.showError(x, y, e);
    }
    for (const [idx, cell] of spreadsheet.cells.entries()) {
      data.cells[idx].value = cell.value;
      data.cells[idx].displayValue = calcDisplayValue(cell);
    }
  },
  () => ({})
);
