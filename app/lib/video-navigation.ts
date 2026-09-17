import { parseTimestamp } from "./review-feedback";

export function seekToTimestamp(video: HTMLVideoElement | null | undefined, timestamp: string) {
  const seconds = parseTimestamp(timestamp);
  if (!video || seconds === null) return;
  const seek = () => {
    video.pause();
    video.currentTime = Number.isFinite(video.duration) ? Math.min(seconds, video.duration) : seconds;
  };
  if (video.readyState >= 1) seek();
  else video.addEventListener("loadedmetadata", seek, { once: true });
  video.scrollIntoView({ behavior: "smooth", block: "center" });
  video.focus();
}
