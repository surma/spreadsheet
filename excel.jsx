/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";

function range(length) {
  return Array.from({ length }).map((_, i) => i);
}

function idxToChar(idx) {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

function excelColumn(idx) {
  const result = [idxToChar(idx % 26)];
  if (idx >= 26) {
    result.unshift(idxToChar(Math.floor(idx / 26)));
  }
  return result.filter(Boolean).join("");
}

function excelAddress(sheet, idx) {
  const x = idx % sheet.cols;
  const y = Math.floor(idx / sheet.cols);
  return `${excelColumn(x)}${y}`;
}

function newSpreadsheet(cols, rows) {
  return {
    cols,
    rows,
    cells: Array.from({ length: cols * rows }, () => ({
      formula: "0",
      value: 0,
    })),
  };
}

function getCell(sheet, x, y) {
  return sheet.cells[y * sheet.cols + x];
}

function iterate(sheet) {
  let didAnUpdate = false;
  for (const cell of sheet.cells) {
    const newValue = evalFormula(sheet, cell.formula);
    didAnUpdate = didAnUpdate || newValue != cell.value;
    cell.value = newValue;
  }
  return didAnUpdate;
}

function update(sheet) {
  while (iterate(sheet));
}

function evalFormula(sheet, formula) {
  const code = `
    (function() {
      ${sheet.cells
        .map(
          (cell, idx) => `const ${excelAddress(sheet, idx)} = ${cell.value};`
        )
        .join("\n")}
      return ${formula};
    })();
  `;
  return eval(code);
}

export default function ({ cols, rows }) {
  const [sheet, setSheet] = useState(newSpreadsheet(cols, rows));

  function setCellFormula(sheet, x, y, v) {
    getCell(sheet, x, y).formula = v;
    update(sheet);
    // Shallow copy so preact doesn’t skip rendering
    setSheet({ ...sheet });
  }

  return (
    <table>
      <tr>
        <td />
        {range(cols).map((col) => (
          <td>{excelColumn(col)}</td>
        ))}
      </tr>
      {range(rows).map((row) => (
        <tr>
          <td>{row}</td>
          {range(cols).map((col) => (
            <td>
              <Cell
                row={row}
                col={col}
                setCellFormula={(v) => setCellFormula(sheet, col, row, v)}
                cell={getCell(sheet, col, row)}
              />
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
}

function Cell({ row, col, cell, setCellFormula }) {
  const [isEditing, setEditing] = useState(false);
  if (isEditing) {
    return (
      <input
        type="text"
        onblur={(ev) => {
          const formula = ev.target.value;
          setEditing(false);
          setCellFormula(formula);
        }}
        value={cell.formula}
      />
    );
  }
  return <span onclick={() => setEditing(true)}>{cell.value}</span>;
}
