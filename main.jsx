/** @jsx h */
import {render, h, Fragment} from "preact";

import Excel from "./excel.jsx";

const main = document.querySelector("main");

render(<Excel rows={10} cols={10} />, main);