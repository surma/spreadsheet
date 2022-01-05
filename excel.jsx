/** @jsx h */
import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import cleanSet from "clean-set";

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
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }).map(() => ({
      formula: "0",
      value: 0,
    }))
  );
}

function iterate(sheet) {
  for (let y = 0; y < sheet.length; y++) {
    const row = sheet[y];
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      sheet = cleanSet(
        sheet,
        [y, x, "value"].join("."),
        evalFormula(sheet, cell.formula)
      );
    }
  }
  return sheet;
}

function evalFormula(sheet, formula) {
  const code = `
		(function() {
			${sheet
        .map((row, y) =>
          row
            .map(
              (cell, x) => `const ${excelColumn(x)}${y} = ${sheet[y][x].value};`
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
    sheet = cleanSet(sheet, [y, x, "formula"].join("."), v);
    sheet = iterate(sheet);
    setSheet(sheet);
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
                cell={sheet[row][col]}
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
