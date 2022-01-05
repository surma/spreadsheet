/** @jsx h */
import { h, Fragment } from "preact";
import { useState } from "preact/hooks";

function range(length) {
  return Array.from({ length }).map((_, i) => i);
}

function excelColumn(idx) {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

function excelAddress(sheet, x, y) {
  return `${excelColumn(x)}${y}`;
}

function fromExcelAddress(addr) {
  const x = addr[0].charCodeAt(0) - "A".charCodeAt(0);
  const y = parseInt(addr[1]);
  return { x, y };
}

function newSpreadsheet(cols, rows) {
  return {
    cols,
    rows,
    cells: Array.from({ length: cols * rows }, (_, i) => ({
      x: i % cols,
      y: Math.floor(i / cols),
      formula: "0",
      value: 0,
      dependencies: new Set(),
    })),
  };
}

function getCell(sheet, x, y) {
  return sheet.cells[y * sheet.cols + x];
}

function iterate(sheet) {
  let didAnUpdate = false;
  for (const cell of sheet.cells) {
    const newValue = evalFormula(sheet, cell);
    didAnUpdate = didAnUpdate || newValue != cell.value;
    cell.value = newValue;
  }
  return didAnUpdate;
}

function checkForCycles(sheet) {
  for (const cell of sheet.cells) {
    const cycle = findCycle(sheet, excelAddress(sheet, cell.x, cell.y));
    if (cycle) return cycle;
  }
  return null;
}

function findCycle(sheet, origin, visited = [origin]) {
  const { x, y } = fromExcelAddress(visited[visited.length - 1]);
  for (const dep of getCell(sheet, x, y).dependencies) {
    if (dep === origin) return [...visited, dep];
    if (!visited.includes(dep)) {
      const cycle = findCycle(sheet, origin, [...visited, dep]);
      if (cycle) return cycle;
    }
  }
  return null;
}

function update(sheet) {
  while (iterate(sheet)) {
    const cycle = checkForCycles(sheet);
    if (cycle) {
      throw Error(`Found a cycle: ${cycle.join("->")}`);
    }
  }
}

function evalFormula(sheet, thecell) {
  const code = `
    (function() {
      function cell(name) {
        const {x, y} = fromExcelAddress(name); 
        thecell.dependencies.add(excelAddress(sheet, x, y))
        return getCell(sheet, x, y).value
      }
      return ${thecell.formula};
    })();
  `;
  return eval(code);
}

export default function ({ cols, rows }) {
  const [sheet, setSheet] = useState(newSpreadsheet(cols, rows));
  const [error, setError] = useState(null);
  window.sheet = sheet;
  function setCellFormula(sheet, x, y, v) {
    const cell = getCell(sheet, x, y);
    cell.formula = v;
    // If the formula changed, we have to start over with analyzing dependencies.
    cell.dependencies = new Set();
    try {
      update(sheet);
      // Shallow copy so preact doesn’t skip rendering.
      setSheet({ ...sheet });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Fragment>
      {error ? <pre>{error}</pre> : null}
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
    </Fragment>
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
