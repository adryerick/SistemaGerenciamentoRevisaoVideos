import { parseTimestamp } from "./review-feedback";

export function hasVideoMetadata(video: HTMLVideoElement | null) {
  return !!video && video.readyState >= 1 && !video.error;
}

export function subscribeVideoReadiness(video: HTMLVideoElement | null, notify: () => void) {
  if (!video) return () => {};
  const events = ["loadedmetadata", "loadeddata", "canplay", "playing", "timeupdate", "emptied", "error"];
  events.forEach((event) => video.addEventListener(event, notify));
  return () => events.forEach((event) => video.removeEventListener(event, notify));
}

export function markVideoTime(video: HTMLVideoElement | null, onMarkTime: (seconds: number) => void) {
  if (!video || !hasVideoMetadata(video) || !Number.isFinite(video.currentTime)) return false;
  video.pause();
  onMarkTime(video.currentTime);
  return true;
}

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
