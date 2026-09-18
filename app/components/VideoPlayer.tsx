"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { hasVideoMetadata, markVideoTime, seekToTimestamp, subscribeVideoReadiness } from "../lib/video-navigation";
import { timelineMarkers } from "../lib/review-collaboration";
import type { ChangeRequest } from "../types";
import { seekComparison } from "../lib/version-comparison";
import { videoAspectRatio, videoLayout } from "../lib/video-layout";

type VideoPlayerProps = {
  src: string;
  videoRef?: (element: HTMLVideoElement | null) => void;
  onMarkTime?: (seconds: number) => void;
  requests?: ChangeRequest[];
  initialTime?: number;
};

export default function VideoPlayer({ src, videoRef, onMarkTime, requests = [], initialTime = 0 }: VideoPlayerProps) {
  const [error, setError] = useState("");
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const ready = useSyncExternalStore(
    useCallback((notify) => subscribeVideoReadiness(video, notify), [video]),
    useCallback(() => hasVideoMetadata(video), [video]),
    () => false,
  );
  const [buffering, setBuffering] = useState(false);
  const duration = useSyncExternalStore(
    useCallback((notify) => subscribeVideoReadiness(video, notify), [video]),
    useCallback(() => video && Number.isFinite(video.duration) ? video.duration : 0, [video]),
    () => 0,
  );
  const markers = timelineMarkers(requests, duration);
  const ratio = useSyncExternalStore(
    useCallback((notify) => subscribeVideoReadiness(video, notify), [video]),
    useCallback(() => videoAspectRatio(video?.videoWidth ?? 0, video?.videoHeight ?? 0), [video]),
    () => 16 / 9,
  );
  const [markError, setMarkError] = useState("");
  useEffect(() => {
    if (ready && video) seekComparison(video, initialTime);
  }, [ready, video, initialTime]);
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
        style={videoLayout(ratio)}
        className="mx-auto block h-auto max-h-[70vh] max-w-full rounded-lg bg-black object-contain"
      />
      {requests.some((request) => request.timestamp) && <div className="mt-4 rounded-lg border border-zinc-700 p-3">
        <p className="text-xs font-medium text-zinc-300">Comentários na linha do tempo</p>
        {markers.length ? <>
          <div className="relative mx-3 mt-3 h-12" aria-label="Linha do tempo dos comentários">
            <div className="absolute inset-x-0 top-4 h-1 rounded-full bg-zinc-700" />
            {markers.map((marker, index) => <button key={marker.id} type="button" style={{ left: `${marker.percentage}%`, top: index % 2 ? 24 : 0 }}
              aria-label={`Comentário ${index + 1} em ${marker.timestamp}: ${marker.comment}`}
              title={`${marker.timestamp} · ${marker.status} · ${marker.comment}`}
              onClick={() => seekToTimestamp(video, marker.timestamp!)}
              className={`absolute -translate-x-1/2 rounded-full border px-1.5 py-0.5 text-[10px] ${marker.status === "Resolvido" ? "border-emerald-500 bg-emerald-950 text-emerald-200" : "border-amber-400 bg-amber-950 text-amber-100"}`}>{index + 1}</button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {markers.map((marker, index) => <button key={marker.id} type="button" onClick={() => seekToTimestamp(video, marker.timestamp!)}
              className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300">{index + 1} · {marker.timestamp} · {marker.status}</button>)}
          </div>
        </> : <p className="mt-2 text-xs text-zinc-400">{ready ? "As minutagens informadas estão fora da duração deste vídeo." : "Carregando a duração do vídeo..."}</p>}
      </div>}
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
