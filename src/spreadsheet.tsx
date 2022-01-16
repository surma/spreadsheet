/* @jsx h */
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import { spreadsheetColumn } from "./spreadsheet-data.js";
import useSpreadsheetData from "./use-spreadsheet-data.ts";
import useCustomFocus from "./use-custom-focus.ts";
import { range } from "./utils.ts";

import classes from "./spreadsheet.module.css";

const MOVE_KEYS = ["MetaLeft", "AltLeft"];
const EXPAND_KEYS = ["ShiftLeft"];

function getCell(data, x, y) {
  return data.cells[y * data.cols + x];
}

const navigation = {
  Up: { x: 0, y: -1 },
  Down: { x: 0, y: 1 },
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 },
};

export default function Spreadsheet({ rows, cols }) {
  const [data, dispatch, busy] = useSpreadsheetData(rows, cols);
  const [
    focus,
    { focusSingleCell, isInFocus, moveFocus, expandFocus, toggleEditing },
  ] = useCustomFocus(rows, cols);

  function setFocusedCell(x, y) {
    focusSingleCell(x, y);
  }

  useEffect(() => {
    let moveKeyDown = null;
    let expandKeyDown = null;

    function downListener(ev) {
      if (MOVE_KEYS.includes(ev.code)) {
        moveKeyDown = ev.code;
        return;
      }
      if (EXPAND_KEYS.includes(ev.code)) {
        expandKeyDown = ev.code;
        return;
      }
      if (ev.code.startsWith("Arrow") && moveKeyDown) {
        ev.preventDefault();
        const direction = navigation[ev.code.slice("Arrow".length)];
        moveFocus(direction.x, direction.y);
        return;
      }
      if (ev.code.startsWith("Arrow") && expandKeyDown) {
        ev.preventDefault();
        const direction = navigation[ev.code.slice("Arrow".length)];
        expandFocus(direction.x, direction.y);
        return;
      }
      if (ev.code === "Enter") {
        ev.preventDefault();
        toggleEditing();
      }
    }

    function upListener(ev) {
      if (ev.code === moveKeyDown) {
        moveKeyDown = null;
        return;
      }
      if (ev.code === expandKeyDown) {
        expandKeyDown = null;
        return;
      }
    }
    document.addEventListener("keydown", downListener, { capture: true });
    document.addEventListener("keyup", upListener, { capture: true });
    return () => {
      document.removeEventListener("keydown", downListener, { capture: true });
      document.removeEventListener("keyup", upListener, { capture: true });
    };
  }, []);

  function setValue(value) {
    dispatch({
      x: focus.topLeft.x,
      y: focus.topLeft.y,
      value,
    });
    // for(const {x, y} of focusedCells()) {
    // }
  }

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
                isFocused={isInFocus(x, y)}
                isEditing={
                  focus.editing &&
                  focus.topLeft.x === x &&
                  focus.topLeft.y === y
                }
                busy={busy}
                cell={getCell(data, x, y)}
                set={setValue}
                onEdit={() => setFocusedCell(x, y)}
              />
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
}

function Cell({ x, y, isFocused, isEditing, onEdit, cell, set, busy }) {
  const ref = useRef(null);
  const classNames = [classes.cell];
  if (isFocused) classNames.push(classes.focused);

  useEffect(() => {
    if (isEditing) ref.current?.select();
  }, [isEditing]);

  if (!isEditing) {
    return <span class={classNames.join(" ")}>{cell.displayValue}</span>;
  }

  return (
    <input
      data-x={x}
      data-y={y}
      ref={ref}
      class={classNames.join(" ")}
      type="text"
      disabled={busy}
      value={cell.value}
      title={cell.displayValue}
    />
  );
}
