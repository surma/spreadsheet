/* @jsx h */
import { h, Fragment } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import "./classlist-hook.js";
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
    {
      focusSingleCell,
      isInFocus,
      moveFocus,
      expandFocus,
      toggleEditing,
      focusedCells,
    },
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
    for (const { x, y } of focusedCells()) {
      dispatch({
        x,
        y,
        value,
      });
    }
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
              />
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
}

function Cell({ x, y, isFocused, isEditing, cell, set, busy }) {
  const ref = useRef(null);
  // Have to maintain what’s in the input field, because otherwise the re-render
  // caused by `isEditing` going from true to false will reset the text field
  // before I can grab the value.
  const inputRef = useRef<{ value?: string }>({});

  useEffect(() => {
    if (isEditing) ref.current?.select();
    if (!isEditing && inputRef.current.value) set(inputRef.current.value);
  }, [isEditing]);

  return (
    <Fragment>
      <span
        classes={[
          classes.cell,
          isFocused ? classes.focused : null,
          isEditing ? classes.hidden : null,
          busy ? classes.busy : null,
        ]}
      >
        {cell.displayValue}
      </span>
      <input
        hidden={!isEditing}
        data-x={x}
        data-y={y}
        ref={ref}
        onInput={(ev) => {
          inputRef.current.value = (ev.target as HTMLInputElement).value;
        }}
        classes={[
          classes.cell,
          isFocused ? classes.focused : null,
          !isEditing ? classes.hidden : null,
        ]}
        type="text"
        disabled={busy}
        value={cell.value}
        title={cell.displayValue}
      />
    </Fragment>
  );
}
