"use client";
import { useRef, useState } from "react";
import type { VideoVersion } from "../types";
import VideoPlayer from "./VideoPlayer";
import { comparisonTime } from "../lib/version-comparison";
import { formatTimestamp } from "../lib/review-feedback";

export default function VersionComparison({ versions, token }: { versions: VideoVersion[]; token?: string }) {
  const available = versions.filter((version) => version.videoUrl);
  const [open, setOpen] = useState(false);
  const [leftId, setLeftId] = useState(available[0]?.id);
  const [rightId, setRightId] = useState(available[1]?.id);
  const [time, setTime] = useState(0);
  const [message, setMessage] = useState("");
  const players = useRef<(HTMLVideoElement | null)[]>([null, null]);
  if (available.length < 2) return null;
  const left = available.find((version) => version.id === leftId) ?? available[0];
  const right = available.find((version) => version.id === rightId && version.id !== left.id) ?? available.find((version) => version.id !== left.id)!;
  function sync() {
    const source = players.current[0];
    if (!source || source.readyState < 1 || players.current.some((video) => !video || video.readyState < 1)) { setMessage("Aguarde os dois vídeos carregarem."); return; }
    const seconds = source.currentTime;
    setTime(seconds);
    players.current.forEach((video) => { if (video) { video.pause(); video.currentTime = comparisonTime(seconds, video.duration); } });
    setMessage(`Vídeos pausados em ${formatTimestamp(seconds)}. Vídeos mais curtos param no final.`);
  }
  return <section className="mt-6 rounded-xl border border-zinc-700 bg-[#151517] p-5">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="text-sm font-medium">{open ? "Fechar comparação" : "Comparar versões"}</button>
    {open && <>
      <p className="mt-2 text-xs text-zinc-400">Confira o mesmo trecho em duas versões. Avance o vídeo da esquerda e sincronize; reprodução independente.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[left, right].map((version, index) => {
          return <div key={index} className="min-w-0">
            <select aria-label={`Versão ${index === 0 ? "esquerda" : "direita"} da comparação`} value={version.id}
              onChange={(event) => { setTime(players.current[index]?.currentTime ?? time); (index ? setRightId : setLeftId)(Number(event.target.value)); }} className="w-full rounded-lg border border-zinc-700 bg-[#111113] p-2 text-sm">
              {available.map((item) => <option key={item.id} value={item.id} disabled={item.id === (index ? left.id : right.id)}>V{String(item.number).padStart(2, "0")} · {item.fileName}</option>)}
            </select>
            <VideoPlayer key={version.id} src={token ? `/api/revisao/${token}/videos/${version.id}` : version.videoUrl!} initialTime={time} videoRef={(element) => { players.current[index] = element; }} />
          </div>;
        })}
      </div>
      <button type="button" onClick={sync} className="mt-4 rounded-lg border border-zinc-600 px-3 py-2 text-sm">Sincronizar com o vídeo da esquerda</button>
      <button type="button" onClick={() => { setTime(players.current[0]?.currentTime ?? time); setLeftId(right.id); setRightId(left.id); }} className="ml-3 mt-4 rounded-lg border border-zinc-600 px-3 py-2 text-sm">Inverter versões</button>
      {message && <p role="status" className="mt-2 text-xs text-zinc-300">{message}</p>}
    </>}
  </section>;
}
