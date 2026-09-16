export const MAX_VIDEO_SIZE = 250 * 1024 * 1024;
export const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "m4v", "mkv", "avi", "mts", "m2ts"];
export const VIDEO_ACCEPT = VIDEO_EXTENSIONS.map((extension) => `.${extension}`).join(",");

export function validateVideoFile(name: string, size: number) {
  if (!size) return "Selecione um vídeo que não esteja vazio.";
  if (size > MAX_VIDEO_SIZE) return "O vídeo deve ter no máximo 250 MB.";
  if (!VIDEO_EXTENSIONS.includes(name.split(".").pop()?.toLowerCase() ?? "")) {
    return "Envie MP4, MOV, WebM, M4V, MKV, AVI, MTS ou M2TS.";
  }
  return null;
}
