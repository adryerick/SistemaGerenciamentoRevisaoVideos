/** Single byte range, including suffix ranges used for MP4 metadata/seek. */
export function parseVideoRange(range: string | null, fileSize: number) {
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0) return null;
  if (!range) return { start: 0, end: fileSize - 1, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return null;
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    start = Math.max(0, fileSize - suffix);
    end = fileSize - 1;
  } else {
    start = Number(match[1]);
    const requestedEnd = match[2] ? Number(match[2]) : fileSize - 1;
    if (!Number.isSafeInteger(requestedEnd)) return null;
    end = Math.min(requestedEnd, fileSize - 1);
  }
  if (!Number.isSafeInteger(start) || start >= fileSize || start > end) return null;
  return { start, end, partial: true };
}
