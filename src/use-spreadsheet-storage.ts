import { get, set } from "idb-keyval";
import { useCallback, useEffect, useState } from "preact/hooks";

import { DisplaySpreadsheetData } from "./types.ts";

export function newDisplaySpreadsheetData(
  rows: number,
  cols: number
): DisplaySpreadsheetData {
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

async function getSpreadsheetData() {
  return await get<DisplaySpreadsheetData | undefined>("spreadsheet");
}

async function setSpreadsheetData(data: DisplaySpreadsheetData) {
  return await set("spreadsheet", data);
}

export function useSpreadsheetStorage(
  cols: number,
  rows: number
): {
  initialData: DisplaySpreadsheetData | undefined;
  save: (data: DisplaySpreadsheetData) => void;
  saving: boolean;
} {
  const [initialData, setInitialData] = useState<
    DisplaySpreadsheetData | undefined
  >(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSpreadsheetData().then((data) => {
      if (data) {
        setInitialData(data);
      } else {
        setInitialData(newDisplaySpreadsheetData(rows, cols));
      }
    });
  }, [rows, cols]);

  const save = useCallback(async (data: DisplaySpreadsheetData) => {
    setSaving(true);
    await setSpreadsheetData(data);
    setSaving(false);
  }, []);

  return { initialData, save, saving };
}
