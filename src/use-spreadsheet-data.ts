import { useWorkerizedReducer } from "use-workerized-reducer/preact";

import { newSpreadsheetData } from "./spreadsheet-data.js";

const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

export default function useSpreadsheetData(rows, cols) {
  const [state, dispatch, busy] = useWorkerizedReducer(
    worker,
    "spreadsheetData",
    newSpreadsheetData(rows, cols)
  );
  return [state, dispatch, busy];
}
