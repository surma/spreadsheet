/* @jsx h */
import { render, h } from "preact";

import Spreadsheet from "./spreadsheet.tsx";

const main = document.querySelector("main");
render(<Spreadsheet rows={10} cols={10} />, main);
