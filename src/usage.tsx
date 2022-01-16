/** @jsx h */
import { h } from "preact";

import classes from "./usage.module.css";

// TODO(lucacasonato): there is no need for this to be JSX. This can just be
// part of the static HTML.
export default function Usage() {
  return (
    <div class={classes.usage}>
      <h2>Usage</h2>
      <p>
        <kbd>Alt</kbd> + <kbd>↑↓→←</kbd> to navigate the cursor.
      </p>
      <p>
        <kbd>Shift</kbd> + <kbd>↑↓→←</kbd> to expand or shrink the selection.
      </p>
      <p>
        <kbd>Enter</kbd> to edit a cell. <kbd>Enter</kbd> again to save the
        cell.
      </p>
      <p>Mouse navigation is not currently supported.</p>
    </div>
  );
}
