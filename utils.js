// Creates an array [0, 1, 2, ..., length]
export function range(length) {
  return Array.from({ length }, (_, i) => i);
}

export function clamp(min, v, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
