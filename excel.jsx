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

function newSpreadsheet(cols, rows) {
  return {
    cells: Array.from({ length: rows }, () =>
      Array.from({ length: cols }).map(() => ({
        formula: "0",
        value: 0,
      }))
    ),
  };
}

function iterate(sheet) {
  let didAnUpdate = false;
  for (let y = 0; y < sheet.cells.length; y++) {
    const row = sheet.cells[y];
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      const newValue = evalFormula(sheet, cell.formula);
      didAnUpdate = didAnUpdate || newValue != cell.value;
      cell.value = newValue;
    }
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
        .map((row, y) =>
          row
            .map(
              (cell, x) =>
                `const ${excelColumn(x)}${y} = ${sheet.cells[y][x].value};`
            )
            .join("\n")
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
    sheet.cells[y][x].formula = v;
    update(sheet);
    // Avoid object equality so preact doesn’t debounce.
    setSheet({
      cells: sheet.cells,
    });
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
                cell={sheet.cells[row][col]}
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
