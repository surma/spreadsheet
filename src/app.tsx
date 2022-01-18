/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "preact";

import Spreadsheet from "./spreadsheet.tsx";
import Usage from "./usage.tsx";
import { useLock } from "./use-lock.ts";

export default function App() {
  const [locked, steal] = useLock("main");

  if (!locked) {
    return (
      <div>
        <p>This spreadsheet is currently being edited in a different tab.</p>
        <button onClick={steal}>Edit here instead</button>
      </div>
    );
  }

  return (
    <>
      <Spreadsheet rows={20} cols={20} />
      <Usage />
    </>
  );
}
