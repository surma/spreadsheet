import { initWorkerizedReducer } from "use-workerized-reducer/preact";

import { SpreadsheetData } from "./spreadsheet-data.js";

initWorkerizedReducer(
  "spreadsheetData",
  (data, { x, y, value }, localState) => {
    if (!localState.spreadsheet) {
      localState.spreadsheet = new SpreadsheetData(data.cols, data.rows);
    }
    const { spreadsheet } = localState;
    const cell = spreadsheet.getCell(x, y);
    cell.value = value;
    spreadsheet.resetDependencies(x, y);
    try {
      spreadsheet.propagateAllUpdates();
    } catch (e) {
      spreadsheet.showError(x, y, e);
    }
    for (const [idx, cell] of spreadsheet.cells.entries()) {
      if (typeof cell.computedValue === "function") {
        data.cells[idx].displayValue = "<func>";
      } else {
        data.cells[idx].displayValue = cell.computedValue;
      }
      data.cells[idx].value = cell.value;
    }
  },
  () => ({})
);
