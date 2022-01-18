import { useWorkerizedReducer } from "use-workerized-reducer/preact";

import { DisplaySpreadsheetData } from "./types.ts";

const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

export default function useSpreadsheetData(
  initialData: DisplaySpreadsheetData
) {
  const [state, dispatch, busy] = useWorkerizedReducer(
    worker,
    "spreadsheetData",
    initialData
  );
  return [state, dispatch, busy];
}
