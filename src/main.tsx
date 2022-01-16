/// <reference types="vite/client" />

/** @jsx h */
import { render, h } from "preact";
import "preact/debug";

import App from "./app.tsx";

const main = document.querySelector("main");
render(<App />, main);
