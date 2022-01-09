/* @jsx h */
import { h } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";

import useSpreadsheetData, { spreadsheetColumn } from "./spreadsheet-data.js";
import { range } from "./utils.js";

import classes from "./spreadsheet.module.css";

const MOVE_KEY = "MetaLeft";

function focusCell(x, y) {
  document.querySelector(`*[data-x="${x}"][data-y="${y}"`)?.focus();
}

const navigation = {
  Up: { x: 0, y: -1 },
  Down: { x: 0, y: 1 },
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 },
};
function calcNewPosition(currentPos, rows, cols, direction) {
  const newPos = { ...currentPos };
  const delta = navigation[direction];
  newPos.x += delta.x;
  newPos.y += delta.y;
  if (newPos.x < 0 || newPos.x >= cols) {
    newPos.x = (newPos.x + cols) % cols;
  }
  if (newPos.y < 0 || newPos.y >= rows) {
    newPos.y = (newPos.y + rows) % rows;
  }
  return newPos;
}

export default function Spreadsheet({ rows, cols }) {
  const [data, dispatch] = useSpreadsheetData(rows, cols);
  const { current: focusedCell } = useRef({ x: 0, y: 0 });

  function setFocusedCell(x, y) {
    focusedCell.x = x;
    focusedCell.y = y;
  }

  useEffect(() => {
    let metaIsDown = false;
    function downListener(ev) {
      if (ev.code == MOVE_KEY) {
        metaIsDown = true;
        return;
      }
      if (ev.code.startsWith("Arrow") && metaIsDown) {
        ev.preventDefault();
        const direction = ev.code.slice("Arrow".length);
        const newPos = calcNewPosition(focusedCell, rows, cols, direction);
        focusCell(newPos.x, newPos.y);
      }
    }

    function upListener(ev) {
      if (ev.code == MOVE_KEY) {
        metaIsDown = false;
        return;
      }
    }
    document.addEventListener("keydown", downListener, { capture: true });
    document.addEventListener("keyup", upListener, { capture: true });
    return () => {
      document.removeEventListener("keydown", downListener);
      document.removeEventListener("keyup", upListener);
    };
  }, []);

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
                onEdit={() => setFocusedCell(x, y)}
              />
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
}

function Cell({ x, y, onEdit, cell, set }) {
  const [isEditing, setEditing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (isEditing) ref.current?.select();
  }, [isEditing]);

  return (
    <input
      data-x={x}
      data-y={y}
      ref={ref}
      class={classes.cell}
      type="text"
      value={isEditing ? cell.value : cell.computedValue}
      onfocus={() => {
        setEditing(true);
        onEdit();
      }}
      readonly={!isEditing}
      onblur={(ev) => {
        setEditing(false);
        set(ev.target.value);
      }}
    />
  );
}
