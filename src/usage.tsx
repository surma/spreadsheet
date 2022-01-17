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
        <kbd>Shift</kbd> + <kbd>↑↓→←</kbd> to expand the selection.
      </p>
      <p>
        <kbd>Enter</kbd> to edit a cell. <kbd>Enter</kbd> again to save the
        cell.
      </p>
      <p>Mouse navigation is not currently supported.</p>
      <h3>Functions:</h3>
      <p>
        Everything is JavaScript. You have access to <code>Math.sin()</code> and
        all the other stuff. Note that conditionals (like <code>if</code> or the
        ternary operator <code>?</code>) and dynamic, relative addresses might
        break accurate recalcuations of the cells. We might fix this...
      </p>
      <dl>
        <dt>
          <code>rel(dx, dy)</code>
        </dt>
        <dd>Reference a cell’s value relative to the current one.</dd>
      </dl>
    </div>
  );
}
