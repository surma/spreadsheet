/* @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";

import useSpreadsheetData, { spreadsheetColumn } from "./spreadsheet-data.js";
import useFocusByRef from "./use-focus-by-ref.js";
import { range } from "./utils.js";

import classes from "./spreadsheet.module.css";

export default function Spreadsheet({ rows, cols }) {
  const [data, dispatch] = useSpreadsheetData(rows, cols);

  return (
    <table class={classes.spreadsheet}>
      <tr>
        <td class={[classes.header, classes.columnheader].join(" ")} />
        {range(cols).map((x) => (
          <td class={classes.header}>{spreadsheetColumn(x)}</td>
        ))}
      </tr>
      {range(rows).map((y) => (
        <tr>
          <td class={[classes.header, classes.rowheader].join(" ")}>{y}</td>
          {range(cols).map((x) => (
            <td>
              <Cell
                x={x}
                y={y}
                cell={data.getCell(x, y)}
                set={(value) => dispatch({ x, y, value })}
              />
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
}

function Cell({ x, y, cell, set }) {
  const [isEditing, setEditing] = useState(false);
  const focusRef = useFocusByRef();

  if (isEditing) {
    return (
      <input
        class={classes.cell}
        ref={focusRef}
        type="text"
        value={cell.value}
        onblur={(ev) => {
          setEditing(false);
          set(ev.target.value);
        }}
      />
    );
  }

  return (
    <span class={classes.cell} onclick={() => setEditing(true)}>
      {cell.computedValue}
    </span>
  );
}
