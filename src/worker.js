import { initWorkerizedReducer } from "use-workerized-reducer/preact";

import {
  getCell,
  resetDependencies,
  propagateAllUpdates,
  showError,
} from "./spreadsheet-data.js";

initWorkerizedReducer("spreadsheetData", (data, { x, y, value }) => {
  const cell = getCell(data, x, y);
  cell.value = value;
  resetDependencies(data, x, y);
  try {
    propagateAllUpdates(data);
  } catch (e) {
    showError(data, x, y, e);
  }
});
