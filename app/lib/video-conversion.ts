import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

export class VideoConversionError extends Error {
  constructor(message: string, public readonly status = 422) {
    super(message);
  }
}

/** Generate an 8-bit H.264/AAC MP4; never modify the input file. */
export async function convertVideoForBrowser(input: string, output: string) {
  if (!ffmpegPath) {
    throw new VideoConversionError("Conversor indisponível neste servidor. Instale as dependências do projeto.", 503);
  }

  try {
    await execFileAsync(ffmpegPath, [
      "-hide_banner", "-loglevel", "error", "-nostdin", "-n",
      "-protocol_whitelist", "file,pipe", "-threads", "2", "-i", input,
      "-map", "0:v:0", "-map", "0:a:0?", "-sn", "-dn",
      "-map_metadata", "-1", "-map_chapters", "-1",
      "-c:v", "libx264", "-threads", "2", "-preset", "veryfast", "-crf", "20",
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-ar", "48000",
      "-movflags", "+faststart", "-f", "mp4", output,
    ], { windowsHide: true, timeout: 10 * 60 * 1000, maxBuffer: 2 * 1024 * 1024 });
  } catch (error) {
    const failure = error as { code?: string; killed?: boolean; stderr?: string };
    console.error("Falha na conversão de vídeo", { code: failure.code, stderr: failure.stderr?.slice(-2000) });
    if (failure.code === "ENOENT") {
      throw new VideoConversionError("Conversor não instalado. Reinstale as dependências e reinicie o servidor.", 503);
    }
    if (failure.killed) {
      throw new VideoConversionError("O preparo do vídeo excedeu o tempo disponível. Tente uma exportação menor.", 422);
    }
    throw new VideoConversionError("Não foi possível decodificar este arquivo. Verifique se ele abre no computador e exporte novamente em H.264, sem proteção.");
  }
}
