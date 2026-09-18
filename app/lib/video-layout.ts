/** Use the decoded frame dimensions, including portrait and nonstandard exports. */
export function videoAspectRatio(width: number, height: number): number {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? width / height
    : 16 / 9;
}

export function videoLayout(ratio: number) {
  return { width: `min(100%, ${70 * ratio}vh)`, aspectRatio: String(ratio) };
}
