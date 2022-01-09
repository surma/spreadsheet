// Creates an array [0, 1, 2, ..., length]
export function range(length) {
  return Array.from({ length }, (_, i) => i);
}
