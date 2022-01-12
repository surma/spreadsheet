/** Creates an array [0, 1, 2, ..., length] */
export function range(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

/** Clamps a number between a min and max value */
export function clamp(min: number, v: number, max: number) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

/** Check for deep equality of two arbitrary objects. Functions are considered
 * equal if they have the same stringified representation. */
export function isEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== typeof b) return false;
  switch (typeof a) {
    case "object": {
      return false; // TODO(lucacasonato): implement deep object equality
    }
    case "function": {
      return a.toString() === b.toString();
    }
    default: {
      return a === b;
    }
  }
}
