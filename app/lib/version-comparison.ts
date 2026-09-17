export function comparisonTime(seconds: number, duration: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Number.isFinite(duration) && duration >= 0 ? Math.min(seconds, duration) : seconds;
}
export function seekComparison(video: HTMLVideoElement, seconds: number) {
  video.pause();
  video.currentTime = comparisonTime(seconds, video.duration);
}
