export interface DisplaySpreadsheetData {
  rows: number;
  cols: number;
  cells: DisplayCell[];
}

export interface DisplayCell {
  idx: number;
  value: string;
  displayValue: string;
}
