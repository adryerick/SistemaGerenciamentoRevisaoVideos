/** Keep transport progress separate from the server's conversion phase. */
export function uploadVideo(url: string, file: File, onProgress: (percentage: number) => void): Promise<{ id: number }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.timeout = 12 * 60 * 1000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(100, Math.round(event.loaded / event.total * 100)));
    };
    request.upload.onload = () => onProgress(100);
    request.onerror = () => reject(new Error("A conexão caiu. Seu arquivo foi mantido; confira a internet e tente novamente."));
    request.ontimeout = () => reject(new Error("O servidor demorou a responder. Atualize as versões antes de tentar novamente, para evitar duplicar o vídeo."));
    request.onload = () => {
      let result: { id?: number; error?: string } = {};
      try { result = JSON.parse(request.responseText); } catch { /* A gateway may return HTML. */ }
      if (request.status >= 200 && request.status < 300 && typeof result.id === "number") {
        resolve({ id: result.id });
      } else {
        reject(new Error(result.error ?? (request.status === 413
          ? "O serviço de compartilhamento recusou o tamanho do arquivo. Tente um vídeo menor ou envie pelo endereço local."
          : request.status === 401 ? "Sua sessão expirou. Entre novamente para enviar o vídeo."
          : "O servidor não confirmou o envio. Confira as versões e tente novamente.")));
      }
    };
    const form = new FormData();
    form.append("video", file);
    request.send(form);
  });
}
