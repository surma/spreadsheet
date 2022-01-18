/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from "preact";
import Spreadsheet from "./spreadsheet.tsx";
import { useSpreadsheetStorage } from "./use-spreadsheet-storage.ts";

import classes from "./stored-spreadsheet.module.css";

interface StoredSpreadsheetProps {
  rows: number;
  cols: number;
}

export function StoredSpreadsheet({ rows, cols }: StoredSpreadsheetProps) {
  const { initialData, save, saving } = useSpreadsheetStorage(rows, cols);

  if (!initialData) {
    return <p>Loading spreadsheet data...</p>;
  }

  return (
    <>
      <Spreadsheet initialData={initialData} save={save} />
      {saving && <div class={classes.saving}>Saving spreadsheet data...</div>}
    </>
  );
}
