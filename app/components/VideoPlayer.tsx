"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { hasVideoMetadata, markVideoTime, subscribeVideoReadiness } from "../lib/video-navigation";

type VideoPlayerProps = {
  src: string;
  videoRef?: (element: HTMLVideoElement | null) => void;
  onMarkTime?: (seconds: number) => void;
};

export default function VideoPlayer({ src, videoRef, onMarkTime }: VideoPlayerProps) {
  const [error, setError] = useState("");
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const ready = useSyncExternalStore(
    useCallback((notify) => subscribeVideoReadiness(video, notify), [video]),
    useCallback(() => hasVideoMetadata(video), [video]),
    () => false,
  );
  const [buffering, setBuffering] = useState(false);
  const [markError, setMarkError] = useState("");
  useEffect(() => {
    videoRef?.(video);
    return () => videoRef?.(null);
  }, [video, videoRef]);
  return (
    <div className="mt-3">
      <video
        ref={setVideo}
        controls
        playsInline
        preload="metadata"
        src={src}
        onLoadedData={() => setError("")}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onPause={() => setBuffering(false)}
        onError={(event) => {
          const code = event.currentTarget.error?.code;
          setBuffering(false);
          setError(code === 3 || code === 4
            ? "O navegador não conseguiu reproduzir este vídeo. Teste a aceleração gráfica nas configurações e reinicie o navegador, ou teste em outro navegador. Se persistir, peça ao editor para reenviar o arquivo."
            : "Falha ao carregar o vídeo. Confira a conexão e atualize a página.");
        }}
        className="max-h-[70vh] w-full rounded-lg bg-black"
      />
      {buffering && <p role="status" className="mt-2 text-xs text-zinc-300">Carregando o trecho do vídeo...</p>}
      {onMarkTime && (
        <button type="button" disabled={!!error}
          onClick={() => {
            setMarkError(markVideoTime(video, onMarkTime) ? "" : "Aguarde o vídeo carregar e tente marcar novamente.");
          }}
          className="mt-3 rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-40">
          Comentar neste instante
        </button>
      )}
      {onMarkTime && !ready && !error && <p role="status" className="mt-2 text-xs text-zinc-400">A minutagem estará disponível assim que o vídeo carregar.</p>}
      {markError && !ready && <p role="status" className="mt-2 text-xs text-amber-200">{markError}</p>}
      {error && <div className="mt-3 rounded-lg border border-red-900/50 p-3">
        <p role="alert" className="text-sm text-red-300">{error}</p>
        <button type="button" onClick={() => { setError(""); video?.load(); }} className="mt-3 rounded-lg border border-zinc-600 px-3 py-2 text-sm">Tentar carregar novamente</button>
      </div>}
    </div>
  );
}
