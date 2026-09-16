"use client";

import { useState } from "react";

export default function VideoPlayer({ src }: { src: string }) {
  const [error, setError] = useState("");
  return (
    <div className="mt-3">
      <video
        controls
        playsInline
        preload="metadata"
        src={src}
        onLoadedData={() => setError("")}
        onError={(event) => {
          const code = event.currentTarget.error?.code;
          setError(code === 3 || code === 4
            ? "Não foi possível reproduzir este arquivo. Peça ao editor para reenviar o vídeo para prepará-lo no formato compatível."
            : "Falha ao carregar o vídeo. Confira a conexão e atualize a página.");
        }}
        className="max-h-[70vh] w-full rounded-lg bg-black"
      />
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
