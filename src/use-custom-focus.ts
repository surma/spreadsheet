import { useEffect, useRef, useState } from "preact/hooks";
import { clamp } from "./utils.ts";

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  topLeft: Point;
  width: number;
  height: number;
}

export interface CustomFocus extends Rectangle {
  editing: boolean;
}

// Order point coordinates to the first one is top-left,
// the second one is bottom-right;
function orderPoints(p1: Point, p2: Point): [Point, Point] {
  p1 = { ...p1 };
  p2 = { ...p2 };
  if (p2.x < p1.x) {
    [p1.x, p2.x] = [p2.x, p1.x];
  }
  if (p2.y < p1.y) {
    [p1.y, p2.y] = [p2.y, p1.y];
  }
  return [p1, p2];
}

function rectangleFromPoints(p1: Point, p2: Point): Rectangle {
  const [topLeft, bottomRight] = orderPoints(p1, p2);
  return {
    topLeft,
    width: bottomRight.x - topLeft.x + 1,
    height: bottomRight.y - topLeft.y + 1,
  };
}

export default function useCustomFocus(rows: number, cols: number) {
  const [dragStart, setDragStart] = useState<null | Point>(null);
  const [focus, setFocusState] = useState<CustomFocus>({
    topLeft: { x: 0, y: 0 },
    width: 1,
    height: 1,
    editing: false,
  });

  function* focusedCells(): Iterable<Point> {
    for (let y = focus.topLeft.y; y < focus.topLeft.y + focus.height; y++) {
      for (let x = focus.topLeft.x; x < focus.topLeft.x + focus.width; x++) {
        yield { x, y };
      }
    }
  }

  function isInFocus(x: number, y: number): boolean {
    const isInXRange =
      x >= focus.topLeft.x && x < focus.topLeft.x + focus.width;
    const isInYRange =
      y >= focus.topLeft.y && y < focus.topLeft.y + focus.height;
    return isInXRange && isInYRange;
  }

  function focusSingleCell(topLeft: Point, editing: boolean = false) {
    setFocusState({
      topLeft: { ...topLeft },
      width: 1,
      height: 1,
      editing,
    });
  }

  function expandFocus(dx: number, dy: number) {
    setFocusState((focus) => {
      const otherP = {
        x: focus.topLeft.x + focus.width - 1,
        y: focus.topLeft.y + focus.height - 1,
      };
      if (dx < 0) {
        focus.topLeft.x += dx;
      } else {
        otherP.x += dx;
      }
      if (dy < 0) {
        focus.topLeft.y += dy;
      } else {
        otherP.y += dy;
      }
      const rect = rectangleFromPoints(focus.topLeft, otherP);
      return { ...focus, ...rect };
    });
  }

  function onMouseDown(p: Point) {
    focusSingleCell(p);
    setDragStart(p);
  }

  function onMouseMove(p: Point) {
    setDragStart((dragStart) => {
      if (!dragStart) return null;
      const rect = rectangleFromPoints(dragStart, p);
      setFocusState({
        ...rect,
        editing: false,
      });
      return dragStart;
    });
  }

  function onMouseUp(p: Point) {
    setDragStart((dragStart) => {
      if (!dragStart) return null;
      const rect = rectangleFromPoints(dragStart, p);
      setFocusState({
        ...rect,
        editing: false,
      });
      return null;
    });
  }

  function moveFocus(dx: number, dy: number) {
    setFocusState((focus) => {
      if (focus.width != 1 || focus.height != 1) {
        return {
          ...focus,
          width: 1,
          height: 1,
        };
      }
      const topLeft = {
        x: clamp(0, focus.topLeft.x + dx, cols - 1),
        y: clamp(0, focus.topLeft.y + dy, rows - 1),
      };
      return {
        ...focus,
        topLeft,
        width: 1,
        height: 1,
      };
    });
  }

  function toggleEditing() {
    setFocusState((focus) => {
      return {
        ...focus,
        editing: !focus.editing,
      };
    });
  }

  return [
    focus,
    {
      expandFocus,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      isInFocus,
      focusSingleCell,
      focusedCells,
      moveFocus,
      toggleEditing,
    },
  ];
}
