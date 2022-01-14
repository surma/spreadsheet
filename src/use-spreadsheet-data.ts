import { useWorkerizedReducer } from "use-workerized-reducer/preact";

const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

function newSpreadsheetDisplayData(rows, cols) {
  return {
    rows,
    cols,
    cells: Array.from({ length: rows * cols }, (_, idx) => ({
      idx,
      value: "0",
      displayValue: "0",
    })),
  };
}

export default function useSpreadsheetData(rows, cols) {
  const [state, dispatch, busy] = useWorkerizedReducer(
    worker,
    "spreadsheetData",
    newSpreadsheetDisplayData(rows, cols)
  );
  return [state, dispatch, busy];
}
