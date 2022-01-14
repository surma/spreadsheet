/* @jsx h */
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import { spreadsheetColumn } from "./spreadsheet-data.js";
import useSpreadsheetData from "./use-spreadsheet-data.ts";
import { range } from "./utils.ts";

import classes from "./spreadsheet.module.css";

const MOVE_KEYS = ["MetaLeft", "AltLeft"];

function getCell(data, x, y) {
  return data.cells[y * data.cols + x];
}

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
  const [data, dispatch, busy] = useSpreadsheetData(rows, cols);
  const { current: focusedCell } = useRef({ x: 0, y: 0 });

  function setFocusedCell(x, y) {
    focusedCell.x = x;
    focusedCell.y = y;
  }

  useEffect(() => {
    let currentPressedMoveKey = undefined;

    function downListener(ev) {
      if (MOVE_KEYS.includes(ev.code) && currentPressedMoveKey === undefined) {
        currentPressedMoveKey = ev.code;
        return;
      }
      if (ev.code.startsWith("Arrow") && currentPressedMoveKey !== undefined) {
        ev.preventDefault();
        const direction = ev.code.slice("Arrow".length);
        const newPos = calcNewPosition(focusedCell, rows, cols, direction);
        focusCell(newPos.x, newPos.y);
      }
    }

    function upListener(ev) {
      if (ev.code === currentPressedMoveKey) {
        currentPressedMoveKey = undefined;
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

  if (!data) {
    return <h1>Setting up...</h1>;
  }
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
                busy={busy}
                cell={getCell(data, x, y)}
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

function Cell({ x, y, onEdit, cell, set, busy }) {
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
      disabled={busy}
      value={isEditing ? cell.value : cell.displayValue}
      onfocus={() => {
        setEditing(true);
        onEdit();
      }}
      title={cell.displayValue}
      readonly={!isEditing}
      onblur={(ev) => {
        setEditing(false);
        set(ev.target.value);
      }}
    />
  );
}
