// Creates an array [0, 1, 2, ..., length]
export function range(length) {
  return Array.from({ length }, (_, i) => i);
}

export function clamp(min, v, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

export function isEqual(a, b) {
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
