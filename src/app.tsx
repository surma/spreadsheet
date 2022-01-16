/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "preact";

import Spreadsheet from "./spreadsheet.tsx";
import Usage from "./usage.tsx";

export default function App() {
  return (
    <>
      <Spreadsheet rows={20} cols={20} />
      <Usage />
    </>
  );
}
