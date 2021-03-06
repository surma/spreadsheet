/** @jsx h */
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";

import "./classlist-hook.ts";
import { spreadsheetColumn } from "./spreadsheet-data.ts";
import useSpreadsheetData from "./use-spreadsheet-data.ts";
import useCustomFocus from "./use-custom-focus.ts";
import { range } from "./utils.ts";
import { DisplaySpreadsheetData } from "./types.ts";

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

interface SpreadsheetProps {
  initialData: DisplaySpreadsheetData;
  save: (data: DisplaySpreadsheetData) => void;
}

export default function Spreadsheet({ initialData, save }: SpreadsheetProps) {
  const [data, dispatch, busy] = useSpreadsheetData(initialData);
  const rows = data?.rows ?? initialData.rows;
  const cols = data?.cols ?? initialData.cols;
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

  useEffect(() => {
    save(data);
  }, [data]);

  useEffect(() => {
    let moveKeyDown: string | null = null;
    let expandKeyDown: string | null = null;

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
        const direction =
          navigation[ev.code.slice("Arrow".length) as keyof typeof navigation];
        moveFocus(direction.x, direction.y);
        return;
      }
      if (ev.code.startsWith("Arrow") && expandKeyDown) {
        ev.preventDefault();
        const direction =
          navigation[ev.code.slice("Arrow".length) as keyof typeof navigation];
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
    dispatch([...focusedCells()].map(({ x, y }) => ({ x, y, value })));
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
  // Have to maintain what???s in the input field, because otherwise the re-render
  // caused by `isEditing` going from true to false will reset the text field
  // before I can grab the value.
  const inputRef = useRef<{ value?: string }>({});

  useEffect(() => {
    if (isEditing) ref.current?.select();
    if (!isEditing && inputRef.current.value) set(inputRef.current.value);
  }, [isEditing]);

  return (
    <div classes={[classes.cell, isFocused ? classes.focused : null]}>
      <span
        classes={[
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
          isFocused ? classes.focused : null,
          !isEditing ? classes.hidden : null,
        ]}
        type="text"
        disabled={busy}
        value={cell.value}
        title={cell.displayValue}
      />
    </div>
  );
}
