"use client";

import { useRef, useState } from "react";

type VideoPlayerProps = {
  src: string;
  videoRef?: (element: HTMLVideoElement | null) => void;
  onMarkTime?: (seconds: number) => void;
};

export default function VideoPlayer({ src, videoRef, onMarkTime }: VideoPlayerProps) {
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const localRef = useRef<HTMLVideoElement | null>(null);
  return (
    <div className="mt-3">
      <video
        ref={(element) => {
          localRef.current = element;
          videoRef?.(element);
        }}
        controls
        playsInline
        preload="metadata"
        src={src}
        onLoadedMetadata={() => setReady(true)}
        onLoadedData={() => setError("")}
        onError={(event) => {
          const code = event.currentTarget.error?.code;
          setReady(false);
          setError(code === 3 || code === 4
            ? "O navegador não conseguiu reproduzir este vídeo. Teste a aceleração gráfica nas configurações e reinicie o navegador, ou teste em outro navegador. Se persistir, peça ao editor para reenviar o arquivo."
            : "Falha ao carregar o vídeo. Confira a conexão e atualize a página.");
        }}
        className="max-h-[70vh] w-full rounded-lg bg-black"
      />
      {onMarkTime && (
        <button type="button" disabled={!ready || !!error}
          onClick={() => {
            const video = localRef.current;
            if (!video) return;
            video.pause();
            onMarkTime(video.currentTime);
          }}
          className="mt-3 rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-40">
          Comentar neste instante
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
